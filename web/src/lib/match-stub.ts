import type { CourseField, StudyLevel, University } from "./types";

export interface MatchStubResult {
  uni_id: string;
  uni_name: string;
  match_pct: number;
  reason: string;
}

/**
 * Deterministic client-side top-3 match preview for Step 3 of the lead
 * wizard. Returns shape consumed by the preview card in Step3Preferences.tsx.
 *
 * This is a STUB — Phase 4 replaces it with `/api/match`, which uses real
 * pgvector similarity + Supabase-side scoring. The stub's output is never
 * persisted; it's shown only as a teaser while the student fills the form.
 *
 * UI must display the disclaimer `"Preview match — final ranking appears
 * after you complete your enquiry."` next to the stub results (PLAN.md
 * decision D5).
 */
export function stubTopMatches(
  prefs: {
    preferred_fields?: readonly CourseField[];
    preferred_levels?: readonly StudyLevel[];
  },
  unis: readonly University[],
): MatchStubResult[] {
  const wantedFields = new Set(prefs.preferred_fields ?? []);
  const wantedLevels = new Set(prefs.preferred_levels ?? []);

  if (wantedFields.size === 0 && wantedLevels.size === 0) {
    return [];
  }

  const scored = unis.map((uni) => {
    const { score, matchedFields } = scoreUniAgainstPrefs(uni, wantedFields, wantedLevels);
    return { uni, score, matchedFields };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ uni, score, matchedFields }) => ({
      uni_id: uni.id,
      uni_name: uni.name,
      match_pct: Math.min(100, Math.round(score)),
      reason: buildReason(matchedFields, uni),
    }));
}

function scoreUniAgainstPrefs(
  uni: University,
  wantedFields: Set<CourseField>,
  wantedLevels: Set<StudyLevel>,
): { score: number; matchedFields: CourseField[] } {
  if (uni.courses.length === 0) {
    return { score: 0, matchedFields: [] };
  }

  const uniFields = new Set<CourseField>();
  const uniLevels = new Set<StudyLevel>();
  for (const course of uni.courses) {
    uniFields.add(course.field);
    uniLevels.add(course.level);
  }

  const fieldMatches: CourseField[] = [];
  for (const f of wantedFields) {
    if (uniFields.has(f)) fieldMatches.push(f);
  }

  const levelHit = wantedLevels.size === 0
    ? 1
    : Array.from(wantedLevels).some((l) => uniLevels.has(l))
      ? 1
      : 0;

  if (wantedFields.size > 0 && fieldMatches.length === 0) {
    return { score: 0, matchedFields: [] };
  }

  const fieldCoverage = wantedFields.size === 0 ? 1 : fieldMatches.length / wantedFields.size;
  const g8Bonus = uni.is_group_of_eight ? 0.1 : 0;
  const levelFactor = levelHit === 1 ? 1 : 0.6;

  const raw = (fieldCoverage * 0.85 + g8Bonus) * 100 * levelFactor;
  return { score: raw, matchedFields: fieldMatches };
}

function buildReason(matchedFields: readonly CourseField[], uni: University): string {
  const fieldSummary = matchedFields.length > 0
    ? `Matches ${matchedFields.length} of your selected field${matchedFields.length === 1 ? "" : "s"} (${matchedFields.join(", ")})`
    : "Matches your study level";

  const locationTag = `${uni.short_name}, ${uni.city}`;
  const g8Tag = uni.is_group_of_eight ? " · Group of Eight" : "";
  return `${fieldSummary} · ${locationTag}${g8Tag}`;
}
