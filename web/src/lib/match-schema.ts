// web/src/lib/match-schema.ts
// P4 UniMatch — Zod schema for leads.matches jsonb. Validates RPC output on
// read inside /matches/[token]/page.tsx Server Component.
// Research: .planning/research/4-RESEARCH.md §Landmines #10

import { z } from "zod";

export const MatchResultSchema = z.object({
  uni_id: z.string().uuid(),
  uni_name: z.string(),
  short_name: z.string(),
  course_name: z.string(),
  match_pct: z.number().int().min(0).max(100),
  reason_parts: z.object({
    matched_fields: z.array(z.string()),
    budget_verdict: z.enum(["within", "stretch", "far_stretch"]),
    ielts_verdict: z.enum(["meets", "stretch", "below"]),
    qs_rank: z.number().int().nullable(),
    g8: z.boolean(),
    industry_placement: z.boolean(),
    regional: z.boolean(),
    intake_hit: z.boolean(),
    best_course_name: z.string(),
  }),
  stretch_reason: z.string().optional(),
});

export const MatchesJsonbSchema = z.object({
  strong: z.array(MatchResultSchema).max(3),
  stretch: z.array(MatchResultSchema).max(2),
  computed_at: z.string().datetime({ offset: true }),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;
export type ReasonParts = MatchResult["reason_parts"];
export type MatchesJsonb = z.infer<typeof MatchesJsonbSchema>;
