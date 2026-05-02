// web/src/lib/chat-deflection.ts
// P5 wave 3: belt-and-braces deflection.
//
// Layer 1 (prompt-side, CHAT_SYSTEM_PROMPT_V1) instructs the model to deflect.
// Layer 2 (this module) catches any model leak at the server boundary — the
// user NEVER sees migration content stream past us even if the prompt fails.
//
// Matching strategy: word-boundary regex on the key AU/US migration terminology
// + visa subclass numbers (485, 189, 190, 491, 494). Case-insensitive. Runs on
// both the incoming user message AND the outgoing assistant chunks.

export const CHAT_DEFLECTION_REGEX =
 /\b(visas?|PR|permanent residen(?:t|cy|ce)|migration|immigrat(?:e|ion)|485|189|190|491|494|MLTSSL|STSOL|ROL|skilled occupation|points test|LMIA|green card|citizenship|bridging visa|post[-\s]?study work|temporary graduate)\b/i;

export type DeflectionMatch = {
 matched: true;
 phrase: string;
} | {
 matched: false;
};

export function scanForDeflection(text: string): DeflectionMatch {
 const m = text.match(CHAT_DEFLECTION_REGEX);
 if (!m) return { matched: false };
 return { matched: true, phrase: m[0] };
}
