import type { LeadInput } from "./lead-schema";

export type LeadTier = "A" | "B" | "C" | "D";

export interface ScoreResult {
 score: number;
 tier: LeadTier;
}

/**
 * 4-dimension lead scoring for the Pathway-AI AU edu funnel.
 *
 * Each dimension contributes 0-25 → max 100. Tier cutoffs land at quartiles:
 * A ≥ 80 (hot) · B 60-79 · C 40-59 · D < 40 (cold)
 *
 * Anchors are calibrated against the 12-uni G8-heavy seed
 * (`universities-seed.ts`) — see 3-PLAN.md Delta #3. Re-evaluate empirically
 * when the 43-uni backfill lands in P4.5.
 *
 * Score is shown only to Sam + Pathway-AI via email; never surfaced to students
 * (PRD §6 — avoids perverse incentives + Code ambiguity).
 */
export function computeScore(lead: LeadInput): ScoreResult {
 const budget = scoreBudget(lead.tuition_budget_aud);
 const ielts = scoreIelts(lead.ielts_overall);
 const intake = scoreIntakeProximity(lead.preferred_intake_month);
 const specificity = scorePreferenceSpecificity(
 lead.preferred_fields ?? [],
 lead.preferred_levels ?? [],
 );

 const score = budget + ielts + intake + specificity;
 return { score, tier: tierFor(score) };
}

function scoreBudget(tuitionAud: number | undefined): number {
 if (tuitionAud == null) return 5;
 if (tuitionAud >= 45_000) return 25;
 if (tuitionAud >= 35_000) return 18;
 if (tuitionAud >= 25_000) return 10;
 return 0;
}

function scoreIelts(band: number | undefined): number {
 if (band == null) return 5;
 if (band >= 6.5) return 25;
 if (band >= 6.0) return 15;
 if (band >= 5.5) return 5;
 return 0;
}

/**
 * Interpret `preferred_intake_month` (1-12) as the nearest-future month.
 * If the target month is earlier than the current month, assume next year.
 * This is defensible because AU unis have rolling intakes (Feb/Jul/Nov),
 * and a student ticking "Feb" in April is realistically targeting Feb of
 * next year, not last year.
 */
function scoreIntakeProximity(targetMonth: number | undefined): number {
 if (targetMonth == null) return 5;
 const now = new Date();
 const currentMonth = now.getMonth() + 1; // 1-12
 const monthsUntil =
 targetMonth >= currentMonth
 ? targetMonth - currentMonth
 : 12 - currentMonth + targetMonth;

 if (monthsUntil <= 6) return 25;
 if (monthsUntil <= 12) return 15;
 return 5;
}

function scorePreferenceSpecificity(
 fields: readonly string[],
 levels: readonly string[],
): number {
 const hasFields = fields.length >= 1;
 const hasLevels = levels.length >= 1;
 if (hasFields && hasLevels) return 25;
 if (hasFields || hasLevels) return 12;
 return 0;
}

function tierFor(score: number): LeadTier {
 if (score >= 80) return "A";
 if (score >= 60) return "B";
 if (score >= 40) return "C";
 return "D";
}
