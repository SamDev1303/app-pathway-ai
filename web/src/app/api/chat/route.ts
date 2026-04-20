import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import {
  CHAT_SYSTEM_PROMPT_V1,
  CHAT_PER_TURN_FOOTER,
  CHAT_MARA_DEFLECTION_RESPONSE,
} from "@/lib/chat-system-prompt";

export const maxDuration = 30;

// Provider selector: `openrouter-free` (default, free Qwen3) →
// `anthropic-gateway` / `openai-gateway` post-meeting swap is a 1-line flip
// via CHAT_PROVIDER env. All three share the AI SDK v6 streamText shape.
const CHAT_PROVIDER = process.env.CHAT_PROVIDER ?? "openrouter-free";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://atlas-ai.vercel.app",
    "X-Title": "Atlas AI",
  },
});

function pickModel() {
  switch (CHAT_PROVIDER) {
    case "anthropic-gateway":
      // Wired post-meeting — Vercel AI Gateway "anthropic/claude-sonnet-4-6"
      return openrouter("anthropic/claude-sonnet-4-6");
    case "openai-gateway":
      return openrouter("openai/gpt-4o-mini");
    case "openrouter-free":
    default:
      return openrouter("qwen/qwen3-next-80b-a3b-instruct:free");
  }
}

// Gemini embedding for RAG query vector. Same model/dim as wave-1 backfill.
const GEMINI_EMBED_MODEL = "gemini-embedding-001";
const GEMINI_EMBED_DIMS = 3072;

async function embedQuery(text: string): Promise<number[] | null> {
  const key =
    process.env.GOOGLE_AI_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:embedContent?key=${key}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: GEMINI_EMBED_DIMS,
      }),
    });
    if (!res.ok) {
      console.warn("[atlas-ai.chat] embed failed", res.status);
      return null;
    }
    const json = (await res.json()) as { embedding?: { values: number[] } };
    return json.embedding?.values ?? null;
  } catch (err) {
    console.warn("[atlas-ai.chat] embed error", err);
    return null;
  }
}

type RetrievedCourse = {
  course_id: string;
  university_id: string;
  course_name: string;
  university_name: string;
  level: string;
  field: string;
  cricos_code: string | null;
  similarity: number;
  content: string;
};

async function retrieveCourses(queryEmbedding: number[]): Promise<RetrievedCourse[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("match_courses_for_chat", {
    query_embedding: queryEmbedding,
    top_k: 5,
    threshold: 0.65,
  });
  if (error) {
    console.warn("[atlas-ai.chat] rpc failed", error.message);
    return [];
  }
  return (data as RetrievedCourse[]) ?? [];
}

function buildSystemPrompt(retrieved: RetrievedCourse[]): string {
  const base = CHAT_SYSTEM_PROMPT_V1;
  if (retrieved.length === 0) {
    return `${base}\n\n<no_hits/>\nThe user's question has no matching courses in the Atlas dataset. Honestly say the dataset doesn't cover it and offer a /consult booking. Do NOT fabricate universities or courses.`;
  }
  const rows = retrieved
    .map(
      (r, i) =>
        `${i + 1}. ${r.course_name} @ ${r.university_name} (level=${r.level}, field=${r.field}, CRICOS=${r.cricos_code ?? "n/a"})`
    )
    .join("\n");
  return `${base}\n\n<retrieved_courses>\n${rows}\n</retrieved_courses>\nGround the answer in the retrieved courses above. Cite by course name + university. If none fit the question, say so and offer /consult.`;
}

function getLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const parts = (m as unknown as { parts?: Array<Record<string, unknown>> }).parts;
    if (parts) {
      const txt = parts
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join(" ")
        .trim();
      if (txt) return txt;
    }
    const content = (m as unknown as { content?: string }).content;
    if (typeof content === "string" && content.trim()) return content.trim();
  }
  return "";
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const lastUser = getLastUserText(messages);

    // RAG: embed last user message, retrieve top-k grounded courses.
    let retrieved: RetrievedCourse[] = [];
    if (lastUser) {
      const vec = await embedQuery(lastUser);
      if (vec) retrieved = await retrieveCourses(vec);
    }

    const system = buildSystemPrompt(retrieved);

    const result = streamText({
      model: pickModel(),
      system,
      messages: await convertToModelMessages(messages),
      temperature: 0.5,
      onFinish: ({ usage }) => {
        console.log("[atlas-ai.chat]", {
          provider: CHAT_PROVIDER,
          retrieved: retrieved.length,
          ms: Date.now() - startedAt,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
        });
      },
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: () => ({
        retrievedCourses: retrieved.map((r) => ({
          course_id: r.course_id,
          course_name: r.course_name,
          university_name: r.university_name,
          level: r.level,
          field: r.field,
          cricos_code: r.cricos_code,
        })),
      }),
    });
  } catch (err) {
    console.error("[atlas-ai.chat] error", err);
    return new Response(
      JSON.stringify({
        error:
          CHAT_MARA_DEFLECTION_RESPONSE +
          "\n\n" +
          CHAT_PER_TURN_FOOTER,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}
