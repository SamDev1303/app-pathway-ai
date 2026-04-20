// web/src/lib/sop-prompt.ts
// P6 wave 1: staged SOP system prompt module (mirrors chat-system-prompt.ts shape).
//
// The SYSTEM prompt the AI SDK provider receives on every /api/sop call.
// Lifted verbatim from the pre-P6 inline constant in /api/sop/route.ts
// (already MARA-safe — audited at plan-phase).
//
// Edit rule: bumping content requires bumping SOP_SYSTEM_PROMPT_VERSION in
// the same commit, mirroring MARA_DISCLAIMER_VERSION and
// CHAT_SYSTEM_PROMPT_VERSION.
//
// Design constraint (MARA Act 1958 s.280): the prompt MUST instruct the model
// to exclude visa / migration / PR / post-study work content from the SOP
// body. Layer-2 (cumulative-buffer scanForDeflection) is the belt; this is
// the braces.

export const SOP_SYSTEM_PROMPT_VERSION = "2026-04-21.v1";

/**
 * Per-SOP footer — also burned into the PDF by SopPdfDoc on every page.
 * Satisfies P6 CONTEXT §Inherited "Per-turn footer" rule.
 */
export const SOP_PER_TURN_FOOTER =
  "Educational SOP draft — not migration advice. For binding advice consult a MARA-registered agent.";

export const SOP_SYSTEM_PROMPT_V1 = `You are a senior MARA-registered education counsellor at UniMate Australia's Liverpool, NSW office drafting a Statement of Purpose for an international student applying to an Australian university.

Writing style:
- First person, the student's voice
- Warm, specific, never generic
- Australian English
- 4 paragraphs: hook (academic awakening), academic + practical background, why this course at this university, career + long-term contribution
- 350-450 words total
- Include ONE concrete specific detail per paragraph (a project, a turning point, a mentor, a regional connection)
- No clichés ("since childhood I have been passionate about…", "I firmly believe…")
- No hyperbole
- End on long-term professional contribution — focus on career trajectory, industry impact, and skills development (NOT visa outcomes, residency intentions, or migration pathways)

Hard rules:
- NEVER invent university rankings, program codes, or specific faculty names unless the user provided them.
- NEVER claim student has met specific people or attended events they didn't mention.
- NEVER include visa advice, migration pathway guidance, residency claims, or post-study work stratagems. This is an academic SOP, not a migration document.
- Use the user's inputs as seed facts — elaborate naturally, don't fabricate.
- Output plain prose only — no headers, no bullet points, no markdown.`;

// ================================================================
// Pre-filter — reject user-supplied notes that contain migration content
// BEFORE we send them to the model. 422 with explicit "remove it" message.
// Design decision baked in at Wave 1 per orchestrator instruction.
// ================================================================

/**
 * Conservative posture: biographical mentions of visa etc. in free-form notes
 * would still get scrubbed (we're erring on the side of safety — clients can
 * always rephrase). These patterns are word-boundary anchored so legitimate
 * prefixes like "prior" don't match "PR".
 *
 * NOTE: `/\bPR\b/` is case-sensitive on purpose — lowercase "pr" is a common
 * word prefix (prior, practice, program). Uppercase PR is the migration term.
 */
export const SOP_NOTES_FORBIDDEN_PHRASES: RegExp[] = [
  /\bvisa\b/i,
  /\bPR\b/, // case-sensitive — see note above
  /\bpermanent resident(ce|cy)?\b/i,
  /\b(485|500|482|186|189|190|491)\b/,
  /\bmigration (agent|advice|pathway|status)\b/i,
  /\bpathway to (PR|residency|citizenship)\b/i,
];

/**
 * Returns the first matched forbidden phrase in `notes`, or null if clean.
 * Called by /api/sop BEFORE sending to the model.
 */
export function scanNotesForForbidden(notes: string): string | null {
  if (!notes) return null;
  for (const re of SOP_NOTES_FORBIDDEN_PHRASES) {
    const m = notes.match(re);
    if (m) return m[0];
  }
  return null;
}

export const SOP_NOTES_FORBIDDEN_MESSAGE =
  "Your notes mention visa content — please remove; SOPs must be academic only.";
