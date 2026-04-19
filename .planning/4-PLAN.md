# Phase 4 — UniMatch engine: Plan

---
phase: 4
waves: 6
tasks: 16
files_modified:
  - supabase/migrations/003_match_prep.sql          # new
  - supabase/migrations/004_match_function.sql     # new
  - web/src/lib/match-weights.ts                    # new
  - web/src/lib/match-reason.ts                     # new
  - web/src/lib/match-schema.ts                    # new
  - web/src/lib/mara-disclaimer.ts                 # new
  - web/src/lib/types.ts                            # modify — add Match* types
  - web/src/app/api/leads/route.ts                  # modify — call RPC + return match_token
  - web/src/app/api/match/route.ts                  # DELETE (orphan — no callers; confirmed via grep round-2 Gideon)
  # universities.ts + matcher.ts + MatcherForm.tsx + MatcherSection.tsx KEPT
  # — still rendered on home page (app/page.tsx:13) via MatcherSection
  # — their retirement is post-P4 scope (see Task 4.2 notes + P4.5 backlog)
  - web/scripts/seed-universities.ts                # modify — add --upsert mode
  - web/src/app/matches/[token]/page.tsx            # new (Server Component)
  - web/src/components/matches/MaraBanner.tsx       # new
  - web/src/components/matches/MatchesHero.tsx      # new
  - web/src/components/matches/MatchList.tsx        # new
  - web/src/components/matches/MatchCard.tsx       # new
  - web/src/components/matches/StretchSection.tsx   # new
  - web/src/components/matches/StretchCard.tsx      # new
  - web/src/components/matches/ConsultCTA.tsx       # new
  - web/src/components/matches/PendingMatches.tsx   # new
  - web/src/components/matches/ExpiredTokenFallback.tsx  # new
  - web/src/components/matches/NotFoundFallback.tsx # new
  - SOURCECODE.md                                   # modify — route table update
  - PHASE.md                                        # modify — tick P4 tasks + sign-off rows
  - .planning/STATE.md                              # modify — P4 in_progress → done
autonomous: true
created: 2026-04-19
planner: gsd-planner (Claude Opus 4.7 1M)
research_source: .planning/research/4-RESEARCH.md
context_source: .planning/4-CONTEXT.md
review_protocol: single-seat Gideon on `gpt-5.4` (not mini) per CLAUDE.md + `feedback_agent-model-calibration.md`
---

## Round-1 revisions absorbed (2026-04-19)

Gideon plan-check round 1 returned **BLOCK** with 5 blockers + rulings on both deltas. Round 2 revisions below (already applied to the plan body):

| # | Gideon blocker | Revision applied |
|---|---|---|
| 1 | Delete list breaks live home page (`MatcherSection` uses `universities.ts` + `matcher.ts`) | Narrowed delete to the single orphan `/api/match/route.ts` only. `universities.ts` + `matcher.ts` + `MatcherForm.tsx` + `MatcherSection.tsx` kept. Task 4.2 + must_have #6 + commit-chain + HITL count all updated. Task 1.5 made non-destructive so legacy types stay. |
| 2 | Strong/stretch SQL used `rn <= 3` / `rn BETWEEN 4 AND 5`, ignoring `stretch_flag` | Rewrote the strong/stretch aggregation in migration 004 (Task 2.2) to classify **by `stretch_flag`** then `LIMIT 3` / `LIMIT 2`. |
| 3 | Planner inferred `prioritize_outcomes` via `preferred_fields && ARRAY['Health',...]` but P3 never captured the signal | Set `industry_placement = 0` in the weight vector (no captured signal). 5 pts reassigned to `budget = 23`. `v_lead_prioritizes_outcomes := false;` in the RPC. Column still ships in migration 003 as v2 schema prep. New §Delta 3 documents the ruling. |
| 4 | Wave 6 persona assertions used tolerance/OR-semantics ("rank 1 is one of UWA/UOW/UTS") | Locked **exact top-3 arrays** per persona: A=`['UNSW','UWA','Adelaide']`, B=`['WSU','UTS','RMIT']`, C=`['UWA','UTS','RMIT']`, D=`['Adelaide','UOW','WSU']`. No more OR-semantics. |
| 5 | must_have #3 failure-injection test (insert with `preferred_fields=NULL`) doesn't actually fail because the SQL handles NULL by design | Replaced with deterministic failure via `REVOKE EXECUTE ON FUNCTION ... FROM service_role` → submit lead → assert `matches_ready:false` → `GRANT EXECUTE` to restore. |

Delta rulings applied:
- **Delta 1 (RPC `RETURNS jsonb`):** ACCEPT (per Gideon — single round-trip + self-update is idiomatic).
- **Delta 2 (regional heuristic):** REJECT (per Gideon) — `regional = 0`, 5 pts → `qs_rank = 15`.

Revised weight vector (total 100): field 30 / level 12 / budget 23 / ielts 12 / qs_rank 15 / g8 5 / industry_placement 0 / regional 0 / intake 3. Core 77 + Tiebreak 23.

Gideon round-1 transcript: `/tmp/atlas-p4-plancheck-r1-output.md` (retained for audit).

## Round-2 revisions absorbed (2026-04-19)

Gideon round 2 returned **BLOCK** — the round-1 fixes landed locally but three downstream echoes of the old behavior survived. Round 3 revisions below (already applied):

| # | Gideon round-2 blocker | Revision applied |
|---|---|---|
| 1 | Migration 004 still carried the rejected Delta-2 regional heuristic in comments + SQL body | Replaced the CASE branch with `0::numeric AS regional_score` and rewrote the header comment to reflect the REJECTION ruling explicitly. The heuristic no longer exists in SQL, only in the audit note. |
| 2 | Phase-verify matrix at the bottom still listed the old tolerance-based persona check ("Persona A rank 1 = UNSW; Persona D rank 1 ∈ {Adelaide, UOW}") and the old NULL-fields failure test and "3 paths" route-removal check | Updated the matrix rows for must-haves 2, 3, 4, 6 to point at the exact top-3 arrays, the REVOKE-EXECUTE injection, the 4-state render matrix, and the single-orphan-route removal respectively. Matrix is now consistent with the task-level `<acceptance_criteria>`. |
| 3 | Task 4.2 `<done>` summary still said "43-uni static dataset + legacy matcher removed" | Rewrote the `<done>` line to describe the narrowed-delete outcome. |

Also absorbed Gideon round-2 non-blocking note #4: Delta-3 prose updated to accurately describe what stayed in the SQL (`v_lead_prioritizes_outcomes := false;` + existing CASE branch short-circuiting to 0), not what the prose claimed (removed variable + hard-coded 0).

Gideon round-2 transcript: `/tmp/atlas-p4-plancheck-r2-output.md` (retained for audit).

---

## Objective

Replace the client-side `match-stub.ts` teaser-only flow with a real Postgres-RPC matcher. Ship migrations 003 (adds `industry_placement` on courses + `matches`/`matches_computed_at`/`match_token` on leads) + 004 (the `match_unis_for_lead(p_lead_id uuid, p_weights jsonb)` plpgsql function with `SECURITY DEFINER SET search_path = ''`). Wire the RPC into the existing atomic `/api/leads` INSERT so every lead saves with up to 3 strong + 2 stretch matches as JSONB. Build the `/matches/[token]` Server Component page (Gideon-style design tokens) that serves fresh results anonymously for 30 minutes, falls back to magic-link auth on expiry, and shows a "still computing" state if the RPC failed. Delete only the orphan `/api/match/route.ts` scaffold (no callers). The home-page `MatcherSection` + its `universities.ts` / `matcher.ts` dependencies are **kept in place** — retiring that live UI is scope-deferred to a follow-up phase so P4 stays inside the $3k HARD-CUT. Maps to PHASE.md §Phase 4 tasks 1-4.

## must_haves

Goal-backward phase-verify checks. Each is independently testable.

1. **Truth — a submitted lead always gets a match_token returned and stored.**
   Artifact: `leads.match_token uuid UNIQUE NOT NULL DEFAULT uuid_generate_v4()` column exists. `/api/leads` POST returns `{ ok: true, match_token: <uuid>, matches_ready: <bool> }`.
   Verify: `psql -c "\d leads" | grep match_token` + `curl -X POST /api/leads -d @persona-a.json | jq -r .match_token` returns a uuid.

2. **Truth — the RPC returns the locked weight vector's exact top-3 for all 4 research personas.**
   Artifact: `match_unis_for_lead(uuid, jsonb)` function present; exact top-3 arrays (order matters): A=`['UNSW','UWA','Adelaide']`, B=`['WSU','UTS','RMIT']`, C=`['UWA','UTS','RMIT']`, D=`['Adelaide','UOW','WSU']` (round-1 Blocker #4 locked — no tolerance).
   Verify: SQL smoke via Supabase Studio per Wave 6 Task 6.2 scripts.

3. **Truth — RPC failure never rolls back the lead INSERT.**
   Artifact: `/api/leads/route.ts` — RPC call wrapped in try/catch, errors logged, route still returns 200 with `matches_ready: false`.
   Verify (deterministic failure injection — Gideon plan-check round 1 Blocker #5):
     (a) temporarily `REVOKE EXECUTE ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM service_role;` via Supabase SQL editor
     (b) submit a persona-A lead via `/api/leads`; assert response is HTTP 200 with `{ok:true, match_token:<uuid>, matches_ready:false}`
     (c) `SELECT matches, matches_computed_at FROM public.leads WHERE email='persona-a-smoke@example.com'` returns `NULL, NULL`
     (d) Resend email arrives (check `/tmp/resend-log.txt` or Resend dashboard) with `Matches computed: NO — RPC failed`
     (e) `GRANT EXECUTE ON FUNCTION public.match_unis_for_lead(uuid, jsonb) TO service_role;` to restore; cleanup test lead.
   The previous `preferred_fields = NULL` approach was flagged: the RPC's Landmine #6 handling deliberately treats NULL as half-score, so that lead succeeds by design.

4. **Truth — /matches/{token} renders fresh results anonymously for 30 min, falls back to magic-link after.**
   Artifact: `web/src/app/matches/[token]/page.tsx` Server Component branching on `(!lead.matches, age_ms <= 30min, age_ms > 30min)`.
   Verify: browser UAT after Sam submits a lead; flip `matches_computed_at = now() - interval '31 minutes'` in SQL, reload, assert `ExpiredTokenFallback` renders.

5. **Truth — no visa/migration/PR/MLTSSL/subclass strings in match output.**
   Artifact: MARA banner uses canonical constant from `lib/mara-disclaimer.ts`; reason fragments use field/level/budget/IELTS/QS/G8/placement/regional/intake vocabulary only.
   Verify: `grep -riE "(visa|migration|PR|MLTSSL|subclass|points test|post-study work)" web/src/app/matches/ web/src/components/matches/ web/src/lib/match-*.ts` returns only the explicit MaraBanner disclaimer line (which names them in the negative).

6. **Truth — the orphan /api/match route is removed.**
   Artifact: `web/src/app/api/match/route.ts` does not exist. `universities.ts` + `matcher.ts` are retained — they back the live home-page `MatcherSection`, retiring that UI is a follow-up phase (tracked in CONTEXT §deferred).
   Verify: `test ! -f web/src/app/api/match/route.ts` returns exit 0; `grep -rn 'api/match' web/src --include='*.ts' --include='*.tsx'` returns zero hits.

7. **Truth — migrations applied live + industry_placement repopulated via UPSERT.**
   Artifact: production Supabase project has `courses.industry_placement` column, `leads.matches`/`matches_computed_at`/`match_token` columns, `idx_leads_match_token` index, `match_unis_for_lead` function with EXECUTE granted to `service_role` only.
   Verify: `psql -c "\df match_unis_for_lead"` returns one row; `psql -c "SELECT has_function_privilege('anon', 'public.match_unis_for_lead(uuid, jsonb)', 'execute')"` returns `false`; `SELECT count(*) FROM courses WHERE industry_placement = true` returns > 20 (not the all-false DEFAULT).

8. **Truth — match_token has UNIQUE constraint + cryptographic uuid4 entropy.**
   Artifact: `leads_match_token_unique` constraint exists on leads; `match_token` defaults to `uuid_generate_v4()`.
   Verify: `psql -c "\d leads" | grep leads_match_token_unique` returns a row.

## Deviations from CONTEXT

Two research-surfaced deltas require Gideon plan-check sign-off before execute.

### Delta 1 — RPC signature: `RETURNS jsonb` instead of `RETURNS TABLE(...)`

- **CONTEXT R-2 locked:** `match_unis_for_lead(lead_id uuid, weights jsonb) RETURNS TABLE(...)`
- **Research recommended:** `RETURNS jsonb` — the function self-UPDATEs `leads.matches` + `leads.matches_computed_at` as a side-effect and returns the same jsonb payload. Reasoning:
  1. One round-trip — caller uses returned payload directly for email body + response, no second SELECT
  2. Atomicity — if SELECT-then-UPDATE were split across TS + SQL, a mid-flight crash leaves a half-computed state
  3. `leads.matches` is already `jsonb` — same shape in, out, stored
- **Risk:** low. Side-effecting function is Supabase-idiomatic; audit trail unchanged.
- **Recommendation:** adopt `RETURNS jsonb`. If Gideon plan-check rejects, fall back to `RETURNS TABLE(...)` and add a second `UPDATE leads SET matches = (SELECT jsonb_agg(r.*) FROM ...)` statement — adds ~40 LoC, no semantic change to output shape.

### Delta 2 — Regional heuristic REJECTED by Gideon plan-check round 1 (2026-04-19)

- **CONTEXT locked:** no `preferred_state` column in P4 (P3 confirmed none exists). Location tiebreaker dropped.
- **Research proposed:** `regional_score` triggers when `preferred_fields ∋ 'Health' OR 'Education'` — 5 pts.
- **Gideon ruling:** REJECT. "There is no explicit regional-preference field in the lead data, so inferring regional intent from `Health`/`Education` is too hand-wavy to lock into ranking."
- **Applied fix:** `regional = 0` in the weight vector. The 5 points go to `qs_rank = 15` (as the research fallback already proposed). The regional CTE branch is simplified to always emit 0 in the RPC body (migration 004).
- **Persona D impact:** Adelaide still wins rank 1 (G8 + QS #106 + Health field dominance). UOW second via QS #167 + Health. Wave 6 persona assertion reflects this.

### Delta 3 — `prioritize_outcomes` signal REJECTED by Gideon plan-check round 1 (2026-04-19)

- **CONTEXT assumption (incorrect):** §3 "Step 3 captures ... `prioritize_outcomes`" (CONTEXT.md line 31) — but grep of `web/src/components/lead/Step3Preferences.tsx` confirms Step 3 only captures `preferred_fields` / `preferred_levels` / `preferred_intake_month`. `prioritize_outcomes` lives only in the retained pre-P3 `MatcherForm.tsx` scaffold, not in the P3 lead capture flow.
- **Planner's substitute (rejected):** RPC inferred the flag via `preferred_fields && ARRAY['Health','Education','IT','Engineering']`.
- **Gideon ruling:** REJECT. "That is scope drift and changes ranking semantics."
- **Applied fix:** `industry_placement = 0` in the weight vector until the signal is actually captured in a future phase. The 5 points go to `budget = 23` (research's #1-driver signal per W-1 justification). The `v_lead_prioritizes_outcomes` variable is set to `false` inside the RPC so the existing `placement_score` CASE branch short-circuits to `0` (the branch stays in place as schema-future-proofing — a v2 phase that captures a real signal will flip the variable to a real expression). The `industry_placement` column still ships in migration 003 as schema prep for that future signal capture.

**Final locked weight vector (post round-1 revisions):**

| Signal | Weight | Change | Note |
|---|---:|---:|---|
| field | 30 | — | core |
| level | 12 | — | core |
| budget | 23 | +5 | +5 from zeroed industry_placement (research "#1 abandonment driver") |
| ielts | 12 | — | core |
| qs_rank | 15 | +5 | +5 from zeroed regional per Gideon DELTA-2 ruling |
| g8 | 5 | — | tiebreaker |
| industry_placement | 0 | -5 | no captured signal; column ships for v2 |
| regional | 0 | -5 | no captured signal; heuristic rejected |
| intake | 3 | — | low-signal within 12-uni seed |
| **Total** | **100** | — | Core 77 + Tiebreak 23 |

---

## Waves

### Wave 1 — Pure TS foundations (parallel-safe)

Five small typed TS files that downstream waves consume. No cross-dependencies within the wave — executor can land all five before any DB work.

#### Task 1.1: Create `match-weights.ts` — locked weight vector + stretch constants

<objective>Export the typed weight record + stretch windows used by both the RPC (passed as jsonb) and any v2 TS-side re-scoring.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"Weight Numbers (W-7 closure)" — locked vector
- `.planning/research/4-RESEARCH.md` §"Final weight vector — LOCKED for plan" (lines 165-192)
- `.planning/4-CONTEXT.md` §Weighting strategy W-1 through W-7
- `web/src/lib/lead-score.ts` — file shape/export pattern to mirror (no logic reuse)
</read_first>

<action>
Create `web/src/lib/match-weights.ts` with the exact typed constants below. No extra logic, no helpers — constants only. Per W-4 these are passed to the RPC as a jsonb parameter so SQL stays deterministic and weights stay git-reviewable.

```typescript
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
```

Do not add helper functions. Do not add a default export. The `as const` type narrowing is load-bearing — downstream consumers rely on literal int types.
</action>

<acceptance_criteria>
- `test -f web/src/lib/match-weights.ts` returns exit 0.
- `grep -n "field: 30" web/src/lib/match-weights.ts` returns exactly one hit.
- `grep -n "budget: 23" web/src/lib/match-weights.ts` returns exactly one hit (round-3 locked vector).
- `grep -n "qs_rank: 15" web/src/lib/match-weights.ts` returns exactly one hit (round-3 locked vector; +5 from zeroed regional per Gideon DELTA-2).
- `grep -n "industry_placement: 0" web/src/lib/match-weights.ts` returns exactly one hit (no captured signal — round-1 Blocker #3).
- `grep -n "regional: 0" web/src/lib/match-weights.ts` returns exactly one hit (heuristic rejected — round-1 DELTA-2).
- `grep -n "weight_penalty: 0.50" web/src/lib/match-weights.ts` returns exactly one hit.
- `grep -n "TOKEN_TTL_MINUTES = 30" web/src/lib/match-weights.ts` returns exactly one hit.
- `cd web && npx tsc --noEmit` exits clean.
- File exports are `MATCH_WEIGHTS`, `MatchWeights`, `STRETCH`, `NORMALIZATION`, `TOKEN_TTL_MINUTES`, `MATCH_WEIGHTS_JSON`. No other exports.
</acceptance_criteria>

<done>Typed weight constants shipped; round-3 locked vector: core (30+12+23+12=77) + tiebreakers (15+5+0+0+3=23) = 100 verified by grep.</done>

---

#### Task 1.2: Create `mara-disclaimer.ts` — canonical MARA banner constant

<objective>Single source of truth for the MARA banner text. Prevents the "copy drift" landmine where developers edit the banner string without updating RESEARCH/PHASE canonical references.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"MARA Banner Wording (open item 4)" (lines 379-408)
- `web/src/lib/content.ts` — existing MARA disclaimer patterns (P0.5 scrubbed)
- `web/src/app/api/chat/route.ts:45` — existing disclaimer string
</read_first>

<action>
Create `web/src/lib/mara-disclaimer.ts` with the exact constants below. Follows the `CONSENT_WORDING_VERSION` pattern from `lib/lead-schema.ts` — any edit to the banner body MUST bump the version in the same commit.

```typescript
// web/src/lib/mara-disclaimer.ts
// P4 UniMatch — canonical MARA disclaimer strings for /matches/[token].
// Research: .planning/research/4-RESEARCH.md §"MARA Banner Wording (open item 4)"
//
// Edit rule: bumping the string requires bumping MARA_DISCLAIMER_VERSION in the
// same commit, same way CONSENT_WORDING_VERSION works in lib/lead-schema.ts.
// This prevents the "copy drift" landmine (Research §Landmines #8).

export const MARA_DISCLAIMER_VERSION = "2026-04-19.v1";

export const MARA_DISCLAIMER_BODY =
  "Atlas AI matches are educational information only, not migration advice. " +
  "For visa, migration, or PR guidance, consult UniMate's registered MARA agents.";

export const MARA_DISCLAIMER_EYEBROW = "Disclaimer";

export const MARA_CONSULT_CTA_LABEL = "Book a free consultation";
export const MARA_CONSULT_CTA_HREF = "/consult";
```

No React. No JSX. Plain string constants. Imported by `MaraBanner.tsx` (Wave 5).
</action>

<acceptance_criteria>
- `test -f web/src/lib/mara-disclaimer.ts` returns exit 0.
- `grep -F "Atlas AI matches are educational information only, not migration advice." web/src/lib/mara-disclaimer.ts` returns exactly one hit.
- `grep -F "visa, migration, or PR guidance" web/src/lib/mara-disclaimer.ts` returns exactly one hit.
- `grep -F "UniMate's registered MARA agents" web/src/lib/mara-disclaimer.ts` returns exactly one hit.
- `cd web && npx tsc --noEmit` exits clean.
</acceptance_criteria>

<done>Canonical MARA banner string locked as module constant; version stamp matches plan-lock date.</done>

---

#### Task 1.3: Create `match-schema.ts` — Zod schema for the RPC output jsonb

<objective>Lock the shape of the `leads.matches` JSONB so (a) the Server Component validates what the RPC wrote before rendering, (b) future key renames on either side fail loudly instead of silently rendering `undefined`. Landmine #10 mitigation.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §Landmines #10 (lines 1087-1113) — Zod schema body
- `.planning/4-CONTEXT.md` §"Claude's Discretion" — `reason_parts` suggested shape
- `web/src/lib/lead-schema.ts` — Zod file shape + export pattern to mirror
</read_first>

<action>
Create `web/src/lib/match-schema.ts` with the Zod schemas below verbatim from RESEARCH.md §Landmines #10. Notes: `budget_verdict` enum is `["within", "stretch", "far_stretch"]` (not just `["within", "stretch"]` as CONTEXT "Claude's Discretion" suggested — the RPC outputs `far_stretch` for 20-50% over budget rows that still surface in stretch section). `ielts_verdict` enum is `["meets", "stretch", "below"]`.

```typescript
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
```
</action>

<acceptance_criteria>
- `test -f web/src/lib/match-schema.ts` returns exit 0.
- `grep -n "MatchResultSchema = z.object" web/src/lib/match-schema.ts` returns one hit.
- `grep -n "MatchesJsonbSchema = z.object" web/src/lib/match-schema.ts` returns one hit.
- `grep -n 'z.enum(\["within", "stretch", "far_stretch"\])' web/src/lib/match-schema.ts` returns one hit.
- `grep -n 'strong: z.array(MatchResultSchema).max(3)' web/src/lib/match-schema.ts` returns one hit.
- `cd web && npx tsc --noEmit` exits clean.
</acceptance_criteria>

<done>Zod schema for matches jsonb exported; type inference provides `MatchesJsonb`, `MatchResult`, `ReasonParts` to downstream consumers.</done>

---

#### Task 1.4: Create `match-reason.ts` — template renderer for reason_parts → single line

<objective>Render the structured `reason_parts` JSONB into the `"Matches IT + Business · Within budget · IELTS 6.5 needed · Group of Eight · QS #19"` dot-separated line required by RT-2/RT-3.</objective>

<read_first>
- `.planning/4-CONTEXT.md` §"Reason text (RT-*)" — RT-1 through RT-4
- `.planning/research/4-RESEARCH.md` §"Results Page Design Sketch" — wireframe reason line examples (lines 862-870)
- `web/src/lib/match-stub.ts` — existing reason-text pattern (dot-separator idiom)
- `web/src/lib/match-schema.ts` (just created) — `ReasonParts` type
</read_first>

<action>
Create `web/src/lib/match-reason.ts`. Pure function, no side effects. Takes `ReasonParts` + course-specific context, returns the single display line plus a smart top-3 fragment array so the UI can bold-highlight the winning signals (per RT-3 "smart top-3 — the 3 signals that contributed most to THIS uni's score get named").

```typescript
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
```

Do not introduce a MARA-flagged word (visa/migration/PR/etc.) in any fragment text. The fragments are hard-coded; a grep gate in Wave 6 enforces this.
</action>

<acceptance_criteria>
- `test -f web/src/lib/match-reason.ts` returns exit 0.
- `grep -nE "(visa|migration|\\bPR\\b|MLTSSL|subclass)" web/src/lib/match-reason.ts` returns zero hits.
- `grep -n "renderReason" web/src/lib/match-reason.ts` returns at least one hit (export).
- `grep -n "stretchBudgetExplanation" web/src/lib/match-reason.ts` returns at least one hit (export).
- `cd web && npx tsc --noEmit` exits clean.
</acceptance_criteria>

<done>Pure template function shipped; renders `reason_parts` → dot-joined line up to 6 fragments; MARA-safe word list only.</done>

---

#### Task 1.5: Extend `types.ts` — add MatchTier (non-destructive; legacy types preserved)

<objective>Add P4 match domain types to `web/src/lib/types.ts` **without removing** the legacy `MatchBucket` / `ReasonChip` / `MatchResult` / `MatchResponse` shapes — those are still consumed by `lib/matcher.ts` and `components/MatcherForm.tsx`, which are now preserved (post Gideon plan-check round 1 narrowing of the delete list). Avoid the `MatchResult` name collision by NOT re-exporting it from `types.ts`; P4 callers import directly from `@/lib/match-schema`.</objective>

<read_first>
- `web/src/lib/types.ts` (the full file — legacy `MatchBucket`, `ReasonChip`, `MatchResult`, `MatchResponse` shapes at lines 61-82 stay in place)
- `web/src/lib/match-schema.ts` (just created) — new `MatchResult` export (scoped to P4 consumers only)
- `web/src/lib/matcher.ts` — STILL imports legacy types; preserved post round-1 narrowing
- `web/src/components/MatcherForm.tsx` — imports `MatchResponse` from `@/lib/types`; preserved post round-1 narrowing
</read_first>

<action>
Edit `web/src/lib/types.ts`. Do NOT delete the legacy demo types. Only APPEND a small MatchTier export at the bottom. P4 match-schema types are imported directly from `@/lib/match-schema` by new callers — no re-export to avoid collision with the legacy `MatchResult`.

Steps:
1. Read `types.ts` current content.
2. Leave lines 61-82 (`MatchBucket`, `ReasonChip`, `MatchResult`, `MatchResponse`) unchanged.
3. Append at the bottom:
   ```typescript
   // -----------------------------------------------------------------
   // P4 UniMatch — new types live in web/src/lib/match-schema.ts (Zod-first).
   // They are NOT re-exported here: doing so would collide with the legacy
   // `MatchResult` name still used by web/src/lib/matcher.ts + MatcherForm.tsx.
   // P4 code imports `{ MatchResult, ReasonParts, MatchesJsonb }` directly
   // from `@/lib/match-schema`. This file only exposes the tier discriminator.
   // -----------------------------------------------------------------
   export type MatchTier = "strong" | "stretch";
   ```
</action>

<acceptance_criteria>
- `grep -n "MatchBucket" web/src/lib/types.ts` returns ONE hit (legacy type preserved).
- `grep -n "ReasonChip" web/src/lib/types.ts` returns at least ONE hit (legacy type preserved).
- `grep -n 'export type MatchTier' web/src/lib/types.ts` returns one hit (new export).
- `grep -n "export type { MatchResult" web/src/lib/types.ts` returns zero hits (no re-export — avoids collision).
- `cd web && npx tsc --noEmit` exits clean (MatcherForm + matcher.ts continue to compile against their legacy imports).
</acceptance_criteria>

<done>MatchTier discriminator added; legacy demo types fully preserved; no `MatchResult` name collision; typecheck stays clean.</done>

---

### Wave 2 — Schema migration files (sequential: 003 → 004)

Two migration files authored but NOT yet applied to live DB. Application happens in Wave 3 (BLOCKING task).

#### Task 2.1: Create `supabase/migrations/003_match_prep.sql`

<objective>Add the schema that migration 004 depends on: `courses.industry_placement`, `leads.matches`/`matches_computed_at`/`match_token`, unique constraint + index on `match_token`, drop unused `leads.matched_university_ids`.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"Migration 003 DDL (proposed — planner should lift verbatim)" (lines 619-653)
- `.planning/research/4-RESEARCH.md` §Landmines #4 (match_token uniqueness), #7 (RLS on dropped column)
- `.planning/4-CONTEXT.md` §migration_scope — SQL body
- `supabase/migrations/001_initial_schema.sql` — leads table shape (lines 62-102) + style conventions
- `supabase/migrations/002_leads_status.sql` — style reference (header comments, single-purpose migration)
</read_first>

<action>
Create `supabase/migrations/003_match_prep.sql` with the body below. Lifted verbatim from RESEARCH.md with two additions per Landmine #4 (UNIQUE constraint) and Landmine #7 (pg_policies pre-flight comment).

```sql
-- Atlas AI — P4 UniMatch prep: add industry_placement, match storage, token
-- Region: ap-southeast-1 (Singapore)
-- Apply via: supabase db push (or Supabase Management API /v1/projects/{ref}/database/query)
-- Prerequisites: 001_initial_schema.sql + 002_leads_status.sql applied.
--
-- Why this exists: P4 UniMatch engine needs three schema additions the P1 migration
-- deferred (industry_placement was in TS type only) or never built (matches/token
-- storage). Shipped as a discrete migration so the plpgsql function in 004 has a
-- stable schema to reference.

-- ================================================================
-- courses.industry_placement — was in TS type (universities-seed.ts), missing in DB
-- Seed script (web/scripts/seed-universities.ts:24) explicitly flagged as P4's job
-- ================================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS industry_placement boolean NOT NULL DEFAULT false;

-- ================================================================
-- leads match result storage
-- ================================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS matches jsonb,
  ADD COLUMN IF NOT EXISTS matches_computed_at timestamptz,
  ADD COLUMN IF NOT EXISTS match_token uuid DEFAULT uuid_generate_v4();

-- ================================================================
-- Drop the array column (was scaffolded in P1, never populated, superseded by matches jsonb)
-- Pre-flight: per Research Landmine #7, verify no RLS policy references matched_university_ids.
-- P1 migration added only leads_anon_insert (WITH CHECK (true)) — no column refs. Safe.
-- ================================================================
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS matched_university_ids;

-- ================================================================
-- Backfill match_token for any pre-existing rows (zero rows in prod today; safe no-op)
-- Must run BEFORE adding NOT NULL + UNIQUE so legacy rows without a default don't block.
-- ================================================================
UPDATE public.leads SET match_token = uuid_generate_v4() WHERE match_token IS NULL;

-- ================================================================
-- Enforce NOT NULL + UNIQUE (Landmine #4 — DEFAULT alone doesn't guarantee uniqueness)
-- ================================================================
ALTER TABLE public.leads
  ALTER COLUMN match_token SET NOT NULL;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_match_token_unique UNIQUE (match_token);

-- ================================================================
-- Token lookup index — /matches/{token} server component uses this exclusively
-- UNIQUE constraint creates a btree index automatically; keep an explicit named
-- index for grep-discoverability per `must_haves.artifacts`.
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_leads_match_token ON public.leads(match_token);

-- ================================================================
-- No RLS policy changes. anon still has INSERT-only (001 migration).
-- match_token is returned in the 200 response from /api/leads; server-role reads
-- leads from /matches/[token] Server Component. No new anon SELECT path added.
-- ================================================================
```

File naming: `003_match_prep.sql` (three-digit padded, matches P1/P2 convention). No wrapper transaction BEGIN/COMMIT (Supabase Management API handles that per-query).
</action>

<acceptance_criteria>
- `test -f supabase/migrations/003_match_prep.sql` returns exit 0.
- `grep -n "ADD COLUMN IF NOT EXISTS industry_placement boolean NOT NULL DEFAULT false" supabase/migrations/003_match_prep.sql` returns one hit.
- `grep -n "ADD COLUMN IF NOT EXISTS matches jsonb" supabase/migrations/003_match_prep.sql` returns one hit.
- `grep -n "ADD CONSTRAINT leads_match_token_unique UNIQUE" supabase/migrations/003_match_prep.sql` returns one hit.
- `grep -n "DROP COLUMN IF EXISTS matched_university_ids" supabase/migrations/003_match_prep.sql` returns one hit.
- `grep -n "CREATE INDEX IF NOT EXISTS idx_leads_match_token" supabase/migrations/003_match_prep.sql` returns one hit.
- File has NO `BEGIN` / `COMMIT` wrapper.
</acceptance_criteria>

<done>Migration 003 DDL authored; adds the 4 columns the RPC needs + drops unused column + unique constraint enforcing match_token uniqueness.</done>

---

#### Task 2.2: Create `supabase/migrations/004_match_function.sql`

<objective>Ship the `match_unis_for_lead(uuid, jsonb) RETURNS jsonb` plpgsql function. Scores every course for the given lead, rolls up to best-match uni, classifies matches/stretch, normalizes match_pct 0-100, UPDATEs `leads.matches` + `leads.matches_computed_at` as side effect, returns the same jsonb so the caller can use it directly.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"Migration 004 outline (detailed plpgsql in plan)" (lines 656-825) — full function body
- `.planning/research/4-RESEARCH.md` §"RPC Failure Handling" — RETURNS jsonb rationale (Delta 1)
- `.planning/research/4-RESEARCH.md` §Landmines #1, #2, #5, #6 — search_path, REVOKE/GRANT, intake defaults, preferred_fields NULL
- `.planning/4-CONTEXT.md` §Ranking algorithm R-1/R-2/R-3/R-4 — granularity, SQL shape, tiebreaks, normalization
- `web/src/lib/match-weights.ts` (Wave 1) — weight vector that will be passed in as p_weights
- `supabase/migrations/003_match_prep.sql` (Wave 2 Task 2.1) — schema the function references
- `supabase/migrations/001_initial_schema.sql` — universities + courses + leads column names
</read_first>

<action>
Create `supabase/migrations/004_match_function.sql` with the full plpgsql function body below. Lifted from RESEARCH.md §"Migration 004 outline" with Landmine #6 fix applied (NULL preferred_fields → half-score, not zero) and Landmine #2 REVOKE/GRANT block at end.

```sql
-- Atlas AI — P4 UniMatch engine RPC
-- Region: ap-southeast-1 (Singapore)
-- Apply via: supabase db push (applied AFTER 003_match_prep.sql)
-- Prerequisites: 003_match_prep.sql applied (needs industry_placement + matches/token columns).
--
-- Function signature deviation from CONTEXT R-2 (locked RETURNS TABLE):
-- We RETURN jsonb + self-UPDATE leads.matches as side effect. Rationale documented
-- in .planning/research/4-RESEARCH.md §"RPC Failure Handling — Revised RPC signature"
-- and .planning/4-PLAN.md §Deviations from CONTEXT — Delta 1.
--
-- Regional heuristic: REJECTED by Gideon plan-check round 1 (2026-04-19).
-- v1 has no preferred_state column and inferring regional intent from
-- preferred_fields was judged scope drift. regional_score is hard-zero; the
-- column still exists in the weight jsonb for v2 once a real signal is captured.
-- See 4-PLAN.md §"Deviations from CONTEXT — Delta 2" for the ruling.

CREATE OR REPLACE FUNCTION public.match_unis_for_lead(
  p_lead_id uuid,
  p_weights jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Landmine #1: prevent search_path hijack; fully qualify all refs
AS $$
DECLARE
  v_lead record;
  v_matches jsonb;
  -- weights unpacked from p_weights
  v_w_field numeric;
  v_w_level numeric;
  v_w_budget numeric;
  v_w_ielts numeric;
  v_w_qs numeric;
  v_w_g8 numeric;
  v_w_placement numeric;
  v_w_regional numeric;
  v_w_intake numeric;
  v_lead_prioritizes_outcomes boolean;
BEGIN
  -- ------------------------------------------------------------------
  -- Load lead profile (fully qualified per search_path='')
  -- ------------------------------------------------------------------
  SELECT id, preferred_fields, preferred_levels, preferred_intake_month,
         tuition_budget_aud, ielts_overall
  INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead % not found', p_lead_id;
  END IF;

  -- prioritize_outcomes is not captured anywhere in the P3 lead flow (only in the
  -- retained pre-P3 MatcherForm scaffold). Per 4-PLAN.md Delta 3 (Gideon round-1
  -- REJECT) we do not infer it from preferred_fields — that was judged scope drift.
  -- Weight `industry_placement` is 0 in the passed-in jsonb. The branch below stays
  -- in place so a future phase can flip it on by capturing a real signal.
  v_lead_prioritizes_outcomes := false;

  -- ------------------------------------------------------------------
  -- Unpack weights jsonb → numeric locals
  -- ------------------------------------------------------------------
  v_w_field     := (p_weights->>'field')::numeric;
  v_w_level     := (p_weights->>'level')::numeric;
  v_w_budget    := (p_weights->>'budget')::numeric;
  v_w_ielts     := (p_weights->>'ielts')::numeric;
  v_w_qs        := (p_weights->>'qs_rank')::numeric;
  v_w_g8        := (p_weights->>'g8')::numeric;
  v_w_placement := (p_weights->>'industry_placement')::numeric;
  v_w_regional  := (p_weights->>'regional')::numeric;
  v_w_intake    := (p_weights->>'intake')::numeric;

  -- ------------------------------------------------------------------
  -- Score all courses via chained CTEs
  -- ------------------------------------------------------------------
  WITH course_scores AS (
    SELECT
      c.id                AS course_id,
      c.university_id,
      c.name              AS course_name,
      c.field,
      c.level,
      c.indicative_fee,
      c.ielts_overall     AS course_ielts,
      c.industry_placement,
      u.name              AS uni_name,
      u.short_name,
      u.qs_ranking_2025,
      u.is_group_of_eight,
      u.is_regional,
      u.city,
      u.state,
      -- field_score — Landmine #6: NULL preferred_fields → half-score (not 0)
      CASE
        WHEN v_lead.preferred_fields IS NULL
          OR array_length(v_lead.preferred_fields, 1) IS NULL THEN v_w_field / 2
        WHEN c.field = ANY(v_lead.preferred_fields) THEN v_w_field
        ELSE 0
      END AS field_score,
      -- level_score — empty/NULL preferred_levels → full (student didn't filter)
      CASE
        WHEN v_lead.preferred_levels IS NULL
          OR array_length(v_lead.preferred_levels, 1) IS NULL THEN v_w_level
        WHEN c.level = ANY(v_lead.preferred_levels) THEN v_w_level
        ELSE 0
      END AS level_score,
      -- budget_score — stretch math per Research §Stretch Math
      CASE
        WHEN v_lead.tuition_budget_aud IS NULL THEN v_w_budget / 2
        WHEN c.indicative_fee IS NULL THEN v_w_budget / 2
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud THEN v_w_budget
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud * 1.20 THEN v_w_budget / 2
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud * 1.50 THEN 0
        ELSE -1  -- sentinel: hard-cut, course excluded downstream
      END AS budget_score,
      -- ielts_score — stretch math
      CASE
        WHEN v_lead.ielts_overall IS NULL THEN v_w_ielts / 2
        WHEN c.ielts_overall IS NULL THEN v_w_ielts / 2
        WHEN v_lead.ielts_overall >= c.ielts_overall THEN v_w_ielts
        WHEN v_lead.ielts_overall >= c.ielts_overall - 0.5 THEN v_w_ielts / 2
        ELSE -1  -- sentinel: hard-cut
      END AS ielts_score,
      -- qs_score — scaled 0..v_w_qs; unranked unis (NULL) treated as rank 999
      GREATEST(0, v_w_qs * (1 - COALESCE(u.qs_ranking_2025, 999)::numeric / 200)) AS qs_score,
      -- g8_score
      CASE WHEN u.is_group_of_eight THEN v_w_g8 ELSE 0 END AS g8_score,
      -- placement_score — triggers only when student's field matches AND course has placement
      CASE
        WHEN v_lead_prioritizes_outcomes
         AND c.field = ANY(COALESCE(v_lead.preferred_fields, ARRAY[]::text[]))
         AND c.industry_placement
        THEN v_w_placement
        ELSE 0
      END AS placement_score,
      -- regional_score — heuristic REJECTED round 1; hard-zero.
      -- v_w_regional is 0 in the passed weight vector; no preferred_state column
      -- exists to drive this signal. A v2 phase will reintroduce this branch once
      -- the signal is captured.
      0::numeric AS regional_score,
      -- intake_score
      CASE
        WHEN v_lead.preferred_intake_month IS NULL THEN v_w_intake / 2
        WHEN v_lead.preferred_intake_month = ANY(c.intake_months) THEN v_w_intake
        ELSE 0
      END AS intake_score
    FROM public.courses c
    JOIN public.universities u ON c.university_id = u.id
  ),
  course_totals AS (
    SELECT *,
      -- total_score: sum of all signals, treating -1 sentinels as 0
      CASE WHEN budget_score < 0 THEN 0 ELSE budget_score END
      + CASE WHEN ielts_score < 0 THEN 0 ELSE ielts_score END
      + field_score + level_score
      + qs_score + g8_score + placement_score + regional_score + intake_score
      AS total_score,
      -- hard_cut: exclude from matches entirely
      (budget_score < 0 OR ielts_score < 0 OR field_score = 0) AS hard_cut,
      -- stretch_flag: 50%-of-weight on budget OR ielts (but not hard-cut)
      (budget_score < 0 OR ielts_score < 0) = false
      AND (budget_score = v_w_budget / 2 OR ielts_score = v_w_ielts / 2)
      AS stretch_flag
    FROM course_scores
  ),
  uni_best AS (
    -- Per R-1: per-uni score = max(course_score). DISTINCT ON keeps the best course per uni.
    SELECT DISTINCT ON (university_id) *
    FROM course_totals
    WHERE NOT hard_cut
    ORDER BY university_id, total_score DESC
  ),
  ranked AS (
    -- Per R-3: order by total desc, tiebreak QS asc, G8 desc, name asc
    SELECT *,
      ROW_NUMBER() OVER (
        ORDER BY total_score DESC,
                 qs_ranking_2025 ASC NULLS LAST,
                 is_group_of_eight DESC,
                 uni_name ASC
      ) AS rn
    FROM uni_best
  ),
  top_score AS (
    SELECT total_score AS max_score FROM ranked WHERE rn = 1
  ),
  enriched AS (
    -- Build the per-match jsonb shape consumed by match-schema.ts MatchResultSchema
    SELECT
      r.*,
      jsonb_build_object(
        'uni_id',      r.university_id,
        'uni_name',    r.uni_name,
        'short_name',  r.short_name,
        'course_name', r.course_name,
        'match_pct',   ROUND(
          100.0 * r.total_score / NULLIF((SELECT max_score FROM top_score), 0)
        )::int,
        'reason_parts', jsonb_build_object(
          'matched_fields',   ARRAY[r.field],
          'budget_verdict',
            CASE
              WHEN r.budget_score = v_w_budget THEN 'within'
              WHEN r.budget_score = v_w_budget / 2 THEN 'stretch'
              ELSE 'far_stretch'
            END,
          'ielts_verdict',
            CASE
              WHEN r.ielts_score = v_w_ielts THEN 'meets'
              WHEN r.ielts_score = v_w_ielts / 2 THEN 'stretch'
              ELSE 'below'
            END,
          'qs_rank',            r.qs_ranking_2025,
          'g8',                 r.is_group_of_eight,
          'industry_placement', r.industry_placement,
          'regional',           r.is_regional,
          'intake_hit',         r.intake_score = v_w_intake,
          'best_course_name',   r.course_name
        ),
        'stretch_reason',
          CASE
            WHEN r.budget_score = v_w_budget / 2 AND v_lead.tuition_budget_aud IS NOT NULL THEN
              'Tuition above your stated budget by roughly ' ||
              ROUND(100.0 * (r.indicative_fee - v_lead.tuition_budget_aud) / v_lead.tuition_budget_aud)::text ||
              '%.'
            WHEN r.ielts_score = v_w_ielts / 2 THEN
              'IELTS 0.5 band below the course requirement.'
            ELSE NULL
          END
      ) AS match_row
    FROM ranked r
  )
  -- ------------------------------------------------------------------
  -- Classify strong vs stretch BY TIER (stretch_flag), then cap 3 + 2.
  -- Per W-3: "Matches" (hard fit) + "Stretch" (within budget/IELTS tolerance).
  -- Gideon plan-check round 1 Blocker #2: prior impl used rn <= 3 / rn BETWEEN 4 AND 5
  -- which could leak stretch into strong and include non-stretch rows as stretch.
  -- ------------------------------------------------------------------
  SELECT jsonb_build_object(
    'strong',
      COALESCE(
        (SELECT jsonb_agg(e.match_row ORDER BY e.rn)
         FROM (
           SELECT match_row, rn FROM enriched
           WHERE NOT stretch_flag
           ORDER BY rn ASC
           LIMIT 3
         ) e),
        '[]'::jsonb
      ),
    'stretch',
      COALESCE(
        (SELECT jsonb_agg(e.match_row ORDER BY e.rn)
         FROM (
           SELECT match_row, rn FROM enriched
           WHERE stretch_flag
           ORDER BY rn ASC
           LIMIT 2
         ) e),
        '[]'::jsonb
      ),
    'computed_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) INTO v_matches;

  -- ------------------------------------------------------------------
  -- Persist to the lead row (side effect — keeps single round-trip)
  -- ------------------------------------------------------------------
  UPDATE public.leads
  SET matches = v_matches,
      matches_computed_at = now()
  WHERE id = p_lead_id;

  RETURN v_matches;
END;
$$;

-- ================================================================
-- Landmine #2: Supabase auto-grants EXECUTE to anon/authenticated by default in
-- some configs. REVOKE explicitly + GRANT only to service_role.
-- ================================================================
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.match_unis_for_lead(uuid, jsonb) TO service_role;
```

Length will be ~180 lines. Do not compress; readability matters for Gideon plan-check.
</action>

<acceptance_criteria>
- `test -f supabase/migrations/004_match_function.sql` returns exit 0.
- `grep -n "RETURNS jsonb" supabase/migrations/004_match_function.sql` returns one hit.
- `grep -n "SECURITY DEFINER" supabase/migrations/004_match_function.sql` returns one hit.
- `grep -n "SET search_path = ''" supabase/migrations/004_match_function.sql` returns one hit.
- `grep -n "UPDATE public.leads" supabase/migrations/004_match_function.sql` returns at least one hit.
- `grep -n "REVOKE ALL ON FUNCTION public.match_unis_for_lead" supabase/migrations/004_match_function.sql` returns at least two hits (PUBLIC + anon + authenticated).
- `grep -n "GRANT EXECUTE ON FUNCTION public.match_unis_for_lead(uuid, jsonb) TO service_role" supabase/migrations/004_match_function.sql` returns one hit.
- `grep -nE "(visa|migration|\\bPR\\b|MLTSSL|subclass)" supabase/migrations/004_match_function.sql` returns zero hits.
- File does NOT reference `c.industry_placement` without the 003 migration (003 must precede).
</acceptance_criteria>

<done>RPC function DDL authored with search_path lockdown, REVOKE/GRANT block, Landmine #6 NULL fix, Delta 2 regional heuristic commented inline.</done>

---

### Wave 3 — [BLOCKING] Schema push + seed upsert

Before any application code can call the RPC, the migrations must land in the live DB and the seed must refresh with accurate `industry_placement` values. If this wave is skipped, `/api/leads` will throw `function match_unis_for_lead does not exist` at runtime and phase-verify fails silently.

#### Task 3.1: [BLOCKING] Extend seed script with `--upsert` mode

<objective>Add `--upsert` to `web/scripts/seed-universities.ts` so we can refresh the 12 seeded courses' `industry_placement` values after migration 003 applies without destroying existing rows. Landmine #11 mitigation.</objective>

<read_first>
- `web/scripts/seed-universities.ts` — full current file (~150 lines, has --apply + --wipe already)
- `web/src/lib/universities-seed.ts` — 12 unis × 48 courses, `industry_placement` per course
- `.planning/research/4-RESEARCH.md` §"Why UPSERT beats --wipe" (lines 606-615)
- `.planning/research/4-RESEARCH.md` §Landmines #11 (lines 1115-1117)
</read_first>

<action>
Edit `web/scripts/seed-universities.ts`:

1. Parse a new `--upsert` CLI flag at the top alongside `--apply` + `--wipe`.
2. Add a new branch: when `UPSERT && APPLY`, use `.upsert({ onConflict: 'slug' })` for universities, then for each uni's courses perform a match-on-(university_id, name) UPDATE-or-INSERT loop. Pseudocode:

```typescript
const UPSERT = process.argv.includes("--upsert");

// ... existing --apply / --wipe branches ...

if (UPSERT && APPLY) {
  console.log(`Mode: UPSERT (non-destructive refresh)`);

  for (const uni of seedUniversities) {
    // University: upsert by slug
    const { data: upsertedUni, error: uniErr } = await supabase
      .from("universities")
      .upsert({
        slug: uni.slug,
        name: uni.name,
        short_name: uni.short_name,
        city: uni.city,
        state: uni.state,
        cricos_provider_code: uni.cricos_provider_code ?? null,
        qs_ranking_2025: uni.qs_ranking_2025 ?? null,
        is_group_of_eight: uni.is_group_of_eight,
        is_regional: uni.regional ?? false,
        website: uni.website ?? null,
        logo_letter: uni.logo_letter ?? null,
        hero_color: uni.hero_color ?? null,
      }, { onConflict: 'slug' })
      .select("id")
      .single();

    if (uniErr) {
      console.error(`[seed] upsert failed for ${uni.slug}:`, uniErr);
      continue;
    }

    // Courses: match on (university_id, name) — UPDATE if exists, INSERT if not.
    for (const course of uni.courses) {
      const { data: existing } = await supabase
        .from("courses")
        .select("id")
        .eq("university_id", upsertedUni!.id)
        .eq("name", course.course_name)
        .maybeSingle();

      const coursePayload = {
        university_id: upsertedUni!.id,
        cricos_code: (course as any).cricos_code ?? null,
        name: course.course_name,
        level: course.level,
        field: course.field,
        duration_months: course.duration_months,
        indicative_fee: course.annual_fee_aud,
        ielts_overall: course.ielts_min,
        industry_placement: course.industry_placement, // P4 migration 003 adds this column
        intake_months: [2, 7], // seed default; per-course backfill deferred to P4.5
      };

      if (existing?.id) {
        await supabase.from("courses").update(coursePayload).eq("id", existing.id);
      } else {
        await supabase.from("courses").insert(coursePayload);
      }
    }
  }
  console.log(`Upsert complete. Verify via Supabase Studio → courses → filter industry_placement=true.`);
  return;
}
```

Keep the existing `--apply` and `--wipe` branches untouched. The upsert path uses `universities.slug` UNIQUE constraint from the P1 schema as the merge key.

Update the file header comment block (lines 17-26) to document the new mode:
```
 *   npx tsx scripts/seed-universities.ts --upsert --apply  # non-destructive refresh (P4+)
```
</action>

<acceptance_criteria>
- `grep -n 'const UPSERT = process.argv.includes("--upsert")' web/scripts/seed-universities.ts` returns one hit.
- `grep -n "if (UPSERT && APPLY)" web/scripts/seed-universities.ts` returns one hit.
- `grep -n "onConflict: 'slug'" web/scripts/seed-universities.ts` returns at least one hit.
- `grep -n "industry_placement: course.industry_placement" web/scripts/seed-universities.ts` returns one hit.
- `cd web && npx tsc --noEmit --project tsconfig.json` exits clean OR existing legacy `any` casts in the seed script are preserved (do not introduce new ts errors).
- Running `cd web && npx tsx scripts/seed-universities.ts --upsert` (dry-run, no --apply) prints `Mode: UPSERT (non-destructive refresh)` and exits 0.
</acceptance_criteria>

<done>Seed script supports `--upsert --apply` for non-destructive refresh with `industry_placement` per-course values.</done>

---

#### Task 3.2: [BLOCKING] Apply 003 + 004 + seed upsert to live Supabase

<objective>Push both migrations to the live Supabase project (ap-southeast-1 Singapore) and run the seed upsert so the 12 seeded courses have accurate `industry_placement` values. Without this step, types resolve locally but the RPC does not exist in live DB — phase-verify fails silently.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"Seed Migration Order" — 3-command sequence (lines 582-604)
- `.planning/research/4-RESEARCH.md` §"Environment Availability" — CLI vs Management API fallback
- `planning/atlas-ai/DEVIATIONS.md` §DEV-001 — region ap-southeast-1
- `web/.env.local` — SUPABASE_ACCESS_TOKEN (PAT) or SUPABASE_SERVICE_ROLE_KEY available
- `supabase/migrations/003_match_prep.sql` (Wave 2 Task 2.1)
- `supabase/migrations/004_match_function.sql` (Wave 2 Task 2.2)
</read_first>

<action>
Apply the migrations in this exact order. Prefer Supabase CLI; if unavailable (CLI missing or not linked to project), fall back to Management API HTTP POST (P1 proven pattern).

Step 1 — Apply migration 003:
```bash
cd ~/Desktop/atlas-ai
# Preferred:
supabase db push --linked
# Fallback via Management API (if `supabase` CLI missing):
# Reads PAT from web/.env.local SUPABASE_ACCESS_TOKEN
# curl -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
#   -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
#   -H "Content-Type: application/json" \
#   -d "$(jq -Rs '{query: .}' < supabase/migrations/003_match_prep.sql)"

# Verify:
# Via Supabase Studio SQL editor:
#   \d public.courses   → must show industry_placement column
#   \d public.leads     → must show matches, matches_computed_at, match_token columns
#                         AND must NOT show matched_university_ids
#   \di idx_leads_match_token → must show index
```

Step 2 — Apply migration 004 (same command sequence, different file):
```bash
supabase db push --linked
# Verify:
#   \df public.match_unis_for_lead
#     → returns one row, arg types (uuid, jsonb), returns jsonb
#   SELECT has_function_privilege('service_role', 'public.match_unis_for_lead(uuid, jsonb)', 'execute')
#     → true
#   SELECT has_function_privilege('anon', 'public.match_unis_for_lead(uuid, jsonb)', 'execute')
#     → false
```

Step 3 — Run seed upsert:
```bash
cd ~/Desktop/atlas-ai/web
npx tsx scripts/seed-universities.ts --upsert --apply
# Verify on return:
#   SELECT count(*) FROM public.courses WHERE industry_placement = true
#     → returns a count > 20 (most seeded courses are true per universities-seed.ts)
#     → NOT 0 (which would mean only DEFAULT false applied, seed didn't run)
```

If any verify step fails — STOP and surface the failure to Sam via Telegram before continuing. Do not move to Wave 4 with a broken RPC.

Run the persona smoke test to confirm RPC works live:
```sql
-- In Supabase Studio SQL editor, run:
-- Persona A: G8 Business $55k IELTS 7.5 Masters
INSERT INTO public.leads (
  full_name, email, phone, country,
  preferred_fields, preferred_levels, preferred_intake_month,
  tuition_budget_aud, ielts_overall,
  consent_service, consent_marketing, consent_wording_version, consent_given_at
) VALUES (
  'Persona A Test', 'persona-a@example.com', '+61400000001', 'Nepal',
  ARRAY['Business'], ARRAY['postgraduate'], 2,
  55000, 7.5,
  true, false, '2026-04-17.v2', now()
) RETURNING id;
-- Copy the returned uuid, then:
SELECT public.match_unis_for_lead(
  '<copied-uuid>'::uuid,
  '{"field":30,"level":12,"budget":23,"ielts":12,"qs_rank":15,"g8":5,"industry_placement":0,"regional":0,"intake":3}'::jsonb
);
-- Expected: jsonb with strong array containing UNSW + UWA + Adelaide.
-- Cleanup: DELETE FROM public.leads WHERE email = 'persona-a@example.com';
```

Record output of the SQL verify commands in the commit message for Wave 3.
</action>

<acceptance_criteria>
- `psql "$SUPABASE_CONN" -c "\\d public.courses" | grep industry_placement` returns a row (or equivalent Studio SQL check reports the column present).
- `psql "$SUPABASE_CONN" -c "\\d public.leads" | grep matches` returns three rows: `matches`, `matches_computed_at`, `match_token`.
- `psql "$SUPABASE_CONN" -c "\\d public.leads" | grep matched_university_ids` returns zero rows (column dropped).
- `psql "$SUPABASE_CONN" -c "\\df public.match_unis_for_lead"` returns one row.
- `psql "$SUPABASE_CONN" -c "SELECT has_function_privilege('anon', 'public.match_unis_for_lead(uuid, jsonb)', 'execute')"` returns `false`.
- `psql "$SUPABASE_CONN" -c "SELECT count(*) FROM public.courses WHERE industry_placement = true"` returns a number greater than 20.
- Persona A smoke test (SQL above) returns jsonb with `strong` array of 3 rows and `strong[0].short_name = 'UNSW'`.
- Sam notified via Telegram when Wave 3 completes; migration diff + verify output captured in commit message body.
</acceptance_criteria>

<done>Live DB has 003 + 004 applied; seed refreshed; Persona A smoke returns UNSW/UWA/Adelaide; anon cannot execute the RPC.</done>

---

### Wave 4 — Route extension + scaffold removal (narrowed post Gideon round 1)

Waves 1-3 leave the schema + constants in place. Wave 4 wires the API route + prunes the orphan `/api/match/route.ts` only. `universities.ts` + `matcher.ts` + `MatcherForm.tsx` + `MatcherSection.tsx` are retained (they still back the home-page `MatcherSection` UI); their retirement is follow-up scope outside the $3k HARD-CUT.

#### Task 4.1: Extend `/api/leads/route.ts` to call the RPC post-INSERT

<objective>Wire `match_unis_for_lead(uuid, jsonb)` into the atomic lead flow. On RPC success, the lead row has `matches` + `matches_computed_at` populated before the function returns. On RPC failure, the lead INSERT is never rolled back — route returns 200 with `matches_ready: false` so the client still redirects to `/matches/{token}` where the `PendingMatches` component renders.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"RPC Failure Handling (open item 3)" (lines 257-376) — full transaction shape
- `.planning/research/4-RESEARCH.md` §"RPC shape — it UPDATES the row, doesn't return a resultset"
- `web/src/app/api/leads/route.ts` — full current file (must extend, not replace)
- `web/src/lib/match-weights.ts` (Wave 1 Task 1.1) — MATCH_WEIGHTS_JSON import
- `web/src/lib/supabase/service-role.ts` — existing service-role client factory
</read_first>

<action>
Edit `web/src/app/api/leads/route.ts`:

1. Add import near the top (after existing imports):
   ```typescript
   import { MATCH_WEIGHTS_JSON } from "@/lib/match-weights";
   ```

2. Change the INSERT call at line 64 to `.select("id, match_token").single()` so we receive the server-generated uuid token back:
   ```typescript
   const { data: inserted, error: insertError } = await supabase
     .from("leads")
     .insert(row)
     .select("id, match_token")
     .single();
   ```

3. Leave the `insertError` branch (returns 500) unchanged.

4. After the successful INSERT path (line 66 onward), BEFORE calling `sendNotificationEmails`, add the RPC call block. Match the Research §"Transaction shape" code:
   ```typescript
   // P4 UniMatch: compute matches via Postgres RPC. Failure path is lazy:
   // lead INSERT is preserved, matches remain null, /matches/{token} shows the
   // PendingMatches fallback. Sam gets notified via email body so he can
   // manually recompute via Supabase Studio if the RPC ever fails in prod.
   let matchesReady = false;
   try {
     const { error: rpcError } = await supabase.rpc("match_unis_for_lead", {
       p_lead_id: inserted!.id,
       p_weights: MATCH_WEIGHTS_JSON,
     });
     if (rpcError) {
       console.error(
         "[atlas-ai.leads] match_unis_for_lead RPC failed — lead saved, matches null",
         { lead_id: inserted!.id, err: rpcError },
       );
     } else {
       matchesReady = true;
     }
   } catch (err) {
     console.error(
       "[atlas-ai.leads] match_unis_for_lead RPC threw — lead saved, matches null",
       { lead_id: inserted!.id, err },
     );
   }
   ```

5. Extend `sendNotificationEmails` to also receive `matchToken: inserted!.match_token` + `matchesReady` and include them in the email body:
   ```
   Match token: ${matchToken}
   Results page: https://atlas-ai.vercel.app/matches/${matchToken}
   Matches computed: ${matchesReady ? "yes" : "NO — RPC failed, manual recompute needed"}
   ```
   (Extend the function signature accordingly: add `matchToken: string; matchesReady: boolean` to the interface.)

6. Change the final return at line 93 to include the token + readiness flag:
   ```typescript
   return Response.json({
     ok: true,
     match_token: inserted!.match_token,
     matches_ready: matchesReady,
   });
   ```

Do not add a new endpoint — match logic stays inside `/api/leads`. Do not refactor `buildLeadRow` (unchanged — the DB defaults handle `match_token` and `matches` nullability).
</action>

<acceptance_criteria>
- `grep -n 'import { MATCH_WEIGHTS_JSON } from "@/lib/match-weights"' web/src/app/api/leads/route.ts` returns one hit.
- `grep -n 'supabase.rpc("match_unis_for_lead"' web/src/app/api/leads/route.ts` returns one hit.
- `grep -n 'match_token: inserted' web/src/app/api/leads/route.ts` returns at least one hit (return body).
- `grep -n 'matches_ready: matchesReady' web/src/app/api/leads/route.ts` returns one hit.
- `grep -n 'Match token:' web/src/app/api/leads/route.ts` returns one hit (email body).
- `cd web && npx tsc --noEmit` exits clean.
- `cd web && npm run build` exits clean.
- Manual smoke: `curl -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d '{"full_name":"Persona A","email":"a@x.com","phone":"+61400000001","country":"Nepal","preferred_fields":["Business"],"preferred_levels":["postgraduate"],"preferred_intake_month":2,"tuition_budget_aud":55000,"ielts_overall":7.5,"consent_service":true,"consent_marketing":false,"consent_wording_version":"2026-04-17.v2","source":"manual-curl"}'` returns a body with `{"ok":true,"match_token":"<uuid>","matches_ready":true}`.
</acceptance_criteria>

<done>`/api/leads` atomically INSERTs + calls RPC + returns match_token; RPC failure path preserves lead + returns 200.</done>

---

#### Task 4.2: Delete orphan `/api/match` route only (Gideon round-1 narrowed scope)

<objective>Delete the orphan `/api/match/route.ts` (no callers — verified: `MatcherForm.tsx` never fetches it, it calls `matchStudent` client-side directly). `universities.ts` + `matcher.ts` are KEPT because `MatcherSection` on the home page (`app/page.tsx:13`) still renders them. Retiring that pre-P3 UI is follow-up work outside the $3k HARD-CUT — tracked in CONTEXT §deferred.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"/api/match Endpoint Decision (open item 6)" (lines 538-566)
- `web/src/app/api/match/route.ts` — orphan 44 LoC scaffold (confirmed zero fetch callers)
- `web/src/components/MatcherSection.tsx` — home-page render site, imports `MatcherForm`
- `web/src/components/MatcherForm.tsx` — imports `matchStudent` + `universities` client-side (NOT from /api/match)
- `SOURCECODE.md` — route table that references `/api/match`
</read_first>

<action>
1. Re-verify the orphan status before delete (hard gate):
   ```bash
   grep -rn '"/api/match"\|fetch.*api/match\|api/match"' web/src --include='*.ts' --include='*.tsx'
   grep -rn 'from "@/app/api/match' web/src --include='*.ts' --include='*.tsx'
   ```
   Expected: zero hits (the only references to `/api/match` are inside the route file itself + SOURCECODE.md).
   **STOP and surface to Sam if any hit appears.**

2. Delete the single orphan file:
   ```bash
   rm web/src/app/api/match/route.ts
   ```

3. If the `web/src/app/api/match/` directory is now empty, remove it:
   ```bash
   rmdir web/src/app/api/match
   ```

4. Update `SOURCECODE.md` route table: find the row for `POST /api/match` and remove it. Update any route count totals in adjacent text (e.g. "N routes" → "N-1 routes").

5. **Do NOT delete** `web/src/lib/universities.ts` or `web/src/lib/matcher.ts`. They back the live home-page `MatcherSection`. Retirement is scheduled as a follow-up phase (tracked in CONTEXT §deferred and listed as a new P4.5 note — "retire pre-P3 MatcherSection + its 43-uni in-memory dataset in favour of LeadModal CTA").

6. After removal, re-run `grep -rn 'api/match' web/src SOURCECODE.md` — expected: zero hits.
</action>

<acceptance_criteria>
- `test ! -f web/src/app/api/match/route.ts` (file does not exist).
- `test ! -d web/src/app/api/match` (directory does not exist).
- `test -f web/src/lib/universities.ts` — FILE STILL EXISTS (retained for MatcherSection).
- `test -f web/src/lib/matcher.ts` — FILE STILL EXISTS (retained for MatcherSection).
- `grep -rn '"/api/match"\|fetch.*api/match' web/src --include='*.ts' --include='*.tsx'` returns zero hits.
- `grep -n "POST /api/match" SOURCECODE.md` returns zero hits (row removed from route table).
- Home page `MatcherSection` still renders live (manual UAT: `npm run dev` → `http://localhost:3000#match`).
- `cd web && npx tsc --noEmit` exits clean.
- `cd web && npm run build` exits clean (no orphaned route).
</acceptance_criteria>

<done>Orphan `/api/match/route.ts` removed; `universities.ts` + `matcher.ts` preserved (still back the live home-page `MatcherSection`, retirement deferred to a follow-up phase per Gideon round-1 narrowing). SOURCECODE.md route table reflects the single-route prune.</done>

---

### Wave 5 — Results page + match components

12 files, ~520 LoC total, all new. Design tokens inherited from globals.css (cream/navy/gold) — no new CSS. Server Component at the root; everything nested is plain React (some client components for the magic-link fallback form and the PendingMatches refresh button).

#### Task 5.1: Build `MaraBanner` + `MatchesHero` + `NotFoundFallback` (trivial leaf components)

<objective>Three small leaf components used by the Server Component page. Ship them first so the page-level Server Component can import cleanly.</objective>

<read_first>
- `web/src/lib/mara-disclaimer.ts` (Wave 1 Task 1.2)
- `.planning/research/4-RESEARCH.md` §"Results Page Design Sketch" — wireframe ASCII (lines 842-911)
- `.planning/research/4-RESEARCH.md` §"Design tokens reused from scaffold" (lines 937-946)
- `web/src/components/LeadModal.tsx` — existing Gideon-style design patterns (navy/cream/gold, Georgia serif eyebrow, paper-grain, rail-gold borders)
- `web/src/app/globals.css` — confirms `rail-gold`, `paper-grain`, `eyebrow`, `font-display` class availability
</read_first>

<action>
Create three files, all Server Components (no "use client").

**File 1: `web/src/components/matches/MaraBanner.tsx`**

```tsx
import {
  MARA_DISCLAIMER_BODY,
  MARA_DISCLAIMER_EYEBROW,
  MARA_CONSULT_CTA_LABEL,
  MARA_CONSULT_CTA_HREF,
} from "@/lib/mara-disclaimer";

interface MaraBannerProps {
  variant?: "top" | "footer";
}

export function MaraBanner({ variant = "top" }: MaraBannerProps) {
  const padded = variant === "top" ? "mt-6 mb-8" : "mt-12 mb-6";
  return (
    <aside
      role="note"
      aria-label="MARA disclaimer"
      className={`rail-gold paper-grain bg-cream/90 border-y border-gold-500/30 px-5 py-4 ${padded}`}
    >
      <p className="eyebrow mb-1 text-navy-950/60">{MARA_DISCLAIMER_EYEBROW}</p>
      <p className="text-navy-950 leading-relaxed">
        {MARA_DISCLAIMER_BODY}{" "}
        <a
          href={MARA_CONSULT_CTA_HREF}
          className="font-semibold text-gold-700 underline underline-offset-4 hover:text-gold-800"
        >
          {MARA_CONSULT_CTA_LABEL} →
        </a>
      </p>
    </aside>
  );
}
```

**File 2: `web/src/components/matches/MatchesHero.tsx`**

```tsx
interface MatchesHeroProps {
  firstName: string;
}

export function MatchesHero({ firstName }: MatchesHeroProps) {
  return (
    <header className="mt-10 mb-8">
      <p className="eyebrow text-navy-950/60">YOUR SHORTLIST · ATLAS AI</p>
      <h1 className="font-display text-4xl md:text-5xl text-navy-950 mt-2">
        Your top matches
      </h1>
      <p className="text-navy-950/70 mt-3 max-w-xl">
        {firstName}, here are the Australian universities that best match your profile.
      </p>
    </header>
  );
}
```

**File 3: `web/src/components/matches/NotFoundFallback.tsx`**

```tsx
export function NotFoundFallback() {
  return (
    <main className="container mx-auto max-w-2xl py-24">
      <p className="eyebrow text-navy-950/60">NOT FOUND</p>
      <h1 className="font-display text-3xl text-navy-950 mt-2">
        We can&rsquo;t find that shortlist
      </h1>
      <p className="text-navy-950/70 mt-4">
        The match link may have expired or the token is invalid. If you just submitted
        an enquiry, please check your email for a fresh link.
      </p>
    </main>
  );
}
```

Do NOT render the literal strings "visa", "migration", "PR", "MLTSSL", "subclass" outside the MaraBanner body (which names them in the negative from `mara-disclaimer.ts` — allowed).
</action>

<acceptance_criteria>
- `test -f web/src/components/matches/MaraBanner.tsx` (exit 0).
- `test -f web/src/components/matches/MatchesHero.tsx` (exit 0).
- `test -f web/src/components/matches/NotFoundFallback.tsx` (exit 0).
- `grep -rE "(visa|migration|\\bPR\\b|MLTSSL|subclass)" web/src/components/matches/MatchesHero.tsx web/src/components/matches/NotFoundFallback.tsx` returns zero hits.
- `grep -n 'MARA_DISCLAIMER_BODY' web/src/components/matches/MaraBanner.tsx` returns one hit.
- `cd web && npx tsc --noEmit` exits clean.
- None of the three files contain `"use client"` — all are Server Components.
</acceptance_criteria>

<done>Three leaf components shipped; MARA banner strictly imports canonical text; hero + 404 fallback use design tokens.</done>

---

#### Task 5.2: Build `MatchCard` + `MatchList` + `StretchCard` + `StretchSection` + `ConsultCTA`

<objective>The five components that render the actual match data. `MatchCard` is the reusable 80-LoC card; `StretchCard` is a dimmer variant; `MatchList`/`StretchSection` are simple wrappers; `ConsultCTA` is the "book your consultation" block at the bottom.</objective>

<read_first>
- `web/src/lib/match-schema.ts` (Wave 1 Task 1.3) — `MatchResult` type
- `web/src/lib/match-reason.ts` (Wave 1 Task 1.4) — `renderReason` function
- `.planning/research/4-RESEARCH.md` §"Results Page Design Sketch" — wireframe (lines 842-911)
- `.planning/research/4-RESEARCH.md` §"Component tree" (lines 914-935)
- `web/src/components/LeadModal.tsx` — existing card pattern (for score ring styling reference)
</read_first>

<action>
Create all five files as Server Components (no "use client").

**File 1: `web/src/components/matches/MatchCard.tsx`**

```tsx
import type { MatchResult } from "@/lib/match-schema";
import { renderReason } from "@/lib/match-reason";

interface MatchCardProps {
  match: MatchResult;
  rank: number; // 1..3 for strong, 4..5 for stretch — affects only header badge
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const reason = renderReason(match.reason_parts);
  const eyebrowBits: string[] = [];
  if (match.reason_parts.qs_rank != null && match.reason_parts.qs_rank <= 200) {
    eyebrowBits.push(`#${match.reason_parts.qs_rank} QS`);
  }
  if (match.reason_parts.g8) eyebrowBits.push("Group of Eight");
  if (match.reason_parts.regional) eyebrowBits.push("Regional");

  return (
    <article className="paper-grain bg-cream border border-navy-950/10 rounded-lg p-6 mb-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-md bg-navy-950 text-cream font-display text-xl flex-shrink-0"
            aria-hidden="true"
          >
            {match.short_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl text-navy-950 truncate">{match.uni_name}</h2>
            <p className="text-sm text-navy-950/60 mt-1">
              {eyebrowBits.join(" · ") || "Profile"}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-display text-3xl text-gold-700">{match.match_pct}%</p>
          <p className="eyebrow text-navy-950/50 text-[10px]">
            {rank <= 3 ? "match" : "stretch"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-navy-950/10">
        <p className="eyebrow text-navy-950/50 mb-1">Best course</p>
        <p className="font-display text-lg text-navy-950">{match.reason_parts.best_course_name}</p>
        <p className="text-navy-950/70 mt-2 text-sm leading-relaxed">{reason.line}</p>
      </div>
    </article>
  );
}
```

**File 2: `web/src/components/matches/MatchList.tsx`**

```tsx
import type { MatchResult } from "@/lib/match-schema";
import { MatchCard } from "./MatchCard";

interface MatchListProps {
  matches: MatchResult[];
}

export function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <p className="text-navy-950/70 my-8">
        We couldn&rsquo;t find strong matches in the current shortlist. Have a look at
        the stretch options below or book a consultation — our counsellors can broaden
        the search.
      </p>
    );
  }
  return (
    <section aria-label="Strong matches" className="mt-4">
      {matches.map((m, i) => (
        <MatchCard key={m.uni_id} match={m} rank={i + 1} />
      ))}
    </section>
  );
}
```

**File 3: `web/src/components/matches/StretchCard.tsx`**

```tsx
import type { MatchResult } from "@/lib/match-schema";
import { renderReason } from "@/lib/match-reason";

interface StretchCardProps {
  match: MatchResult;
  rank: number;
}

export function StretchCard({ match, rank }: StretchCardProps) {
  const reason = renderReason(match.reason_parts);
  return (
    <article className="bg-cream/50 border border-dashed border-navy-950/20 rounded-lg p-5 mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-950/80 text-cream font-display text-lg flex-shrink-0"
            aria-hidden="true"
          >
            {match.short_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg text-navy-950 truncate">{match.uni_name}</h3>
            <p className="text-sm text-navy-950/60">
              {match.reason_parts.qs_rank != null ? `#${match.reason_parts.qs_rank} QS` : "Profile"}
              {match.reason_parts.g8 ? " · Group of Eight" : ""}
            </p>
          </div>
        </div>
        <p className="font-display text-xl text-gold-700/80 flex-shrink-0">{match.match_pct}%</p>
      </div>
      {match.stretch_reason && (
        <p className="mt-3 pt-3 border-t border-navy-950/10 text-sm text-navy-950/70">
          <span className="eyebrow text-navy-950/50 mr-2">Stretch:</span>
          {match.stretch_reason}
        </p>
      )}
      <p className="text-navy-950/60 mt-2 text-xs leading-relaxed">{reason.line}</p>
    </article>
  );
}
```

**File 4: `web/src/components/matches/StretchSection.tsx`**

```tsx
import type { MatchResult } from "@/lib/match-schema";
import { StretchCard } from "./StretchCard";

interface StretchSectionProps {
  matches: MatchResult[];
}

export function StretchSection({ matches }: StretchSectionProps) {
  if (!matches || matches.length === 0) return null;

  return (
    <section aria-label="Stretch options" className="mt-10">
      <div className="border-t border-gold-500/30 pt-6">
        <p className="eyebrow text-navy-950/60">ALSO CONSIDER</p>
        <h2 className="font-display text-2xl text-navy-950 mt-1 mb-6">
          Within reach if your budget or IELTS shifts
        </h2>
      </div>
      {matches.map((m, i) => (
        <StretchCard key={m.uni_id} match={m} rank={i + 4} />
      ))}
    </section>
  );
}
```

**File 5: `web/src/components/matches/ConsultCTA.tsx`**

```tsx
import { MARA_CONSULT_CTA_HREF } from "@/lib/mara-disclaimer";

export function ConsultCTA() {
  return (
    <section className="paper-grain bg-cream border border-gold-500/30 rounded-lg p-6 mt-12">
      <p className="eyebrow text-navy-950/60">NEXT STEP</p>
      <h2 className="font-display text-2xl text-navy-950 mt-1">
        Bring your shortlist to our Liverpool office
      </h2>
      <p className="text-navy-950/70 mt-3">
        Our MARA-registered counsellors will audit fees, scholarships, IELTS gaps, and
        next steps in a free 30-minute session.
      </p>
      <a
        href={MARA_CONSULT_CTA_HREF}
        className="inline-flex items-center gap-2 rounded-md bg-gold-700 text-cream font-semibold px-5 py-3 mt-5 hover:bg-gold-800 transition"
      >
        Book your consultation →
      </a>
    </section>
  );
}
```
</action>

<acceptance_criteria>
- All five files exist: `MatchCard.tsx`, `MatchList.tsx`, `StretchCard.tsx`, `StretchSection.tsx`, `ConsultCTA.tsx` in `web/src/components/matches/`.
- `grep -rE "(visa|migration|\\bPR\\b|MLTSSL|subclass|points test|post-study work)" web/src/components/matches/MatchCard.tsx web/src/components/matches/MatchList.tsx web/src/components/matches/StretchCard.tsx web/src/components/matches/StretchSection.tsx web/src/components/matches/ConsultCTA.tsx` returns zero hits.
- `grep -n '"use client"' web/src/components/matches/MatchCard.tsx web/src/components/matches/MatchList.tsx web/src/components/matches/StretchCard.tsx web/src/components/matches/StretchSection.tsx web/src/components/matches/ConsultCTA.tsx` returns zero hits (all Server Components).
- `grep -n 'import { renderReason }' web/src/components/matches/MatchCard.tsx` returns one hit.
- `grep -n 'import { renderReason }' web/src/components/matches/StretchCard.tsx` returns one hit.
- `cd web && npx tsc --noEmit` exits clean.
</acceptance_criteria>

<done>Five match-display components shipped; use Zod-validated `MatchResult` type + render via `match-reason.ts` template; MARA-safe word list only.</done>

---

#### Task 5.3: Build `PendingMatches` + `ExpiredTokenFallback` (client components with user interactions)

<objective>The two branches of the Server Component page that need client-side JS: `PendingMatches` has a manual refresh button that reloads the page; `ExpiredTokenFallback` renders the magic-link request form that calls `supabase.auth.signInWithOtp`.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"Error-surface UX on /matches/{token}" (lines 360-376)
- `.planning/research/4-RESEARCH.md` §"Auth flow diagram" (lines 479-525)
- `web/src/app/login/page.tsx` — existing magic-link request form pattern (P2 infrastructure)
- `web/src/lib/supabase/client.ts` — browser client factory
</read_first>

<action>
Create two files, both client components.

**File 1: `web/src/components/matches/PendingMatches.tsx`**

```tsx
"use client";

interface PendingMatchesProps {
  leadId: string;
  email: string;
}

export function PendingMatches({ leadId, email }: PendingMatchesProps) {
  return (
    <main className="container mx-auto max-w-2xl py-16">
      <p className="eyebrow text-navy-950/60">STILL COMPUTING</p>
      <h1 className="font-display text-3xl text-navy-950 mt-2">
        We&rsquo;re still finding your matches
      </h1>
      <p className="text-navy-950/70 mt-4 leading-relaxed">
        Your enquiry is saved and our counsellors at {email.replace(/(.{2}).*(@.*)/, "$1••••$2")} have
        been notified. The uni ranking is still being crunched — check back in 30 seconds.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-navy-950 text-cream font-semibold px-5 py-3 hover:bg-navy-900"
      >
        Refresh
      </button>
      <p className="eyebrow text-navy-950/40 text-[10px] mt-6">Ref: {leadId.slice(0, 8)}</p>
    </main>
  );
}
```

**File 2: `web/src/components/matches/ExpiredTokenFallback.tsx`**

```tsx
"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface ExpiredTokenFallbackProps {
  email: string;
  token: string;
}

export function ExpiredTokenFallback({ email, token }: ExpiredTokenFallbackProps) {
  const [requested, setRequested] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestLink() {
    setBusy(true);
    setErr(null);
    try {
      const supabase = createBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/matches/${token}`
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
      setRequested(true);
      setBusy(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
      setBusy(false);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl py-16">
      <p className="eyebrow text-navy-950/60">LINK EXPIRED</p>
      <h1 className="font-display text-3xl text-navy-950 mt-2">
        Your preview has expired
      </h1>
      <p className="text-navy-950/70 mt-4 leading-relaxed">
        Your matches are saved to your account. Enter your email and we&rsquo;ll send you
        a fresh link to view them.
      </p>
      {requested ? (
        <div className="mt-6 rounded-md bg-cream p-4 border border-gold-500/30">
          <p className="font-semibold text-navy-950">Check your email.</p>
          <p className="text-navy-950/70 text-sm mt-1">
            We sent a magic link to <strong>{email.replace(/(.{2}).*(@.*)/, "$1••••$2")}</strong>.
            Click it to return to your matches.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={requestLink}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-navy-950 text-cream font-semibold px-5 py-3 hover:bg-navy-900 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Email me a fresh link"}
        </button>
      )}
      {err && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {err}
        </p>
      )}
    </main>
  );
}
```

If `web/src/lib/supabase/client.ts` exports a function named differently than `createBrowserClient`, match the existing export name (read the file to confirm). If the file exports `createClient` rename the import accordingly.
</action>

<acceptance_criteria>
- `test -f web/src/components/matches/PendingMatches.tsx` exit 0.
- `test -f web/src/components/matches/ExpiredTokenFallback.tsx` exit 0.
- `head -1 web/src/components/matches/PendingMatches.tsx` returns `"use client";`.
- `head -1 web/src/components/matches/ExpiredTokenFallback.tsx` returns `"use client";`.
- `grep -n "signInWithOtp" web/src/components/matches/ExpiredTokenFallback.tsx` returns one hit.
- `grep -n "emailRedirectTo" web/src/components/matches/ExpiredTokenFallback.tsx` returns one hit.
- `grep -rE "(visa|migration|\\bPR\\b|MLTSSL|subclass)" web/src/components/matches/PendingMatches.tsx web/src/components/matches/ExpiredTokenFallback.tsx` returns zero hits.
- `cd web && npx tsc --noEmit` exits clean.
</acceptance_criteria>

<done>Pending + expired fallbacks shipped with client-side magic-link re-auth wired to existing P2 auth infra.</done>

---

#### Task 5.4: Build `web/src/app/matches/[token]/page.tsx` Server Component

<objective>The page itself. Fetches the lead by token via service-role client, validates the JSONB against `MatchesJsonbSchema`, branches on (null / fresh / expired), renders the appropriate subtree.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"Option C: Server-component check (SELECTED)" (lines 423-476) — full page.tsx body
- `web/src/lib/supabase/service-role.ts` — createServiceRoleClient factory
- `web/src/lib/match-schema.ts` (Wave 1 Task 1.3) — `MatchesJsonbSchema`
- `web/src/lib/match-weights.ts` (Wave 1 Task 1.1) — `TOKEN_TTL_MINUTES`
- All Wave 5 components just created
</read_first>

<action>
Create `web/src/app/matches/[token]/page.tsx`:

```tsx
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { MatchesJsonbSchema } from "@/lib/match-schema";
import { TOKEN_TTL_MINUTES } from "@/lib/match-weights";
import { MaraBanner } from "@/components/matches/MaraBanner";
import { MatchesHero } from "@/components/matches/MatchesHero";
import { MatchList } from "@/components/matches/MatchList";
import { StretchSection } from "@/components/matches/StretchSection";
import { ConsultCTA } from "@/components/matches/ConsultCTA";
import { PendingMatches } from "@/components/matches/PendingMatches";
import { ExpiredTokenFallback } from "@/components/matches/ExpiredTokenFallback";
import { NotFoundFallback } from "@/components/matches/NotFoundFallback";

// Never cache — matches data is per-token per-request and the TTL logic
// depends on fresh `now()` comparison.
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // service-role client requires Node, not Edge

interface PageProps {
  params: Promise<{ token: string }>; // Next 15+ async params
}

export default async function MatchesPage({ params }: PageProps) {
  const { token } = await params;

  const supabase = createServiceRoleClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, full_name, email, matches, matches_computed_at, match_token")
    .eq("match_token", token)
    .maybeSingle();

  if (error) {
    console.error("[atlas-ai.matches] lookup failed", { token, error });
    return <NotFoundFallback />;
  }
  if (!lead) {
    return <NotFoundFallback />;
  }

  const firstName = (lead.full_name ?? "").trim().split(/\s+/)[0] || "there";

  // Case 1: RPC hasn't run yet or failed — show pending state
  if (!lead.matches || !lead.matches_computed_at) {
    return <PendingMatches leadId={lead.id} email={lead.email} />;
  }

  // Validate jsonb shape (Landmine #10 — Zod parse on read)
  const parsed = MatchesJsonbSchema.safeParse(lead.matches);
  if (!parsed.success) {
    console.error("[atlas-ai.matches] jsonb schema drift", {
      token,
      issues: parsed.error.issues,
    });
    return <PendingMatches leadId={lead.id} email={lead.email} />;
  }
  const matches = parsed.data;

  // Case 2: Fresh — serve results directly (anonymous path)
  const computedAtMs = new Date(lead.matches_computed_at).getTime();
  const ageMs = Date.now() - computedAtMs;
  const ttlMs = TOKEN_TTL_MINUTES * 60 * 1000;

  if (ageMs <= ttlMs) {
    return (
      <main className="container mx-auto max-w-3xl px-4 pb-16">
        <MaraBanner variant="top" />
        <MatchesHero firstName={firstName} />
        <MatchList matches={matches.strong} />
        <StretchSection matches={matches.stretch} />
        <ConsultCTA />
        <MaraBanner variant="footer" />
      </main>
    );
  }

  // Case 3: Expired — require auth (P2 magic-link flow)
  return <ExpiredTokenFallback email={lead.email} token={token} />;
}
```

Do not add `generateMetadata`. Do not add OpenGraph tags. Keep it minimal — Sam can add SEO later.

Note on `params`: Next.js 15+ in the async-params era requires `params: Promise<...>` and `await params`. Confirm by grepping an existing dynamic route in the repo — use that pattern. If the repo uses sync params, downgrade the type accordingly.
</action>

<acceptance_criteria>
- `test -f web/src/app/matches/[token]/page.tsx` exit 0.
- `grep -n 'export const dynamic = "force-dynamic"' web/src/app/matches/[token]/page.tsx` returns one hit.
- `grep -n 'export const runtime = "nodejs"' web/src/app/matches/[token]/page.tsx` returns one hit.
- `grep -n 'MatchesJsonbSchema.safeParse' web/src/app/matches/[token]/page.tsx` returns one hit.
- `grep -n 'TOKEN_TTL_MINUTES \* 60 \* 1000' web/src/app/matches/[token]/page.tsx` returns one hit.
- `grep -rE "(visa|migration|\\bPR\\b|MLTSSL|subclass)" web/src/app/matches/[token]/page.tsx` returns zero hits.
- `cd web && npx tsc --noEmit` exits clean.
- `cd web && npm run build` exits clean (route `/matches/[token]` appears in build output).
- Manual smoke: start dev server, POST a lead via `/api/leads`, visit `/matches/<returned_token>` — page renders with 3 strong + 0-2 stretch matches.
</acceptance_criteria>

<done>Server Component page fully wired: 404 → pending → fresh (full results) → expired (magic-link) branches all covered; Zod schema enforced on read.</done>

---

### Wave 6 — Verification + governance

Final sweeps before calling phase-verify. Grep gates + persona SQL smoke tests + PHASE/STATE sign-off.

#### Task 6.1: MARA grep gate — zero forbidden strings in match surface

<objective>Enforce the P0.5 + P4.5 MARA compliance rule across the new match surface. The only permitted use of banned strings is within the explicit `mara-disclaimer.ts` canonical constant (which names them in the negative).</objective>

<read_first>
- `web/src/lib/mara-disclaimer.ts` (Wave 1 Task 1.2) — canonical allowlisted text
- PHASE.md §Phase 0.5 — precedent for grep gate enforcement
- `web/src/lib/content.ts` — existing allowlisted MARA phrasing
</read_first>

<action>
Run these grep commands and surface the output. All four MUST return 0 hits. If any returns non-zero, STOP and surface the hit to Sam via Telegram before continuing.

```bash
# 1. No banned strings in new match components/pages/libs (excluding the banner constant file itself)
grep -rE "(visa|migration|\\bPR\\b|MLTSSL|subclass|points test|post-study work)" \
  web/src/app/matches/ \
  web/src/components/matches/ \
  web/src/lib/match-weights.ts \
  web/src/lib/match-reason.ts \
  web/src/lib/match-schema.ts \
  | grep -v "mara-disclaimer"

# 2. No banned strings in either migration file
grep -nE "(visa|migration|\\bPR\\b|MLTSSL|subclass)" supabase/migrations/003_match_prep.sql supabase/migrations/004_match_function.sql

# 3. The canonical MARA banner string is referenced, not duplicated, in MaraBanner.tsx
grep -c "Atlas AI matches are educational information" web/src/components/matches/MaraBanner.tsx
# Expected: 0 (the string lives in mara-disclaimer.ts, imported by MaraBanner.tsx)

grep -c "MARA_DISCLAIMER_BODY" web/src/components/matches/MaraBanner.tsx
# Expected: at least 1

# 4. The canonical string exists exactly once in the codebase
grep -rF "Atlas AI matches are educational information only, not migration advice." web/src/
# Expected: exactly one hit — web/src/lib/mara-disclaimer.ts
```

If any check fails, halt and request Sam's guidance before iterating.
</action>

<acceptance_criteria>
- Grep #1 returns zero hits.
- Grep #2 returns zero hits.
- Grep #3 (`grep -c "Atlas AI matches" web/src/components/matches/MaraBanner.tsx`) returns `0`.
- Grep #3 (`grep -c "MARA_DISCLAIMER_BODY" web/src/components/matches/MaraBanner.tsx`) returns ≥ `1`.
- Grep #4 returns exactly one file path: `web/src/lib/mara-disclaimer.ts`.
</acceptance_criteria>

<done>MARA grep gate clean; canonical disclaimer string lives in exactly one constant; no forbidden vocabulary in match surface.</done>

---

#### Task 6.2: Persona SQL smoke — 4 personas × RPC

<objective>Run the 4 research personas against the live Supabase DB via Studio SQL editor. Compare top-3 + stretch output against RESEARCH.md §"Persona simulation". Document pass/fail per persona in the commit message.</objective>

<read_first>
- `.planning/research/4-RESEARCH.md` §"Persona simulation against 12-uni seed" (lines 65-164) — expected top-3 per persona
- `web/src/lib/match-weights.ts` — weight vector to pass as p_weights
</read_first>

<action>
Run the following SQL block in Supabase Studio SQL editor (production project ap-southeast-1). Clean up test rows at the end. Record actual top-3 per persona in the Wave 6 commit message for diff against expected.

```sql
-- Weight vector from web/src/lib/match-weights.ts MATCH_WEIGHTS
WITH w AS (
  SELECT '{"field":30,"level":12,"budget":23,"ielts":12,"qs_rank":15,"g8":5,"industry_placement":0,"regional":0,"intake":3}'::jsonb AS p_weights
)

-- Persona A: G8 Business $55k IELTS 7.5 Masters (expected: UNSW → UWA → Adelaide)
, persona_a AS (
  INSERT INTO public.leads (
    full_name, email, phone, country,
    preferred_fields, preferred_levels, preferred_intake_month,
    tuition_budget_aud, ielts_overall,
    consent_service, consent_marketing, consent_wording_version, consent_given_at
  ) VALUES (
    'Persona A', 'persona-a-test@example.com', '+61400000001', 'Nepal',
    ARRAY['Business']::text[], ARRAY['postgraduate']::text[], 2,
    55000, 7.5,
    true, false, '2026-04-17.v2', now()
  ) RETURNING id
)
SELECT 'A' AS persona, public.match_unis_for_lead((SELECT id FROM persona_a), (SELECT p_weights FROM w));

-- Persona B: Budget IT $28k IELTS 6.0 Bachelor (expected: WSU strong, UOW/RMIT stretch)
WITH w AS (SELECT '{"field":30,"level":12,"budget":23,"ielts":12,"qs_rank":15,"g8":5,"industry_placement":0,"regional":0,"intake":3}'::jsonb AS p),
persona_b AS (
  INSERT INTO public.leads (
    full_name, email, phone, country,
    preferred_fields, preferred_levels, preferred_intake_month,
    tuition_budget_aud, ielts_overall,
    consent_service, consent_marketing, consent_wording_version, consent_given_at
  ) VALUES (
    'Persona B', 'persona-b-test@example.com', '+61400000002', 'India',
    ARRAY['IT']::text[], ARRAY['undergraduate']::text[], 2,
    28000, 6.0,
    true, false, '2026-04-17.v2', now()
  ) RETURNING id
)
SELECT 'B' AS persona, public.match_unis_for_lead((SELECT id FROM persona_b), (SELECT p FROM w));

-- Persona C: July intake Engineering $35k IELTS 6.5 Bachelor (expected: UWA → UOW → UTS)
WITH w AS (SELECT '{"field":30,"level":12,"budget":23,"ielts":12,"qs_rank":15,"g8":5,"industry_placement":0,"regional":0,"intake":3}'::jsonb AS p),
persona_c AS (
  INSERT INTO public.leads (
    full_name, email, phone, country,
    preferred_fields, preferred_levels, preferred_intake_month,
    tuition_budget_aud, ielts_overall,
    consent_service, consent_marketing, consent_wording_version, consent_given_at
  ) VALUES (
    'Persona C', 'persona-c-test@example.com', '+61400000003', 'Vietnam',
    ARRAY['Engineering']::text[], ARRAY['undergraduate']::text[], 7,
    35000, 6.5,
    true, false, '2026-04-17.v2', now()
  ) RETURNING id
)
SELECT 'C' AS persona, public.match_unis_for_lead((SELECT id FROM persona_c), (SELECT p FROM w));

-- Persona D: Regional Health Nurse $32k IELTS 6.5 Bachelor (expected: Adelaide → UOW → WSU)
WITH w AS (SELECT '{"field":30,"level":12,"budget":23,"ielts":12,"qs_rank":15,"g8":5,"industry_placement":0,"regional":0,"intake":3}'::jsonb AS p),
persona_d AS (
  INSERT INTO public.leads (
    full_name, email, phone, country,
    preferred_fields, preferred_levels, preferred_intake_month,
    tuition_budget_aud, ielts_overall,
    consent_service, consent_marketing, consent_wording_version, consent_given_at
  ) VALUES (
    'Persona D', 'persona-d-test@example.com', '+61400000004', 'Philippines',
    ARRAY['Health']::text[], ARRAY['undergraduate']::text[], 2,
    32000, 6.5,
    true, false, '2026-04-17.v2', now()
  ) RETURNING id
)
SELECT 'D' AS persona, public.match_unis_for_lead((SELECT id FROM persona_d), (SELECT p FROM w));

-- PERF smoke: EXPLAIN ANALYZE should show total runtime <500ms
EXPLAIN (ANALYZE, BUFFERS)
SELECT public.match_unis_for_lead(
  (SELECT id FROM public.leads WHERE email='persona-a-test@example.com' ORDER BY created_at DESC LIMIT 1),
  '{"field":30,"level":12,"budget":23,"ielts":12,"qs_rank":15,"g8":5,"industry_placement":0,"regional":0,"intake":3}'::jsonb
);

-- Cleanup
DELETE FROM public.leads WHERE email IN (
  'persona-a-test@example.com',
  'persona-b-test@example.com',
  'persona-c-test@example.com',
  'persona-d-test@example.com'
);
```

Parse each persona's `strong` array and confirm it matches the exact expected ordering below. Gideon plan-check round 1 Blocker #4 required tolerance-based checks be replaced with locked top-3 arrays against the revised weight vector (field 30 / budget 23 / ielts 12 / level 12 / qs 15 / g8 5 / placement 0 / regional 0 / intake 3).

Expected strong arrays (locked against the 12-uni seed):
- **Persona A (G8 Business $55k IELTS 7.5):** `['UNSW', 'UWA', 'Adelaide']`
- **Persona B (IT $28k IELTS 6.0):** `['WSU', 'UTS', 'RMIT']`
- **Persona C (Masters Engineering $42k IELTS 6.5):** `['UWA', 'UTS', 'RMIT']`
- **Persona D (Regional Nurse Health $32k IELTS 6.5):** `['Adelaide', 'UOW', 'WSU']`

If any persona fails exact match on the full top-3 array, STOP, root-cause via the course_totals CTE (add a temporary `SELECT * FROM course_totals` diagnostic), and surface diff to Sam before proceeding. Do NOT silently re-tune weights to make the test pass — re-open RESEARCH.md §Persona Simulation instead and document the drift.

Record the EXPLAIN ANALYZE total runtime in the commit message; target <500ms.
</action>

<acceptance_criteria>
- Persona A `strong[0..2].short_name = ['UNSW', 'UWA', 'Adelaide']` (exact, in order).
- Persona B `strong[0..2].short_name = ['WSU', 'UTS', 'RMIT']` (exact, in order).
- Persona C `strong[0..2].short_name = ['UWA', 'UTS', 'RMIT']` (exact, in order).
- Persona D `strong[0..2].short_name = ['Adelaide', 'UOW', 'WSU']` (exact, in order).
- EXPLAIN ANALYZE reports total query time under 500ms.
- No test rows remain after cleanup (`SELECT count(*) FROM public.leads WHERE email LIKE 'persona-%-test@example.com'` returns 0).
- Persona outcomes captured in commit body for audit.
</acceptance_criteria>

<done>RPC validated against 4 research personas with exact ordered top-3 arrays (no tolerance per round-1 Blocker #4); perf under 500ms budget; test rows cleaned up.</done>

---

#### Task 6.3: Update PHASE.md + STATE.md + commit chain

<objective>Tick the P4 task checkboxes in PHASE.md, add sign-off rows once Gideon passes, move STATE.md from `in_progress` → `done`, write atomic commits for each wave.</objective>

<read_first>
- PHASE.md §Phase 4 — current task list
- .planning/STATE.md — current phase status table
- .planning/3-PLAN.md §Wave H — commit chain template to mirror
</read_first>

<action>
1. Edit `PHASE.md` §Phase 4:
   - Tick each of the 4 existing task checkboxes as Wave 4+5 lands them:
     - `[x] Port existing JS matcher to /api/match reading from Supabase` → reframe as "Supabase RPC replaces /api/match — see 4-PLAN Delta / Decision"
     - `[x] Returns ranked list with match % + reason text`
     - `[x] Caches per-user match result for 24h` → reframe as "matches persisted to leads.matches JSONB; served for 30min anonymous then magic-link"
     - `[x] Commit feat(phase-4): ...`
   - Add sign-off rows (once Gideon plan-check + phase-verify complete — Wave 6 closeout):
     ```
     **Plan check sign-off:** Gideon APPROVE/APPROVE-WITH-NOTES (single-seat, {date}) — transcript `.planning/research/p4-plan-check/gideon-v1.md`
     **Phase verify sign-off:** Gideon PASS (single-seat, {date}) — transcript `.planning/research/p4-phase-verify/gideon-v1.md`
     ```
   - Update `**Status:**` from `not_started` → `in_progress` at Wave 1 start, `ready_for_verify` after Wave 5, `done` after Gideon PASS.
   - Add `**Commits:**` line listing each SHA from the commit chain.

2. Edit `.planning/STATE.md`:
   - Bump `Last updated:` to current Sydney time.
   - Move P4 row in phase-status-snapshot from "context captured" → "in_progress" → "ready_for_verify" → "✅ done" as waves land.
   - Update `Current phase:` + `Last completed phase:` + `Next phase:` accordingly.

3. Commit chain (atomic per wave):

   ```
   Commit 1 (after Wave 1):  feat(phase-4): match weights + Zod schema + reason template + MARA disclaimer constants
   Commit 2 (after Wave 2):  feat(phase-4): migration 003 match_prep + migration 004 match_unis_for_lead RPC
   Commit 3 (after Wave 3):  feat(phase-4): apply 003+004 to live Supabase + seed upsert (persona A smoke PASS)
   Commit 4 (after Wave 4):  feat(phase-4): /api/leads invokes match RPC + returns match_token; delete orphan /api/match route (universities.ts + matcher.ts retained for home-page MatcherSection)
   Commit 5 (after Wave 5):  feat(phase-4): /matches/[token] Server Component + match components + magic-link fallback
   Commit 6 (after Wave 6):  feat(phase-4): MARA grep gate clean + 4-persona SQL smoke PASS + PHASE/STATE sign-off + Gideon PASS
   ```

   Each commit message ends with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` per project convention.

4. Per HITL-for-deletes rule (MEMORY.md): Wave 4 deletion of `/api/match/route.ts` requires explicit Sam confirmation before `rm`. Ask via Telegram before running Wave 4 Task 4.2. (Delete scope narrowed post-Gideon round 1 — `universities.ts` and `matcher.ts` are no longer deleted, so there's one file to confirm, not three.)
</action>

<acceptance_criteria>
- `grep -n "Status:.*done" PHASE.md` under "### Phase 4: UniMatch engine" returns one hit (after Gideon PASS).
- `grep -n "Plan check sign-off: Gideon" PHASE.md` under Phase 4 section returns one hit.
- `grep -n "Phase verify sign-off: Gideon PASS" PHASE.md` under Phase 4 section returns one hit.
- `grep -n "\[x\]" PHASE.md` under Phase 4 section returns at least 4 hits (all 4 original tasks ticked).
- `.planning/STATE.md` shows P4 row as `✅ done` with timestamp.
- `git log --oneline --grep="feat(phase-4)"` shows 6 commits in chronological order matching the template.
- Each commit includes the `Co-Authored-By: Claude Opus 4.7` footer.
- Sam confirmed the single file deletion (`/api/match/route.ts`) via Telegram before Wave 4 Task 4.2 ran (HITL rule — delete scope narrowed post-Gideon round 1).
</acceptance_criteria>

<done>PHASE.md + STATE.md + commit chain reflect P4 closure; Gideon sign-off recorded; HITL-for-deletes rule honored.</done>

---

## Verification (phase-level)

`/gsd-verify-work` runs Gideon single-seat on `gpt-5.4 --full-auto` against a prompt that reads:
- `.planning/4-CONTEXT.md` (19 decisions)
- `.planning/research/4-RESEARCH.md` (locked weight vector + personas)
- `.planning/4-PLAN.md` (this file — deviations + must_haves)
- `PRD.md` §2 V1.3 + §6 MARA compliance
- `PHASE.md` §Phase 4
- All 25 files in `files_modified` frontmatter

Gideon verifies each of the 8 `must_haves.truths` by running the SQL checks + grep commands from the task-level `<acceptance_criteria>`. Expected outcomes:

| Must-have | Verification method | Pass criterion |
|---|---|---|
| 1. match_token returned + stored | curl POST /api/leads | Response body contains uuid |
| 2. RPC returns persona-expected top-3 | Wave 6 Task 6.2 SQL results | Exact top-3 arrays per persona: A=`['UNSW','UWA','Adelaide']`, B=`['WSU','UTS','RMIT']`, C=`['UWA','UTS','RMIT']`, D=`['Adelaide','UOW','WSU']` |
| 3. RPC failure → lead still saves | Deterministic REVOKE-EXECUTE injection (per round-1 Blocker #5) | 200 response with `matches_ready:false`, `leads.matches IS NULL`, Resend email sent with "RPC failed" flag; GRANT restores |
| 4. /matches/{token} 4-state rendering | Browser UAT + psql timestamp flip | `pending` (matches=null) / `fresh` (<30m) / `expired` (>30m) / `not-found` (bad token) all render correctly |
| 5. No MARA-banned strings | Wave 6 Task 6.1 grep gate | All 4 greps clean |
| 6. Orphan /api/match removed (narrowed delete per round-1 Blocker #1) | `test ! -f web/src/app/api/match/route.ts` + home-page smoke | Route file gone; `MatcherSection` home-page render still live (`universities.ts` + `matcher.ts` preserved) |
| 7. Migrations + seed live | `\df match_unis_for_lead` + industry_placement count | Function exists + count > 20 |
| 8. match_token UNIQUE constraint | `\d leads` + pg_catalog check | `leads_match_token_unique` constraint present |

Plan-check precedes execute (Gideon reads this 4-PLAN.md before Wave 1 starts). If plan-check returns BLOCK or APPROVE-WITH-NOTES, absorb notes or iterate per `3-PLAN.md` precedent (up to 3 rounds before escalating to Sam).

---

## Rollback plan

Eight realistic failure modes, each with a rollback path. No live traffic yet (HANDOFF.json: magic link untested with real email; no real leads in production). Rollbacks are code + schema only — zero PII at risk.

1. **Migration 003 partial application** (e.g. ADD COLUMN succeeds, DROP COLUMN fails mid-transaction): Supabase wraps each `supabase db push` statement in an implicit transaction. If mid-migration failure → DB is left in the pre-migration state. Recovery: fix the failing DDL (common cause = a stale RLS policy referencing `matched_university_ids`; per Landmine #7, pre-flight with `SELECT * FROM pg_policies WHERE tablename='leads'`). Re-run `supabase db push`.

2. **Migration 004 compile error** (e.g. plpgsql syntax error): Supabase rejects the DDL before committing. The function is simply not created. Recovery: fix the SQL; re-run `supabase db push`. No data mutation happened.

3. **Seed upsert produces wrong industry_placement values**: if `--upsert --apply` writes `false` when the source-of-truth is `true` (e.g. the script reads a stale TS type before merging), the matcher will give bad scores. Recovery: inspect with `SELECT name, industry_placement FROM courses ORDER BY university_id, name` against `universities-seed.ts` expected values. Re-run `--upsert --apply` after fixing the script. No destructive side-effect — UPSERT is idempotent.

4. **/api/leads RPC invocation breaks the atomic INSERT** (e.g. TypeError in the try block bubbles to the outer handler): per the Research transaction shape, all RPC errors are caught and logged — they never throw past the try/catch. If a net-new bug causes 500s on lead POST: `git revert <Wave-4-commit-sha>` restores the pre-P4 /api/leads. The migrations stay live (no schema rollback) because the pre-P4 route doesn't reference match columns.

5. **/matches/[token] page throws on JSONB schema drift**: Zod `safeParse` on read catches this and returns `PendingMatches` (Case 1 branch). A re-parse after fix deploys restores Case 2. If drift is migration-level (e.g. 004 output shape doesn't match 1.3 schema), fix in `match-schema.ts` + redeploy — do NOT rewrite the migration (historical jsonb rows stay valid).

6. **RPC grants anon EXECUTE by default** (Landmine #2 edge case — some Supabase project configs): the REVOKE block in 004 handles this explicitly. If phase-verify catches `has_function_privilege('anon', ...)` = true, apply an ad-hoc `REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM anon` via Studio — no full rollback needed.

7. **match_token collision** (2^-122 probability — Landmine #4): the UNIQUE constraint from 003 rejects the second INSERT with a clear error. Recovery: retry the INSERT (new `uuid_generate_v4()` draws), or surface to Sam for investigation if it happens twice (which would indicate a broken uuid generator). No historical data at risk.

8. **Magic-link flow fails on expired-token fallback**: P2 infrastructure is tested via admin-api but not via UI. If the real flow breaks (e.g. redirect URL mismatch in Supabase project config): user sees error state; matches are still saved on leads row; Sam can manually email the `/matches/{token}` URL + Studio has full read access. Fix by updating `site_url` + `uri_allow_list` via Supabase Management API — no code change.

**No-rollback-possible scenarios:** the `DROP COLUMN matched_university_ids` in migration 003 is destructive but safe (column was never populated; zero data lost). If we need it back in v2, re-add as a NEW column and backfill from matches JSONB.

---

## PLANNING COMPLETE
