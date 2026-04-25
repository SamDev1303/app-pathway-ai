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
import { scanForDeflection } from "@/lib/chat-deflection";
import { getOrCreateChatSession, persistChatMessage } from "@/lib/chat-session";
import { logger } from "@/lib/logger";
import { checkChatRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/ratelimit";

const log = logger.child({ route: "/api/chat" });

export const maxDuration = 30;

// Model selector. All paths currently route through OpenRouter (one transport,
// different model slugs). Post-meeting, wire real provider clients by adding
// a branch with `createAnthropic(...)` / direct `createOpenAI(baseURL:
// "https://api.openai.com/v1")` — that's the honest provider swap. Until
// then, CHAT_MODEL is a model-label selector on OpenRouter.
const CHAT_MODEL =
  process.env.CHAT_MODEL ??
  process.env.CHAT_PROVIDER ?? // backwards-compat with wave-2 name
  "openrouter/qwen-free";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://atlas-ai.vercel.app",
    "X-Title": "Atlas AI",
  },
});

function pickModel() {
  switch (CHAT_MODEL) {
    case "openrouter/anthropic-sonnet":
    case "anthropic-gateway": // legacy alias
      return openrouter("anthropic/claude-sonnet-4-6");
    case "openrouter/openai-mini":
    case "openai-gateway": // legacy alias
      return openrouter("openai/gpt-4o-mini");
    case "openrouter/qwen-free":
    case "openrouter-free": // legacy alias
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
      log.warn({ status: res.status }, "embed failed");
      return null;
    }
    const json = (await res.json()) as { embedding?: { values: number[] } };
    return json.embedding?.values ?? null;
  } catch (err) {
    log.warn({ err }, "embed error");
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

function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function retrieveCourses(queryEmbedding: number[]): Promise<RetrievedCourse[]> {
  const supabase = serviceRoleClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("match_courses_for_chat", {
    query_embedding: queryEmbedding,
    top_k: 5,
    threshold: 0.65,
  });
  if (error) {
    log.warn({ err: error.message }, "rpc failed");
    return [];
  }
  return (data as RetrievedCourse[]) ?? [];
}

async function logDeflection(
  userMessage: string,
  triggeredPhrase: string,
  sessionId: string | null,
): Promise<void> {
  const supabase = serviceRoleClient();
  if (!supabase) return;
  const { error } = await supabase.from("mara_deflections").insert({
    session_id: sessionId,
    user_message: userMessage,
    triggered_phrase: triggeredPhrase,
  });
  if (error) log.warn({ err: error.message, sessionId }, "deflection log failed");
}

async function logDatasetGap(userMessage: string, sessionId: string | null): Promise<void> {
  const supabase = serviceRoleClient();
  if (!supabase) return;
  const { error } = await supabase.from("chat_dataset_gaps").insert({
    session_id: sessionId,
    user_message: userMessage,
  });
  if (error) log.warn({ err: error.message, sessionId }, "gap log failed");
}

/**
 * Canned deflection response as a ReadableStream formatted for
 * `toUIMessageStreamResponse`-compatible consumption. We skip the model entirely
 * when the user input is already a migration question — saves tokens + latency
 * and guarantees no provider-side leak.
 */
function deflectionStreamResponse(
  metadata: Record<string, unknown>,
  customBody?: string,
): Response {
  const payload = customBody
    ? `${customBody}\n\n${CHAT_PER_TURN_FOOTER}`
    : `${CHAT_MARA_DEFLECTION_RESPONSE}\n\n${CHAT_PER_TURN_FOOTER}`;
  const encoder = new TextEncoder();
  const messageId = crypto.randomUUID();
  const lines = [
    { type: "start", messageId },
    { type: "start-step" },
    { type: "text-start", id: messageId },
    { type: "text-delta", id: messageId, delta: payload },
    { type: "text-end", id: messageId },
    { type: "finish-step" },
    { type: "finish", messageMetadata: metadata },
  ];
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(line)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
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

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const session = await getOrCreateChatSession();
  const sessionId: string | null = session?.id ?? null;
  try {
    const rl = await checkChatRateLimit({ ip: clientIp(req), sessionId });
    if (!rl.ok) {
      log.warn({ reason: rl.reason, sessionId }, "rate-limit hit");
      return deflectionStreamResponse(
        { rateLimited: true, reason: rl.reason },
        RATE_LIMIT_MESSAGE,
      );
    }

    const { messages }: { messages: UIMessage[] } = await req.json();
    const lastUser = getLastUserText(messages);

    if (sessionId && lastUser) {
      void persistChatMessage({
        sessionId,
        role: "user",
        content: lastUser,
      });
    }

    // Layer-1 deflection: if the user's own message is a migration question,
    // short-circuit — don't spend tokens, don't risk provider leak.
    if (lastUser) {
      const pre = scanForDeflection(lastUser);
      if (pre.matched) {
        await logDeflection(lastUser, pre.phrase, sessionId);
        if (sessionId) {
          void persistChatMessage({
            sessionId,
            role: "assistant",
            content: `${CHAT_MARA_DEFLECTION_RESPONSE}\n\n${CHAT_PER_TURN_FOOTER}`,
            deflected: true,
          });
        }
        return deflectionStreamResponse({
          deflected: true,
          triggeredPhrase: pre.phrase,
          retrievedCourses: [],
        });
      }
    }

    // RAG: embed last user message, retrieve top-k grounded courses.
    let retrieved: RetrievedCourse[] = [];
    if (lastUser) {
      const vec = await embedQuery(lastUser);
      if (vec) retrieved = await retrieveCourses(vec);
    }

    if (lastUser && retrieved.length === 0) {
      // Fire-and-forget gap log — don't block the stream on it.
      void logDatasetGap(lastUser, sessionId);
    }

    const system = buildSystemPrompt(retrieved);

    // Layer-2 deflection: scan the CUMULATIVE assistant buffer, not per-delta.
    // A forbidden token split across chunks ("vi" + "sa") would evade the
    // per-delta regex — accumulating the buffer catches cross-chunk splits.
    let postDeflection: { phrase: string } | null = null;
    let cumulativeBuffer = "";
    const postFilter = ({ stopStream }: { stopStream: () => void }) =>
      new TransformStream<Record<string, unknown>, Record<string, unknown>>({
        transform(chunk, controller) {
          if (postDeflection) return;
          if (chunk && chunk.type === "text-delta") {
            const delta = typeof chunk.delta === "string" ? chunk.delta : "";
            cumulativeBuffer += delta;
            const scan = scanForDeflection(cumulativeBuffer);
            if (scan.matched) {
              postDeflection = { phrase: scan.phrase };
              controller.enqueue({
                ...chunk,
                delta: `${CHAT_MARA_DEFLECTION_RESPONSE}\n\n${CHAT_PER_TURN_FOOTER}`,
              });
              stopStream();
              return;
            }
          }
          controller.enqueue(chunk);
        },
      });

    const result = streamText({
      model: pickModel(),
      system,
      messages: await convertToModelMessages(messages),
      temperature: 0.5,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      experimental_transform: postFilter as any,
      onFinish: async ({ usage, text }) => {
        log.info({
          model: CHAT_MODEL,
          retrieved: retrieved.length,
          deflected: postDeflection != null,
          ms: Date.now() - startedAt,
          sessionId,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
        }, "chat completed");
        if (postDeflection && lastUser) {
          await logDeflection(lastUser, postDeflection.phrase, sessionId);
        }
        if (sessionId) {
          void persistChatMessage({
            sessionId,
            role: "assistant",
            content: postDeflection
              ? `${CHAT_MARA_DEFLECTION_RESPONSE}\n\n${CHAT_PER_TURN_FOOTER}`
              : (text ?? ""),
            retrievedCourseIds: retrieved.map((r) => r.course_id),
            deflected: postDeflection != null,
          });
        }
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
        noHits: retrieved.length === 0,
        deflected: postDeflection != null,
      }),
    });
  } catch (err) {
    log.error({ err, sessionId }, "chat error");
    // Use SSE deflection stream so the client UI renders a graceful MARA-safe
    // fallback instead of a hard error envelope. Helper handles the
    // text-delta + finish frames + ai-message-stream header.
    return deflectionStreamResponse(
      { error: true },
      CHAT_MARA_DEFLECTION_RESPONSE,
    );
  }
}
