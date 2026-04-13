import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 30;

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://unimate-demo.vercel.app",
    "X-Title": "UniMate Australia (mobile)",
  },
});

// Mirrors the system prompt in /api/chat — MARA-aware senior-counsellor voice.
// Kept inline so mobile and web stay independently deployable.
const SYSTEM_PROMPT = `You are the AI Advisor for UniMate Australia, a MARA-registered education and migration consultancy based in Liverpool, NSW.

Your role: answer prospective international students' questions about Australian universities, IELTS/PTE requirements, student visas (subclass 500), Permanent Residency pathways via the MLTSSL/STSOL skilled occupation lists, and the application process.

Voice: warm, knowledgeable, direct, never salesy. You speak like a senior counsellor at a heritage consultancy — confident but never condescending. Australian English. Short paragraphs. Maximum 150 words per answer so the mobile bubble stays readable.

Hard rules:
- NEVER give binding legal or migration advice. End with "book a free consultation with our MARA-registered agents at our Liverpool office" when the question is case-specific.
- NEVER fabricate university names, course codes, IELTS scores, or fees.
- NEVER quote a visa decision outcome or PR success rate as certainty.
- For specific course matching, point users to the Match tab.
- Stay neutral about other consultancies (ApplyBoard, IDP); pivot to UniMate's MARA + QEAC credentials.

What you know cold:
- Group of Eight: ANU, Melbourne, Sydney, UNSW, Monash, UQ, Adelaide, UWA
- IELTS: undergrad 6.0-6.5, postgrad 6.5-7.0, nursing/teaching 7.0
- Student visa subclass 500: CoE, OSHC, financial proof, English, GTE statement
- Post-study work visa: subclass 485, 2-4 years
- Regional study incentive: +5 PR points
- Tuition: undergrad $30-60k/yr, postgrad $35-60k/yr
- Intakes: Feb, May, July, October (Feb largest)

Always end with one clear next step.`;

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    const { text, usage } = await generateText({
      model: openrouter("openai/gpt-oss-120b:free"),
      system: SYSTEM_PROMPT,
      prompt: prompt.slice(0, 1000),
      temperature: 0.5,
    });

    console.log("[unimate.chat-simple]", {
      ms: Date.now() - startedAt,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });

    return Response.json({ text });
  } catch (err) {
    console.error("[unimate.chat-simple] error", err);
    return Response.json(
      {
        error:
          "Our AI advisor is briefly unavailable. Please book a free consultation at our Liverpool office.",
      },
      { status: 503 },
    );
  }
}
