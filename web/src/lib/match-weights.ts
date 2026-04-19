// web/src/lib/match-weights.ts
// P4 UniMatch — locked weight vector validated against 4 personas × 12-uni seed
// Research: .planning/research/4-RESEARCH.md §"Weight Numbers (W-7 closure)"
//
// Core 72 + tiebreakers 28 = 100. Tiered per CONTEXT W-5 to prevent a field-
// mismatched uni from winning on G8 alone.

export const MATCH_WEIGHTS = {
  // Core (77 pts — CONTEXT W-5 "70-80 envelope")
  // Post round-1 revision: budget +5 (reclaimed from zeroed industry_placement)
  field: 30,               // Dominant lever — IDP "study area" top-of-funnel
  level: 12,               // Bachelor-vs-Masters misfire produces useless matches
  budget: 23,              // #1 abandonment driver on AU edu lead forms (+5 from industry_placement=0)
  ielts: 12,               // Hard gate on admission; most seeded unis cluster at 6.5

  // Tiebreakers (23 pts — CONTEXT W-5 "20-30 envelope")
  // Post round-1 revision: qs_rank +5 (reclaimed from zeroed regional per Gideon DELTA-2)
  qs_rank: 15,             // Scaled: max(0, 15 * (1 - rank/200))  (+5 from regional=0)
  g8: 5,                   // Capped — QS already captures most G8s
  industry_placement: 0,   // Gated behind a lead signal (prioritize_outcomes) that P3 never captured.
                            // Column still ships in migration 003 for a v2 signal-capture phase.
  regional: 0,             // Heuristic rejected by Gideon plan-check round 1 — no preferred_state column.
  intake: 3,               // Low-signal within 12-uni seed (all have Feb+Jul)
} as const;

export type MatchWeights = typeof MATCH_WEIGHTS;

export const STRETCH = {
  budget_pct: 0.20,        // 20% over budget → stretch zone
  far_stretch_pct: 0.50,   // 20-50% over → excluded from course_total (0 budget_score)
  ielts_band: 0.5,         // 0.5 below course req → stretch
  weight_penalty: 0.50,    // stretch gets 50% of signal weight
} as const;

export const NORMALIZATION = {
  qs_rank_max: 200,        // unis past QS 200 → qs_score = 0
} as const;

export const TOKEN_TTL_MINUTES = 30;

// JSON form passed to the RPC as p_weights. Kept as a separate constant so
// Server Component + API route share one source of truth for what gets sent.
export const MATCH_WEIGHTS_JSON = MATCH_WEIGHTS as Readonly<Record<keyof MatchWeights, number>>;
