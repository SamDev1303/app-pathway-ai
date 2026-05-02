# Phase 4 phase-verify — Gideon single-seat gpt-5.4

**Date:** 2026-04-20 01:11 AEST
**Reviewer:** Gideon (GPT-5.4)
**Workspace:** /Users/shamalkrishna/Desktop/pathway-ai/
**Commits audited:** 807c452, 448045b, 72200ec, f0b0a70, cf82e9a, e2a6163

## Overall verdict
PASS-WITH-NOTES

Phase 4 delivers the revised UniMatch contract end-to-end. The live RPC currently returns the exact Round-5 persona arrays, `/api/leads` returns `match_token` + `matches_ready`, `/matches/[token]` implements the intended pending/fresh/expired flow, the orphan `/api/match` route is gone, copy is clean, and the live project denies anon access to the RPC. I am keeping the overall verdict at `PASS-WITH-NOTES` because must_have #2 is satisfied only under Sam's approved Round-5 override, and must_have #3 / #4 were verified by code-path audit plus live RPC probes rather than full failure-injection + browser UAT.

## must_have audits

### must_have #1 — submitted lead gets a `match_token` returned and stored
- Verdict: PASS
- Evidence: `web/src/app/api/leads/route.ts:63-67` inserts the row and selects `id, match_token`; `web/src/app/api/leads/route.ts:123-126` returns `{ ok: true, match_token, matches_ready }`. `supabase/migrations/003_match_prep.sql:21-25` adds `matches`, `matches_computed_at`, and `match_token uuid DEFAULT uuid_generate_v4()`, and `supabase/migrations/003_match_prep.sql:43-47` makes the token `NOT NULL` + `UNIQUE`.
- Live proof: service-role REST insert without `match_token` returned `201` with `match_token = 092d7d39-831c-4c23-9f00-f5ae95159991`, `matches = null`, `matches_computed_at = null`.
- Notes: I could not use the draft's `psql_managed` path because the local `SUPABASE_ACCESS_TOKEN` Management API route returned `403`; the live REST insert still proves the column default and storage behavior.

### must_have #2 — Round-5 4-persona exact smoke
- Verdict: PASS-WITH-NOTES
- Evidence: `web/src/lib/match-weights.ts:8-24` locks the weight vector used by the route and smoke; `supabase/migrations/005_match_function_stretch_fix.sql:176-186` changes `stretch_flag` so `budget_score = 0` lands in stretch; `.planning/4-PLAN.md:2059-2068` records Sam's approved Round-5 override and the new exact arrays.
- Live smoke results:
 - Persona A: `strong = ['UNSW', 'UWA', 'Adelaide']`, `stretch = ['UTS']`, RPC `200`, ~`200ms`
 - Persona B: `strong = []`, `stretch = ['WSU', 'UOW']`, RPC `200`, ~`157ms`
 - Persona C: `strong = []`, `stretch = ['UQ', 'UWA']`, RPC `200`, ~`145ms`
 - Persona D: `strong = []`, `stretch = ['Monash', 'UOW']`, RPC `200`, ~`146ms`
 - Cleanup check after delete: `[]`
- Notes: This is a real pass against the current contract, but it is a mid-phase contract override. The override is explicitly justified in `.planning/debug/wave-6-persona-smoke-failures.md:91-110` and then accepted into `.planning/4-PLAN.md:2059-2085`. I am treating that as legitimate because Sam approved Path A at 2026-04-19 20:55 AEST and the live RPC matches the new contract exactly.

### must_have #3 — RPC failure never rolls back the lead INSERT
- Verdict: PASS-WITH-NOTES
- Evidence: `web/src/app/api/leads/route.ts:63-67` performs the lead insert first; `web/src/app/api/leads/route.ts:85-104` wraps the RPC in `try/catch` and preserves the lead on both error and throw; `web/src/app/api/leads/route.ts:123-126` still returns `200` with `matches_ready: matchesReady`; `web/src/app/matches/[token]/page.tsx:76-89` renders `PendingMatches` when `matches` or `matches_computed_at` is absent.
- Notes: I did not execute the draft's full REVOKE/GRANT failure injection because this seat did not have a working SQL-shell path to the project and the web server was not running. Code-path audit is strong and aligns with the intended lazy-failure design, but this is the main reason the overall verdict stays at `PASS-WITH-NOTES`.

### must_have #4 — `/matches/{token}` renders anonymous fresh results for 30 minutes, then expires to magic-link
- Verdict: PASS-WITH-NOTES
- Evidence: `web/src/app/matches/[token]/page.tsx:57-79` handles lookup + pending state; `web/src/app/matches/[token]/page.tsx:81-89` guards JSON shape drift; `web/src/app/matches/[token]/page.tsx:92-111` computes TTL from `TOKEN_TTL_MINUTES` and switches from fresh results to `ExpiredTokenFallback`; `web/src/lib/match-weights.ts:39` sets `TOKEN_TTL_MINUTES = 30`. The page imports the expected component set at `web/src/app/matches/[token]/page.tsx:5-12`, and the directory currently contains the 10 shipped match components.
- Build proof: `npm run build` succeeds and emits `/matches/[token]` as a partial-prerendered route.
- Notes: I verified the branching and build output, not a browser-driven 31-minute expiry UAT. The implementation is correct on inspection, but this is another partial-verification note rather than a blocker.

### must_have #5 — no visa/migration/PR/MLTSSL/subclass strings in match output
- Verdict: PASS
- Evidence: `web/src/lib/mara-disclaimer.ts:11-13` is the canonical allowlisted disclaimer string. `web/src/lib/match-reason.ts:18-48` constrains generated match fragments to field/budget/IELTS/QS/G8/placement/regional/intake vocabulary. Repo grep across `web/src/app/matches`, `web/src/components/matches`, and `web/src/lib/match-*.ts` returned no hits outside `mara-disclaimer.ts`.
- Notes: This matches the draft's allowlist rule exactly.

### must_have #6 — orphan `/api/match` route removed; no functional callers
- Verdict: PASS
- Evidence: the route file does not exist (`test ! -f web/src/app/api/match/route.ts` passed). `web/src/lib/match-stub.ts:14-17` now documents the new P4 flow via `/api/leads` and `/matches/[token]` rather than calling `/api/match`. Repo grep for `"/api/match"` under `web/src` returned zero hits.
- Notes: The retained stub is clearly teaser-only and not a functional caller.

### must_have #7 — live schema applied, RPC live, anon blocked, `industry_placement` repopulated
- Verdict: PASS-WITH-NOTES
- Evidence: `supabase/migrations/003_match_prep.sql:15-24` adds `industry_placement` plus the leads match columns; `supabase/migrations/003_match_prep.sql:54-60` documents the token lookup path; `supabase/migrations/004_match_function.sql:17-24` defines `public.match_unis_for_lead(uuid, jsonb)` as `SECURITY DEFINER`; `supabase/migrations/004_match_function.sql:159-164` shows the original stretch predicate; `supabase/migrations/005_match_function_stretch_fix.sql:176-186` shows the live-fix predicate; `.planning/4-PLAN.md:118-119` defines the live privilege/count checks this phase promised.
- Live proof:
 - service-role RPC calls for all four personas returned `200`
 - anon POST to `/rest/v1/rpc/match_unis_for_lead` returned `401` with `permission denied for function match_unis_for_lead`
 - `HEAD /rest/v1/courses?industry_placement=eq.true&select=id` returned `Content-Range: 0-39/40`, so the live `industry_placement = true` count is `40`
- Notes: This is a live-behavior pass, but I could not run `\df` / direct catalog queries because the Management API PAT path in the draft was not working from this machine. The observed runtime behavior is still enough to conclude the function is live and anon-execute is revoked.

### must_have #8 — `match_token` has UNIQUE constraint + uuid4 default
- Verdict: PASS
- Evidence: `supabase/migrations/003_match_prep.sql:24` sets `DEFAULT uuid_generate_v4()`; `supabase/migrations/003_match_prep.sql:43-47` adds `NOT NULL` and `leads_match_token_unique`.
- Live proof:
 - insert without a token returned a generated UUID token
 - second insert with a duplicated explicit token failed `409` / `23505` with `duplicate key value violates unique constraint "leads_match_token_unique"`
- Notes: This is stronger than a grep-only verification because it proves the live uniqueness constraint is actually enforced.

## Cross-cutting findings
- The codebase is internally coherent with the revised Round-5 contract: `match-weights.ts` stays locked, the route passes those weights into the RPC, and migration `005` fixes the exact far-stretch leak that Sam approved reopening (`web/src/lib/match-weights.ts:8-24`, `web/src/app/api/leads/route.ts:86-90`, `supabase/migrations/005_match_function_stretch_fix.sql:5-30`, `:176-186`).
- Build/type health is clean from this seat: `npx tsc --noEmit` returned success and `npm run build` completed successfully, including the `/matches/[token]` route.
- Operational note: the draft's preferred Supabase Management API path was not usable here because the local `SUPABASE_ACCESS_TOKEN` attempt returned `403`. I switched to live REST probes with service-role and anon keys. That is not a product blocker, but it is worth fixing in the org tooling if Koda expects future `psql_managed` style audits from Gideon.

## Regressions
- None found in the shipped P4 scope.
- The only caveat is process-level, not product-level: two verify steps were only partially reproduced from this seat (`must_have #3` failure injection, `must_have #4` browser UAT).

## Recommendations
- Push is acceptable on the current code and live DB state.
- If Koda wants a fully reproducible post-merge audit script, fix the Supabase Management API credential path or add a repo-local `psql_managed` helper that works in Gideon's runtime.
- Optional P4.5 hardening: add a small scripted verify harness that exercises the failure path by stubbing the RPC client in-process so the `matches_ready:false` contract does not depend on ad hoc SQL REVOKE access.

## Sign-off
- Overall: PASS-WITH-NOTES
- Ready for `git push origin main`: yes
- If no: what must be fixed before push: n/a
