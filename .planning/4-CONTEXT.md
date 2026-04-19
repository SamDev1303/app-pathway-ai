# Phase 4 — UniMatch engine (backend API)

**Created:** 2026-04-19 · session 50 (discuss-phase via Koda)
**Domain:** Replace `web/src/lib/match-stub.ts` with a real `POST /api/match` endpoint + Postgres RPC. Input: a lead profile. Output: top-3 AU university matches with normalized match % and structured reason fragments, plus up to 2 "stretch" options. Computed during the atomic Step-5 INSERT, stored as JSONB on the `leads` row, served via one-time match token for 30 min (anonymous) then gated behind Supabase magic-link (P2 infra).

**Not in scope:** 43-uni backfill (P4.5), per-course `cricos_code` backfill (P4.5), AI Advisor Chat (P5), SOP generation (P6), admin CRM view (v2 cut), Sequence module (v2 cut), free-text interest fields with pgvector similarity (deferred to v2 chat integration).

---

## <prior_decisions>

Locked in earlier phases or PRD — downstream agents must not re-ask.

### From PRD
- **Tech stack:** Next.js 16 hand-coded (NOT Lovable / Bolt — PRD §5 is stale on this per `feedback_atlas-ai-hand-coded`). OpenAI `text-embedding-3-small` 1536-dim is the project's embedding spec (NOT used in P4 — deferred to v2 chat).
- **Perf budget:** Top-3 results under 500ms from Supabase (PRD §2 V1.3 success metric).
- **MARA Code compliance:** no visa / migration / PR / points-test / MLTSSL strings anywhere in output. Verified again in P0.5.
- **v1 ships 43 AU unis from CRICOS manual seed** — no scraping (X.3 cut).

### From P1 (DB + DEV-001)
- Supabase region `ap-southeast-1` Singapore. APP 8 cross-border disclosure already shipped in P3's LeadModal notice block.
- Current seed: **12 of 43 unis loaded**. 43-uni backfill is a **P4.5 compliance gate item**, NOT a P4 requirement. Matcher works on whatever rows exist.
- `universities.qs_ranking_2025` is int, nullable. Present in all 12 seeded unis. LOW licensing risk (factual integers from published rankings, not proprietary dataset).
- `courses` schema has `indicative_fee`, `ielts_overall`, `field`, `level`, `intake_months int[]`, `duration_months`. Missing `industry_placement` — **seed script header confirms this is P4's job to add.**

### From P2
- Auth is magic-link infrastructure only. Will be reused in P4 for return-visit match access.

### From P3
- Lead form anonymous until Step 5 consent tick.
- Step 3 captures: `preferred_fields[]`, `preferred_levels[]`, `preferred_intake_month`, `industry_placement`, `prioritize_outcomes`. **No `preferred_state` column — gap confirmed by grep across `web/src` + `supabase` 2026-04-19.** Location tiebreaker dropped from P4 scope as a result.
- Step 3 teaser uses `stubTopMatches()` client-side. **P4 leaves the stub in place for the live-teaser experience** — stub is fast, deterministic, MARA-safe. Real `/api/match` runs only at submit. This preserves P3's investment and keeps Step 3 perf under 16ms.
- `lead_score` + `tier` computed server-side via `web/src/lib/lead-score.ts` inside the atomic INSERT — P4 extends this same route handler.
- Single-seat Gideon on full `gpt-5.4` for plan-check + phase-verify. No dual-seat.

---

## <decisions>

19 decisions locked this session.

### Weighting strategy (W-*)

- **W-1 Signal set (FULL):** field overlap, level match, budget fit, IELTS readiness, QS WUR rank, G8 status, industry_placement, regional/metro, intake proximity. *(Location preference dropped — no backing column in P3.)*
- **W-2 Algorithm:** Structured SQL only — no pgvector for v1. Pre-typed preferences (`CourseField`, `StudyLevel` enums) + numeric columns on courses are sufficient. pgvector deferred to v2 chat integration where free-text interests actually benefit.
- **W-3 Mismatch handling:** Two-tier display — "Matches" (passes hard fit checks) + "Stretch" (within tolerance of budget/IELTS gates). Up to 3 matches + 2 stretch = up to 5 rows returned. Empty result sets should not happen.
- **W-4 Weight constants location:** Typed record exported from `web/src/lib/match-weights.ts`. Passed into the RPC as a `jsonb` parameter so SQL stays deterministic and weights stay git-reviewable.
- **W-5 Weight shape:** Tiered — **core** (field + level + budget + IELTS) = 70-80 pts, **tiebreakers** (QS rank + G8 + industry_placement + regional + intake proximity) = 20-30 pts. Prevents a field-mismatched uni from winning on G8 alone.
- **W-6 Stretch threshold:** Budget within 20% over student's stated budget → stretch; else excluded. IELTS within 0.5 band below course requirement → stretch; else excluded. Hard cutoffs outside those windows.
- **W-7 Who picks weight numbers:** Gideon research agent during `/gsd-plan-phase 4`. Researcher reviews QS WUR methodology + AU edu lead-form conventions (IDP, Study Australia, StudyMove) and proposes concrete numeric weights + stretch math in PLAN.md for Sam review before execute.

### Ranking algorithm (R-*)

- **R-1 Granularity:** Score at course level, roll up to best-match uni. Per-uni score = max(course_score). Reason text cites the specific course ("Best match: Bachelor of IT — within budget, IELTS 6.5").
- **R-2 SQL shape:** Single Postgres RPC `match_unis_for_lead(lead_id uuid, weights jsonb) RETURNS TABLE(...)`. One round-trip from Vercel US → Supabase Singapore. Plpgsql function owns the scoring math; TS owns weight values.
- **R-3 Tiebreakers:** Cascade — (1) higher QS rank, (2) G8 status, (3) alphabetical by uni name. Deterministic across calls so reload = same order.
- **R-4 Match % display:** Normalized 0-100. Top result = 100, others scaled relative. Stretch tier still normalized but tagged as stretch in UI.

### Cache + persistence (C-*)

- **C-1 Storage:** JSONB on `leads` row. New columns: `matches jsonb`, `matches_computed_at timestamptz`, `match_token uuid`.
- **C-2 Compute timing:** Inside the atomic Step-5 INSERT flow in `web/src/app/api/leads/route.ts`. Sequence: Zod validate → compute lead_score → INSERT lead → call `match_unis_for_lead()` → UPDATE leads SET matches = result → fire Resend email → return `{ok: true, match_token}`. If match RPC fails, lead INSERT still succeeds — match can be recomputed later (see open_for_planner item 3).
- **C-3 Staleness:** Serve stale indefinitely. Once a lead is submitted, the match is their match. No silent recomputes. If UniMate asks for refresh, expose via admin tooling in v2.
- **C-4 Access control:** `match_token` valid for current session (~30 min from `matches_computed_at`). After expiry, `/matches/{token}` triggers Supabase Auth magic-link to the email on the lead. On successful login, same `/matches/{token}` loads. Token is **permanent** server-side — expiry is purely client-gating. Lead form itself stays anonymous (P3 lock preserved).

### Reason text (RT-*)

- **RT-1 Source:** Template rendered in TypeScript from structured `reason_parts` JSONB. V1 ships template only. JSONB shape is deliberately structured (not pre-rendered strings) so v2 can feed it to `gpt-4o-mini` for LLM rewriting if desired — schema-ready without v1 scope bleed.
- **RT-2 Shape:** One dot-separated line, 4-6 fragments max. Example: `"Matches IT + Business · Within budget · IELTS 6.5 needed · Group of Eight · QS #19"`. Mobile-safe, scannable, consistent with stub's current pattern.
- **RT-3 Content:** Smart top-3 — the 3 signals that contributed most to THIS uni's score get named in the reason text. Different unis surface different fragments based on what won the score.
- **RT-4 MARA disclaimer placement:** Single persistent banner on `/matches/{token}` — NOT per-result. Wording to be locked in planning (template: "These matches are educational information only. For visa, migration, or PR advice, consult UniMate's registered MARA agents.").

### Claude's Discretion
- `reason_parts` JSONB exact schema (suggested: `{matched_fields: string[], budget_verdict: 'within'|'stretch', ielts_verdict: 'meets'|'stretch'|'below', qs_rank: int?, g8: bool, industry_placement: bool, regional: bool, intake_hit: bool, best_course_name: string}`)
- RPC error propagation + structured logging
- Unit test shape for match-weights.ts + the scoring composition function

---

## <migration_scope>

**Migration 003_match_prep.sql (P4 must ship):**
```sql
-- Add industry_placement column (was in TS type but never in DB — seed script flagged as P4 work)
ALTER TABLE courses ADD COLUMN industry_placement boolean NOT NULL DEFAULT false;

-- Match result storage on leads row
ALTER TABLE leads ADD COLUMN matches jsonb;
ALTER TABLE leads ADD COLUMN matches_computed_at timestamptz;
ALTER TABLE leads ADD COLUMN match_token uuid DEFAULT uuid_generate_v4();

-- Supersede the unused array column (matched_university_ids was in P1 migration, never populated)
ALTER TABLE leads DROP COLUMN matched_university_ids;

-- Token lookup index
CREATE INDEX idx_leads_match_token ON leads(match_token);
```

**Migration 004_match_function.sql (P4 must ship):**
- `CREATE OR REPLACE FUNCTION match_unis_for_lead(p_lead_id uuid, p_weights jsonb) RETURNS TABLE(...) SECURITY DEFINER` — grants it read across `courses` + `universities` despite RLS.
- Function body does the course-level scoring, aggregation, sorting, tier classification, normalization. No LLM calls. No embedding calls. Pure SQL.

**Seed refresh:**
- `web/src/lib/universities-seed.ts` already has `industry_placement` per course. `web/scripts/seed-universities.ts` needs a one-line change: include `industry_placement` in the courses insert payload. Run `--wipe --apply` to repopulate the 12 rows with the new column.

---

## <canonical_refs>

Downstream agents (gsd-phase-researcher + gsd-planner + gsd-executor) **must read these before writing PLAN.md**.

### Project spec + contract
- `PRD.md` §2 V1.3 (UniMatch scope) · §4 V1.3 user stories · §5 tech stack · §6 AU compliance · §3 X.* cut modules
- `PHASE.md` §"Phase 4: UniMatch engine (backend API)" — 4 tasks
- `.planning/PROJECT.md` — GSD meta pointers to root SoT
- `CLAUDE.md` §§"Plan check" and "Phase verify" (note: single-seat Gideon on gpt-5.4 supersedes dual-seat from P3)
- `planning/atlas-ai/DEVIATIONS.md` §DEV-001 (Singapore region — P4 doesn't add new obligations; APP 8 already covered in P3)

### DB + prior phase artifacts
- `supabase/migrations/001_initial_schema.sql` — universities (lines 18-36), courses (41-57), leads (62-102), embeddings (107-115)
- `supabase/migrations/002_leads_status.sql` — lead status enum + auto-stamp trigger (from s48 r2)
- `.planning/3-CONTEXT.md` — P3 lead capture decisions (D1-D10)
- `.planning/3-PLAN.md` — P3 implementation plan

### Code to extend / replace
- `web/src/lib/match-stub.ts` — current client-side stub being replaced (Step 3 teaser keeps using it; real `/api/match` is the parallel path)
- `web/src/lib/universities-seed.ts` — 12-uni seed including `industry_placement` on every course (2026-04-19 grep confirms all present)
- `web/scripts/seed-universities.ts` — seed script header (lines 17-24) explicitly flags industry_placement as P4's migration work
- `web/src/app/api/leads/route.ts` — route to extend with match compute + UPDATE
- `web/src/lib/types.ts` — `University`, `Course`, `CourseField`, `StudyLevel` types (add `MatchResult`, `MatchTier`, `ReasonParts` here)
- `web/src/components/lead/Step3Preferences.tsx` — houses the current stub teaser call site (reviewers should verify no changes needed)

### New files P4 will create
- `web/src/lib/match-weights.ts` — typed weight constants
- `web/src/lib/match-reason.ts` — template renderer for reason_parts → single line
- `web/src/app/api/match/route.ts` — if we decide the RPC needs its own endpoint (TBD: currently the plan is to call RPC from `/api/leads` at submit, so `/api/match` may not need to exist in v1)
- `web/src/app/matches/[token]/page.tsx` — final results page
- `supabase/migrations/003_match_prep.sql`
- `supabase/migrations/004_match_function.sql`
- `web/src/lib/match-weights.test.ts` + scoring unit tests (if Gideon recommends)

---

## <code_context>

### Reusable assets (from scout_codebase)
- `web/src/lib/match-stub.ts` — keep for Step 3 teaser, do NOT delete in P4. Mirrors the scoring-composition pattern the RPC will follow.
- `web/src/lib/lead-score.ts` — server-side scoring for lead_score tier. Same pattern applies to match scoring.
- `web/src/lib/universities-seed.ts` — static 12-uni dataset shape, source of truth for `industry_placement` backfill values.
- Framer Motion + Tailwind + `rail-gold`, `paper-grain`, `font-display` classes — already used in LeadModal + Step components. Results page inherits the same design system.

### Established patterns
- Atomic INSERT via service-role Supabase client in `route.ts` — P3 D10 established this pattern. P4 extends, doesn't replace.
- Per-step subcomponent split — P3 D2. Match results page should follow similar structure (`MatchList`, `MatchCard`, `StretchSection`, `MaraBanner` components).
- Zod schemas live in `web/src/lib/*-schema.ts`, shared between client + server. `match-schema.ts` for `MatchResult` validation.
- Env vars for API knobs flow through `process.env.X ?? 'default'` with defaults in code (see `UNIMATE_LEAD_EMAIL` pattern from P3 D9).

### Integration points
- `/api/leads` route becomes the match dispatcher — no new route mount needed for v1 unless we want recompute endpoint (Claude's Discretion).
- `/matches/{token}` is a new App Router route, unauthenticated (token-gated), with Supabase client-side fetch + magic-link-login fallback.
- Email template (Resend, from P3 D9) already includes `lead_score` — P4 extends to also include "Top match: {uni_name} at {match_pct}%" for Sam + UniMate visibility.

---

## <specifics>

- **Perf budget:** 500ms end-to-end for top-3 match from Supabase (PRD §2 V1.3). Gideon's research should model: Vercel US → Supabase Singapore round-trip + plpgsql function exec + TS normalization. Single RPC is the only plausible path.
- **12 vs 43 unis:** Algorithm ships against whatever is in the DB. If P4.5 lands the 43-uni backfill before UniMate sends real leads, great. If not, matcher still runs against 12 and returns top-3 / stretch-2 from what exists.
- **No free-text interest field in v1.** Student expresses interests via enum `preferred_fields` multi-select on Step 3. No pgvector needed. If UniMate wants free-text "tell us about yourself" in v2, that's when embeddings earn their cost.
- **QS WUR source:** `universities-seed.ts` has integer ranks verified against 2025 QS public rankings. Low legal risk; flag in P4.5 compliance sweep for a lawyer pass if UniMate escalates.

---

## <deferred>

- **Location preference tiebreaker:** would need `leads.preferred_state text` column + Step 3 UI dropdown. Dropped from P4 to keep scope clean. Candidate for v1.1 patch or v2.
- **Free-text interest field + pgvector similarity:** deferred to v2 chat (P5 integration) where embeddings earn their cost.
- **LLM-generated reason prose:** schema-compatible but not implemented in v1. When UniMate asks for richer match explanations in v2, feed `reason_parts` JSONB into `gpt-4o-mini`.
- **Recompute endpoint / admin tooling:** `POST /api/match/recompute` hook for UniMate to refresh stale matches. v2 admin CRM territory.
- **Telemetry:** match quality feedback loop ("did student apply to top uni?") — v2 analytics scope.
- **"Apply with UniMate" CTA on results page** — button exists visually, but the application flow itself is v2 scope. V1 just surfaces the email/phone in the UniMate notification.

---

## <open_for_planner>

Items the researcher + planner must close during `/gsd-plan-phase 4`:

1. **Weight numbers:** Propose concrete values for each of the 10 signals in the tiered shape (70-80 core + 20-30 tiebreakers). Justify against QS WUR methodology + IDP / Study Australia lead-form conventions. Sample 3-4 persona profiles (high-budget G8-chaser, budget-constrained IT student, late-intake pathway student, regional-preference nurse) and run them through proposed weights to catch obviously-wrong rankings before implement.
2. **Stretch math specifics:** The "within 20% budget" and "within 0.5 IELTS" windows need precise SQL. Linear decay inside the stretch zone, or flat 50% penalty? Researcher picks.
3. **Match RPC failure handling:** If `match_unis_for_lead()` throws after lead INSERT succeeds, does the route return 200 (lead saved, matches recomputed lazy) or 500 (retry whole flow)? Propose with transaction shape + error-surface UX.
4. **MARA disclaimer exact wording:** Lock the single-line text for `/matches/{token}` banner. Reference P0.5 scrub wording. Cross-check with `planning/atlas-ai/DEVIATIONS.md`.
5. **Match token TTL implementation:** Where does "30 min since matches_computed_at" live — client-side check or server-side middleware? Propose with Auth flow diagram.
6. **`/api/match` endpoint existence:** Verify whether v1 needs a standalone `POST /api/match` route (e.g., for lazy recompute or admin use) OR whether the match logic can live entirely inside `/api/leads` for v1. Recommend with rationale.
7. **Seed migration order:** 003_match_prep.sql adds `industry_placement` column with `NOT NULL DEFAULT false`, but `universities-seed.ts` already has accurate values. Plan the re-seed order: migration → UPSERT seed (not --wipe unless P4.5 is also ready).
8. **Results page design sketch:** Should `/matches/{token}` use Gideon-style design system (navy + cream + gold, paper-grain bg, Georgia serif eyebrow)? Sketch the layout before execute.

---

## <review_protocol>

**Single-seat Gideon on `gpt-5.4` for plan-check + phase-verify** — carried forward from P3 (Sam directive 2026-04-17). No dual-seat. Specter available only as escape hatch if Gideon is unavailable.

- Model flag: `-m gpt-5.4` — never `gpt-5.4-mini`. Never Neo. Never Atlas.
- Invocation: `codex exec -m gpt-5.4 --full-auto < prompt.md` for plan-check, phase-verify, and debug.
- Sign-off surface: `PHASE.md` §Phase 4 "Plan check sign-off" + "Phase verify sign-off".
- Research agent: `gsd-phase-researcher` spawned by `/gsd-plan-phase 4` handles the weight numbers + stretch math + MARA wording work.

---

## Next step

`/clear` → `/gsd-plan-phase 4` to produce `4-PLAN.md`. Planner + researcher act on this CONTEXT.md + PHASE.md §Phase 4 + the 8 open_for_planner items. Then Telegram approval gate → `/gsd-execute-phase 4`.
