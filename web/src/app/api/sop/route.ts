import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 45;

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://unimate-demo.vercel.app",
    "X-Title": "UniMate Australia (sop)",
  },
});

// Senior-counsellor SOP drafter. Produces ~350-450 word drafts with the MARA/QEAC voice.
// Temperature higher than chat (0.7) for more narrative variation, since every student's SOP
// should feel distinct — not template-filled.
const SYSTEM_PROMPT = `You are a senior MARA-registered education counsellor at UniMate Australia's Liverpool, NSW office drafting a Statement of Purpose for an international student applying to an Australian university.

Writing style:
- First person, the student's voice
- Warm, specific, never generic
- Australian English
- 4 paragraphs: hook (academic awakening), academic + practical background, why this course at this university, career + long-term contribution
- 350-450 words total
- Include ONE concrete specific detail per paragraph (a project, a turning point, a mentor, a regional connection)
- No clichés ("since childhood I have been passionate about…", "I firmly believe…")
- No hyperbole
- End on long-term contribution to Australia's skills pipeline (PR-aware without being PR-obvious)

Hard rules:
- NEVER invent university rankings, program codes, or specific faculty names unless the user provided them.
- NEVER claim student has met specific people or attended events they didn't mention.
- Use the user's inputs as seed facts — elaborate naturally, don't fabricate.
- Output plain prose only — no headers, no bullet points, no markdown.`;

type SopInput = {
  university: string;
  course: string;
  background: string;
  goals: string;
};

function buildPrompt(input: SopInput): string {
  return `Draft a Statement of Purpose for a student applying to:

University: ${input.university}
Course: ${input.course}

Their academic and practical background (in their words):
${input.background}

Their stated career goals:
${input.goals}

Write the full 4-paragraph SOP now. Plain prose, no formatting.`;
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const body = (await req.json()) as Partial<SopInput>;

    if (!body.university || !body.course) {
      return Response.json(
        { error: "Missing university or course" },
        { status: 400 },
      );
    }

    const input: SopInput = {
      university: String(body.university).slice(0, 200),
      course: String(body.course).slice(0, 200),
      background: String(body.background ?? "").slice(0, 2000),
      goals: String(body.goals ?? "").slice(0, 1000),
    };

    const { text, usage } = await generateText({
      model: openrouter("openai/gpt-oss-120b:free"),
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(input),
      temperature: 0.7,
    });

    console.log("[unimate.sop]", {
      ms: Date.now() - startedAt,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });

    return Response.json({ draft: text });
  } catch (err) {
    console.error("[unimate.sop] error", err);
    return Response.json(
      {
        error:
          "The SOP generator is briefly unavailable. Please try again — or book a free consultation at our Liverpool office.",
      },
      { status: 503 },
    );
  }
}
