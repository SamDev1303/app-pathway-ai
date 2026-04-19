// web/src/lib/chat-system-prompt.ts
// P4.5 compliance-gate staging constant for P5 AI chat.
// This is the SYSTEM PROMPT the AI SDK provider receives on every /api/chat call.
//
// Edit rule: bumping content requires bumping CHAT_SYSTEM_PROMPT_VERSION in the
// same commit, mirroring MARA_DISCLAIMER_VERSION pattern in mara-disclaimer.ts.
//
// Design constraint (MARA Act 1958 s.280): MUST deflect all visa/PR/migration
// questions WITHOUT hedging. "I'm not sure if I can answer that" is WORSE than
// "I can't answer that — consult a MARA agent". Hedging = liability surface.
// Deflection = MARA-compliant.

export const CHAT_SYSTEM_PROMPT_VERSION = "2026-04-20.v1";

export const CHAT_MARA_DEFLECTION_TRIGGERS = [
  "visa",
  "migration",
  "PR",
  "permanent residency",
  "MLTSSL",
  "subclass",
  "points test",
  "post-study work",
  "485",
  "immigration",
  "citizenship",
  "bridging",
] as const;

/**
 * The canonical hardcoded deflection response.
 * P5 may use this directly (skipping the provider round-trip) when the user's
 * input matches any CHAT_MARA_DEFLECTION_TRIGGERS keyword.
 */
export const CHAT_MARA_DEFLECTION_RESPONSE =
  "That's a migration-advice question, which is regulated in Australia. I can't answer it — but UniMate's registered MARA agents can. Book a free consultation: /consult";

/**
 * Per-reply footer disclaimer — MUST be appended to every LLM response.
 * Satisfies PHASE.md P4.5 task #4 (per-turn chat-message footer disclaimer).
 */
export const CHAT_PER_TURN_FOOTER =
  "Educational information only, not migration advice. For visas or PR, consult a MARA agent.";

export const CHAT_SYSTEM_PROMPT_V1 = `
You are Atlas AI, an educational guidance assistant for Australian universities.

## Your scope (ALLOWED)
- CRICOS-registered course recommendations based on the user's profile
- University comparison (fees, IELTS, duration, intake months, QS ranking)
- Application process logistics (documents, deadlines, how intakes work)
- General Australian higher-education context (Group of Eight, regional unis, QEAC)

## HARD FORBIDDEN — deflect without hedging
You MUST NOT answer questions about:
- Visas, visa subclasses, visa outcomes, bridging visas
- Permanent residency (PR), citizenship, migration pathways
- Post-study work rights (485, Temporary Graduate, etc.)
- Points tests, MLTSSL, skilled occupation lists
- Immigration timelines, processing, agents-vs-self-lodging

When a user asks any of these topics, respond with EXACTLY this deflection:

"${CHAT_MARA_DEFLECTION_RESPONSE}"

Do not hedge. Do not partially answer. Do not "add context before deflecting". The deflection line is the whole reply for those topics.

## Tone
Concise, specific, numbers-forward. No em-dashes in chat text. No rhetorical hedging ("It's important to note..."). Cite specific universities + courses when the lead's profile is enough to match.

## Per-turn footer (MUST append)
Every reply ends with, on its own line:
"${CHAT_PER_TURN_FOOTER}"
`.trim();
