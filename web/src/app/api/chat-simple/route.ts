import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { logger } from "@/lib/logger";

const log = logger.child({ route: "/api/chat-simple" });

export const maxDuration = 30;

// -safe mobile chat. Mirrors /api/chat system prompt. P0.5 scrub complete.
// Model selection mirrors /api/chat shape: CHAT_SIMPLE_MODEL → CHAT_MODEL → free
// fallback. Production target = openrouter/openai-mini (gpt-4o-mini) for paid
// SLA reliability; the free Qwen path stays as the demo-grade default.
const CHAT_SIMPLE_MODEL =
 process.env.CHAT_SIMPLE_MODEL ??
 process.env.CHAT_MODEL ??
 "openrouter/qwen-free";

const openrouter = createOpenAI({
 baseURL: "https://openrouter.ai/api/v1",
 apiKey: process.env.OPENROUTER_API_KEY,
 headers: {
 "HTTP-Referer": "https://pathway-ai.vercel.app",
 "X-Title": "Pathway-AI (mobile)",
 },
});

function pickModel() {
 switch (CHAT_SIMPLE_MODEL) {
 case "openrouter/anthropic-sonnet":
 case "anthropic-gateway":
 return openrouter("anthropic/claude-sonnet-4-6");
 case "openrouter/openai-mini":
 case "openai-gateway":
 return openrouter("openai/gpt-4o-mini");
 case "openrouter/qwen-free":
 case "openrouter-free":
 default:
 return openrouter("qwen/qwen3-next-80b-a3b-instruct:free");
 }
}

const SYSTEM_PROMPT = `You are Pathway-AI's course advisor (mobile), built for Pathway-AI — a registered education consultancy in .

Your role: help prospective international students explore CRICOS-registered Australian university courses. You DO NOT give migration advice.

Voice: warm, direct, never salesy. Australian English. Short paragraphs. Max 150 words per answer so the mobile bubble stays readable.

Hard rules ( Code of Conduct — non-negotiable):
- You are NOT a migration agent. NEVER give visa, subclass, PR, points-test, MLTSSL/STSOL, or post-study work advice.
- If the user asks ANY visa / PR / migration question, deflect: "That's a migration question and I'm not licensed to answer it. Pathway-AI has registered agents who can — book a free consultation."
- NEVER quote visa success rates, approval percentages, or migration outcomes.
- NEVER fabricate university names, course codes, CRICOS numbers, IELTS scores, or fees.
- For specific course matching, point users to the Match tab.
- Stay neutral about other consultancies; pivot to the matcher.

What you know cold:
- Group of Eight: ANU, Melbourne, Sydney, UNSW, Monash, UQ, Adelaide, UWA
- IELTS: undergrad 6.0-6.5, postgrad 6.5-7.0, nursing/teaching 7.0
- Tuition: undergrad A$30-60k/yr, postgrad A$35-60k/yr
- Intakes: Feb, May, July, October (Feb largest)
- Regional Australian universities are CRICOS-registered and often offer lower tuition.

Every response ends with: "This is not migration advice. Talk to a Pathway-AI registered agent for binding guidance."`;

export async function POST(req: Request) {
 const startedAt = Date.now();
 try {
 const { prompt } = (await req.json()) as { prompt?: string };
 if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
 return Response.json({ error: "Missing prompt" }, { status: 400 });
 }

 const { text, usage } = await generateText({
 model: pickModel(),
 system: SYSTEM_PROMPT,
 prompt: prompt.slice(0, 1000),
 temperature: 0.5,
 });

 log.info(
 {
 model: CHAT_SIMPLE_MODEL,
 ms: Date.now() - startedAt,
 inputTokens: usage?.inputTokens,
 outputTokens: usage?.outputTokens,
 promptLength: prompt.length,
 },
 "chat-simple completed",
 );

 return Response.json({ text });
 } catch (err) {
 log.error({ err }, "chat-simple error");
 return Response.json(
 {
 error:
 "Pathway-AI is briefly unavailable. Please book a free consultation with a Pathway-AI registered agent at our office.",
 },
 { status: 503 },
 );
 }
}
