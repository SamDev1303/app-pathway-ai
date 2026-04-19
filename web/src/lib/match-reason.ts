// web/src/lib/match-reason.ts
// P4 UniMatch — reason-text renderer: structured reason_parts → dot-joined line.
// RT-1/2/3/4 from .planning/4-CONTEXT.md.
//
// Smart top-3 rule: the 3 signals that contributed most to THIS match are
// surfaced first. Template does not invent text; it selects from fixed fragments.

import type { ReasonParts } from "./match-schema";

export interface RenderedReason {
  line: string;          // "Matches Business · Within budget · IELTS met · QS #19"
  fragments: string[];   // for UI that wants per-chip rendering
}

// Ordered signal list — selection order matches "importance" weighting.
type FragmentBuilder = (r: ReasonParts) => string | null;

const FRAGMENT_BUILDERS: FragmentBuilder[] = [
  // Field — always first if present; joins multi-field with " + "
  (r) => (r.matched_fields.length > 0
    ? `Matches ${r.matched_fields.join(" + ")}`
    : null),
  // Budget verdict — use plain English, never monetary specifics (those belong
  // in stretch_reason if the card is a stretch card).
  (r) => {
    if (r.budget_verdict === "within") return "Within budget";
    if (r.budget_verdict === "stretch") return "Slight budget stretch";
    if (r.budget_verdict === "far_stretch") return "Over budget";
    return null;
  },
  // IELTS verdict — never show the raw number; course requirement is per-course.
  (r) => {
    if (r.ielts_verdict === "meets") return "IELTS met";
    if (r.ielts_verdict === "stretch") return "IELTS 0.5 band short";
    if (r.ielts_verdict === "below") return null; // shouldn't surface — hard cut
    return null;
  },
  // QS rank — only if in top 200
  (r) => (r.qs_rank != null && r.qs_rank <= 200 ? `QS #${r.qs_rank}` : null),
  // G8
  (r) => (r.g8 ? "Group of Eight" : null),
  // Industry placement
  (r) => (r.industry_placement ? "Industry placement" : null),
  // Regional
  (r) => (r.regional ? "Regional campus" : null),
  // Intake proximity
  (r) => (r.intake_hit ? "Your intake month" : null),
];

const MAX_FRAGMENTS = 6; // RT-2: 4-6 fragments max

export function renderReason(parts: ReasonParts): RenderedReason {
  const fragments: string[] = [];
  for (const build of FRAGMENT_BUILDERS) {
    if (fragments.length >= MAX_FRAGMENTS) break;
    const frag = build(parts);
    if (frag) fragments.push(frag);
  }
  return {
    line: fragments.join(" · "),
    fragments,
  };
}

// Helper for StretchCard — builds the explicit "$X above your stated $Y" text.
// Parameters are the displayed tuition (from course) and the lead's stated
// budget. Used only when stretch_reason is not pre-populated by the RPC.
export function stretchBudgetExplanation(
  indicativeFee: number,
  studentBudget: number,
): string {
  const over = Math.round(((indicativeFee - studentBudget) / studentBudget) * 100);
  return `Tuition $${indicativeFee.toLocaleString()} is ~${over}% above your stated $${studentBudget.toLocaleString()}.`;
}
