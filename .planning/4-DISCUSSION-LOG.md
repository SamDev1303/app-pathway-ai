# Phase 4: UniMatch engine — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `4-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 4 — UniMatch engine (backend API)
**Session:** 50 (Koda)
**Areas discussed:** Weighting strategy, Ranking algorithm shape, Cache storage + key, Reason text generation

---

## Weighting strategy

### Q1 — Signal set

| Option | Description | Selected |
|---|---|---|
| Medium — field + level + budget fit + IELTS readiness (Recommended) | Adds two admission-gating signals on top of stub's field/level. G8 stays as tiebreak. | |
| Minimal — field + level + G8 only (same as stub) | Port stub logic as-is. | |
| Rich — medium + QS rank + location + industry_placement | Adds QS ranking + state preference + placement. | |
| Full — all available signals weighted | Everything from rich plus regional/metro + intake proximity. | ✓ |

**User's choice:** Full signal set.
**Notes:** Sam flagged weighting strategy as "the most important" of the 4 gray areas.

### Q2 — Algorithm (pgvector vs structured SQL)

| Option | Description | Selected |
|---|---|---|
| Structured SQL only — no pgvector for v1 (Recommended) | Weighted SQL on enum prefs. No new migration. Defers pgvector to v2. | ✓ |
| Hybrid — pgvector for soft interest matching + SQL filters | Add embedding col + backfill. | |
| pgvector-first — embedding cosine similarity is primary signal | Heavy embeddings bet. | |

**User's choice:** Structured SQL only.

### Q3 — Budget + IELTS mismatches

| Option | Description | Selected |
|---|---|---|
| Soft penalties (Recommended) | Under-budget / under-IELTS lowers score but doesn't exclude. | |
| Hard filters — exclude unqualifying unis | Cleaner signal, empty-set risk. | |
| Two-tier display — 'matches' + 'stretch' | 3 strict + 2 stretch. More front-end work. | ✓ |

**User's choice:** Two-tier display.

### Q4 — Weight constants location

| Option | Description | Selected |
|---|---|---|
| Typed constants in web/src/lib/match-weights.ts (Recommended) | Export MATCH_WEIGHTS record. Git-reviewable. | ✓ |
| Env-var overrides for each weight | Tunable without redeploy. | |
| match_config table in Supabase | Admin-tunable, no UI in v1. | |

**User's choice:** Typed constants.

### Q5 — Weight shape (follow-up)

| Option | Description | Selected |
|---|---|---|
| Tiered — core signals dominant, rest as tiebreakers (Recommended) | Core = 70-80 pts, tiebreakers = 20-30 pts. | ✓ |
| Flat — equal weight across all signals | ~10 pts each. | |
| Weighted by admission gate-keeper power | Budget + IELTS highest weight. | |

**User's choice:** Tiered.

### Q6 — Stretch thresholds

| Option | Description | Selected |
|---|---|---|
| Budget within 20% + IELTS within 0.5 band (Recommended) | Concrete thresholds researcher can validate. | ✓ |
| Budget within 30% + IELTS within 1.0 band | Wider stretch zone. | |
| Soft curve — no hard cutoff, just score decay | Cleaner math, harder explain. | |

**User's choice:** 20% budget / 0.5 IELTS.

### Q7 — Who picks the actual weight NUMBERS

| Option | Description | Selected |
|---|---|---|
| Gideon research agent during plan-phase (Recommended) | Researcher reviews QS WUR + IDP / Study Australia conventions. | ✓ |
| Sam picks by gut, committed as constants | Faster but less defensible. | |
| Start with Sam's gut, Gideon validates post-hoc | Middle path. | |

**User's choice:** Gideon research agent during plan-phase.

---

## Ranking algorithm shape

### Q1 — Granularity

| Option | Description | Selected |
|---|---|---|
| Course-level scoring, roll up to best-match uni (Recommended) | Score each course, take per-uni max. | ✓ |
| Uni-level aggregate scoring | Compute per-uni aggregates. | |

**User's choice:** Course-level scoring.

### Q2 — SQL shape

| Option | Description | Selected |
|---|---|---|
| Single Postgres RPC function match_unis_for_lead() (Recommended) | plpgsql function, one round-trip. | ✓ |
| TypeScript composition — multiple Supabase queries | 2-3 round-trips, risks 500ms budget. | |
| Supabase view + light TS scoring | Middle ground. | |

**User's choice:** Single Postgres RPC.

### Q3 — Tiebreakers (original pick)

| Option | Description | Selected |
|---|---|---|
| QS rank → G8 → alphabetical (Recommended) | Deterministic cascade. | *(later revised)* |
| Random jitter | Non-deterministic. | |
| Location preference | Requires preferred_state column. | ✓ *(then revised)* |

**User's initial choice:** Location preference.
**Koda flag:** Grep verified `preferred_state`/`preferred_city` does not exist in leads schema. Location tiebreaker has no backing data in v1.
**Revised choice:** Dropped location tiebreaker → reverted to QS rank → G8 → alphabetical. (See "Gap resolution" section below.)

### Q4 — Match % display

| Option | Description | Selected |
|---|---|---|
| Normalized 0-100 (Recommended) | Top = 100, others scaled. | ✓ |
| Raw score out of max possible | Honest but demoralizing. | |
| Match quality label instead of number | Violates PRD "match %" language. | |

**User's choice:** Normalized 0-100.

---

## Cache storage + key

### Q1 — Storage

| Option | Description | Selected |
|---|---|---|
| JSONB column on leads row (Recommended) | Add matches + matches_computed_at. No separate table. | ✓ |
| Separate lead_matches table | Over-engineered for v1. | |
| Next.js unstable_cache with profile_hash | No DB persistence. | |

**User's choice:** JSONB on leads row.

### Q2 — Compute timing

| Option | Description | Selected |
|---|---|---|
| Computed inside the atomic INSERT, stored on leads row (Recommended) | One route handler does it all. | ✓ |
| Computed on-demand by final results page | First-hit compute + cache. | |
| Both — stub preview at Step 3, real match at submit | Stub stays, real API at submit. | |

**User's choice:** Computed inside atomic INSERT. *(Note: stub is still used for Step 3 live teaser — interpretation locked in CONTEXT.md.)*

### Q3 — Staleness after 24h

| Option | Description | Selected |
|---|---|---|
| Serve stale — lead results are historical (Recommended) | No silent recomputes. | ✓ |
| Recompute silently on next fetch after 24h | Latest uni data wins. | |
| Show stale banner + offer recompute button | Zero user value v1. | |

**User's choice:** Serve stale.

### Q4 — Access control (original pick)

| Option | Description | Selected |
|---|---|---|
| Anyone with lead_id (short-lived URL) (Recommended) | Return match_token in submit response. | |
| Require the student's email magic-link login | Full auth wall. | ✓ *(later revised)* |
| Session cookie — same-browser only | Loses on device switch. | |

**User's initial choice:** Magic-link login for match access.
**Koda push-back:** Collides with P3 locked decision ("lead form is anonymous"). Forcing login between submit and results = major drop-off. Offered refined 3-way split (teaser anonymous / post-submit anonymous / return visits gated).

### Q4' — Access control (refined)

| Option | Description | Selected |
|---|---|---|
| Magic-link ONLY for return visits; submit-session stays anonymous (Recommended) | Token valid ~30 min, then magic-link. | ✓ |
| Magic-link for EVERYTHING including post-submit results | Check email to see matches. | |
| Never require auth — match_token works forever | Shareable but PII-adjacent exposure. | |

**User's revised choice:** Token in-session (~30 min) → magic-link for return visits. Preserves P3 anonymous flow + reuses P2 magic-link infra.

---

## Reason text generation

### Q1 — Source

| Option | Description | Selected |
|---|---|---|
| Template strings built from match_result fields (Recommended) | Zero LLM cost, -safe, deterministic. | |
| LLM-generated prose with guardrails (gpt-4o-mini) | Adds latency + cost + risk. | |
| Hybrid — template as base, optional LLM rewrite on request | V1 template only, LLM path for v2 hook. | ✓ |

**User's choice:** Hybrid.
**Koda interpretation:** JSONB `reason_parts` shape is schema-ready for v2 LLM; v1 still ships template rendering only. No new v1 scope. Locked in CONTEXT.md RT-1.

### Q2 — Shape

| Option | Description | Selected |
|---|---|---|
| One dot-separated line, 4-6 fragments max (Recommended) | Scannable, mobile-safe. | ✓ |
| Two sentences — match highlights + admission fit | Warmer tone, verbose. | |
| Bulleted list of 3-5 reasons | Readable, 5x vertical space. | |

**User's choice:** One dot-separated line, 4-6 fragments.

### Q3 — Content

| Option | Description | Selected |
|---|---|---|
| Smart top-3 — whatever scored highest for that uni (Recommended) | Reason is specific to why THIS uni ranked here. | ✓ |
| Fixed order — always show field + budget + IELTS + G8/QS | Predictable, jarring on stretch tier. | |
| Match-tier aware — different shape for Match vs Stretch | Different templates per tier. | |

**User's choice:** Smart top-3.

### Q4 — disclaimer placement

| Option | Description | Selected |
|---|---|---|
| Once on results page, not per-result (Recommended) | Single persistent banner. | ✓ |
| Inline on every result card | Most defensive, cluttered UX. | |
| Footer only, no banner | Risks scrub fail. | |

**User's choice:** Once on results page.

---

## Gap resolution

During discussion, Koda probed two PRD/schema gaps Sam asked to be verified instead of parked:

### Gap 1 — `preferred_state` column on leads

**Status:** MISSING. Grep across `web/src` + `supabase` for `preferred_state`, `preferred_city`, `preferred_location` returned zero hits. P3 schema captures `preferred_fields[]`, `preferred_levels[]`, `preferred_intake_month` but no location field.

**Resolution (Q):** Drop location tiebreaker OR add the column + Step 3 UI OR add dormant column without UI.

**User's choice:** Drop location tiebreaker — revert to QS rank → G8 → alphabetical. Moved `preferred_state` to deferred ideas.

### Gap 2 — QS WUR licensing

**Status:** LOW RISK. `qs_ranking_2025` values are hardcoded integers in `universities-seed.ts` — factual published rank values, not proprietary dataset. Republishing integer ranks (e.g., "UNSW is QS #19") is treated like citing a fact. Risk rises only if we scrape or republish QS's full methodology tables. Acceptable for P4; flag for P4.5 compliance sweep.

**Resolution:** Accepted as-is for P4. Noted in `4-CONTEXT.md` `<specifics>` section.

### Bonus gap — `courses.industry_placement` missing from DB

**Status:** Caught during Gap 1 probe. Seed script header (`web/scripts/seed-universities.ts` lines 17-24) explicitly flags this as P4 work: *"industry_placement is part of the web type (used by matcher scoring) but NOT in the DB schema. Seed keeps it in the bundled universities-seed.ts for now. P4 will migrate the matcher to server-side; add column then."*

**Resolution:** P4 ships migration 003 adding `courses.industry_placement boolean NOT NULL DEFAULT false` + UPSERT re-seed. Not deferred — required for the Full signal set decision (W-1).

---

## Deferred Ideas

- **Location preference tiebreaker + `leads.preferred_state` column** — dropped from P4; candidate for v1.1 patch or v2.
- **Free-text interest field + pgvector similarity** — deferred to v2 chat (P5 integration).
- **LLM-generated reason prose** — schema-compatible but not implemented in v1.
- **Recompute endpoint / admin tooling** — v2 admin CRM territory.
- **Match quality telemetry** — v2 analytics scope.
- **"Apply with Pathway-AI" live application flow** — CTA shows in v1, wired path is v2.

---

## Claude's Discretion

- `reason_parts` JSONB exact schema
- RPC error propagation + structured logging format
- Unit test shape for `match-weights.ts` + scoring composition
