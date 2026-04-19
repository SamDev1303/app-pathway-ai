---
status: awaiting_human_verify
trigger: "Wave 6 4-persona SQL smoke failing: Persona A PASS, B/C/D FAIL — stretch arrays wrong, Persona D empty strong"
created: 2026-04-19T17:00:00+10:00
updated: 2026-04-19T17:35:00+10:00
---

## Current Focus

hypothesis: Plan-data inconsistency — PLAN.md locked expected arrays derived from RESEARCH.md persona math that contradicts its own SQL predicate. Under the predicate that is actually implemented, no seed-only or RPC-only fix reconciles all 4 personas without touching weights or expected arrays.
test: 3 hypotheses tested and refuted (see Eliminated). Root cause identified. Next decision requires Sam.
expecting: STOP, return CHECKPOINT to Sam.
next_action: Hand back to orchestrator as CHECKPOINT — decision needed.

## Symptoms

expected:
  A (Business, $55k, Feb, IELTS 7.5, postgrad): [UNSW, UWA, Adelaide]
  B (IT, $28k, July, IELTS 6.0, undergrad): [WSU, UTS, RMIT]
  C (Engineering, $35k, July, IELTS 6.5, undergrad — per SQL in PLAN.md): [UWA, UTS, RMIT]
  D (Health, $32k, Feb, IELTS 6.5, undergrad): [Adelaide, UOW, WSU]

actual (reproduced live 2026-04-19 against current RPC + seed):
  A: [UNSW(100), UWA(96), Adelaide(95)] strong, [UTS(78) stretch] — PASS
  B: [UOW(87)] strong, [WSU(100), RMIT(83)] stretch — FAIL
  C: [UQ(100), UWA(96), UTS(88)] strong, [UOW(96)] stretch — FAIL
  D: [] strong, [Monash(100), UOW(95)] stretch — FAIL

errors: 3 out of 4 personas return wrong rankings; Persona D has empty strong array
reproduction: POST to Management API `/v1/projects/szuqcptsmmgycvagteza/database/query` with CTE that INSERTs lead, calls match_unis_for_lead(), then DELETEs lead. Weight vector from PLAN.md line 2010.
started: Wave 6 of Phase 4 (after cf82e9a committed)

## Evidence

- timestamp: 2026-04-19T17:05:00+10:00
  checked: Live DB seed (universities JOIN courses) via Management API
  found: Seed fees match RESEARCH.md §"Seed data cheat-sheet" (line 69). Health bachelors: WSU $35,920 / UOW $37,920 / Adelaide $44,500 / Monash $47,800 (all IELTS 7.0). Engineering bachelors (5 at $39-51k, IELTS 6.0-6.5).
  implication: Seed is NOT drift. Hypothesis 1 (seed fees wrong) refuted.

- timestamp: 2026-04-19T17:12:00+10:00
  checked: RESEARCH.md line 213 (SQL predicate for far-stretch)
  found: "Far stretch 20-50% over: shown only in far-stretch rollup; base score 0 in course_total"
  implication: RESEARCH.md locks far-stretch budget_score = 0. Migration 004 line 114 matches this (WHEN ... *1.50 THEN 0). RPC is faithful to the predicate.

- timestamp: 2026-04-19T17:14:00+10:00
  checked: RESEARCH.md lines 136-140 (Persona C persona-math table)
  found: RESEARCH.md gives RMIT (26% over) budget=9, UWA (34% over) budget=9, UTS (42% over) budget=9, UQ (48% over) budget=0. This uses half-weight for 20-50%, NOT 0.
  implication: RESEARCH.md persona math contradicts RESEARCH.md SQL predicate. The math that produced the expected arrays used a DIFFERENT scoring rule than the one actually implemented. The RPC is faithful to the predicate; the expected arrays are faithful to the math. They cannot both be right.

- timestamp: 2026-04-19T17:16:00+10:00
  checked: RESEARCH.md lines 152-159 (Persona D persona-math table) vs current weights
  found: RESEARCH.md persona D table uses placement=5 per row AND regional=5 for Adelaide/UOW/WSU. Current canonical weights (match-weights.ts): placement=0, regional=0 (both zeroed by Gideon Deltas 2 and 3).
  implication: The expected array [Adelaide, UOW, WSU] was derived with placement=5 + regional=5 that are now zero. Subtracting those: Adelaide 80.9 - 5 - 5 = 70.9; UOW 80.7 - 5 - 5 = 70.7; WSU 79 - 5 - 5 = 69. Score gaps collapse, ordering shifts. The expected array is stale relative to the locked weight vector.

- timestamp: 2026-04-19T17:18:00+10:00
  checked: PLAN.md line 2009 (Persona C SQL) vs line 2064 (Persona C label)
  found: SQL inserts "undergraduate, 7, 35000, 6.5" (Bachelor $35k July IELTS 6.5). Label says "Masters Engineering $42k IELTS 6.5".
  implication: PLAN.md is internally inconsistent on Persona C. The SQL and the label disagree on level AND budget. Expected array ['UWA','UTS','RMIT'] was locked under AT LEAST ONE of these two specs, but cannot produce the same result under both.

- timestamp: 2026-04-19T17:20:00+10:00
  checked: Live run of Persona C as SQL says (Bachelor $35k July IELTS 6.5) AND as label says (Masters $42k Feb/Jul IELTS 6.5)
  found:
    Bachelor $35k: strong=[UQ(100) far_stretch, UWA(96) far_stretch, UTS(88) far_stretch], stretch=[UOW(96) stretch]
    Masters $42k: strong=[Melbourne(100) far_stretch, ANU(98) far_stretch, UOW(93) within], stretch=[UWA(93) stretch, UTS(85) stretch]
  implication: Neither spec produces ['UWA','UTS','RMIT']. Only 2 Engineering postgrad courses exist in seed (ANU $54k, Melbourne $56.5k). RMIT has no Engineering postgrad course. UWA+UTS+RMIT Engineering are all undergrad. So [UWA,UTS,RMIT] is only achievable under the Bachelor interpretation.

- timestamp: 2026-04-19T17:22:00+10:00
  checked: Can Persona C Bachelor produce [UWA, UTS, RMIT] under ANY reasonable stretch_flag fix?
  found: Under current seed + weights (Bachelor $35k July IELTS 6.5): UQ raw=74, UWA=71.225, UOW=70.975, UTS=65.4, RMIT=62.775. UQ always beats UWA under any monotone scoring. To exclude UQ, either remove UQ from seed, hard-cut at ≥40% (which kicks UWA/UTS/RMIT too), or add a penalty not in the weight vector.
  implication: The expected array ['UWA','UTS','RMIT'] is literally unachievable against this seed with any monotone transformation of the current weight vector. Not "hard to produce" — unachievable.

- timestamp: 2026-04-19T17:24:00+10:00
  checked: Persona A passes under IELTS 7.5 but fails under IELTS 6.5
  found: At IELTS 7.5: strong=[UNSW(100) within/meets, UWA(96) within/meets, Adelaide(95) within/meets]. At IELTS 6.5: strong=[UWA(100), Adelaide(100), Monash(90)], stretch=[UNSW(98) ielts-stretch, UTS(82) budget-stretch].
  implication: The brief stated Persona A used IELTS 6.5 and PASSED. That is false. PLAN.md line 1116/1976 and line 2062 both correctly label Persona A as IELTS 7.5. The passing smoke used 7.5, not 6.5. This is only a documentation inaccuracy in the brief, not a bug.

## Eliminated

- hypothesis: Seed fees in live DB diverged from RESEARCH.md assumptions
  evidence: Queried all 49 courses via Management API. Fees exactly match RESEARCH.md §"Seed data cheat-sheet" (line 69-82). No drift. Seed is correct.
  timestamp: 2026-04-19T17:10:00+10:00

- hypothesis: RPC stretch_flag misses the far-stretch tier (budget_score=0 should be stretch, not strong)
  evidence: Even with this fix applied (budget_score=0 OR budget_score=half OR ielts_score=half → stretch_flag=TRUE), Persona C still cannot produce [UWA,UTS,RMIT]. Persona D still cannot produce [Adelaide,UOW,WSU] in strong (they would all be stretch due to IELTS half-score). This fix resolves the SPIRIT of RESEARCH.md line 248 but not the LETTER of PLAN.md's locked expected arrays.
  timestamp: 2026-04-19T17:26:00+10:00

- hypothesis: Change stretch_flag to "both budget AND ielts at half-score" (AND not OR)
  evidence: Under this rule, Persona C Bachelor produces strong=[UQ, UWA, UOW, UTS, RMIT] (all strong, with top 3 = UQ/UWA/UOW). Still not [UWA, UTS, RMIT]. Persona D produces strong=[Adelaide/UOW/WSU/Monash] — rank 1 becomes Monash (highest total = 30+12+0+6+8.2+5+0+0+3 = 64.2 under current weights, vs Adelaide 30+12+0+6+5.9+5+0+0+3 = 61.9). Monash hard-cuts budget (49% over), so actually Monash hits budget_score < 0 (hard-cut): 49.375% under 1.50x → Monash $47,800 is 49.375% over $32,000 → budget_score = 0 (*1.50=$48k, Monash is $47.8k so within the 50% window → budget_score=0, NOT -1). So Monash is NOT hard-cut. It actually wins rank 1 on G8+QS. Expected [Adelaide, UOW, WSU] cannot be produced without hard-cutting Monash at a tighter threshold.
  timestamp: 2026-04-19T17:30:00+10:00

## Root Cause

Three independent defects in the plan/research pipeline combine to make the locked expected arrays unachievable:

1. **RESEARCH.md internal inconsistency**: §"SQL predicate" (line 213) sets far-stretch budget_score = 0, but §"Persona simulation" (lines 136-140, 152-157) computes per-persona expected scores using far-stretch = half-weight. These two passages contradict. The expected arrays were derived from the §Persona simulation math, while the RPC code was derived from the §SQL predicate.

2. **Stale weight values in RESEARCH.md persona math**: The persona tables use placement=5 and regional=5 for qualifying rows. The locked weight vector zeroes both (Gideon Deltas 2 and 3). Subtracting these signals from the expected per-row totals collapses the ranking margins and shifts the top 3.

3. **PLAN.md Persona C spec mismatch**: The SQL block at line 2009-2024 inserts `undergraduate, 7, 35000, 6.5` while the acceptance label at line 2064 says "Masters Engineering $42k IELTS 6.5". Neither spec alone produces the locked expected `['UWA','UTS','RMIT']` against the current seed.

Persona A passes by luck — the [UNSW, UWA, Adelaide] ordering at IELTS 7.5 $55k Business happens to be robust to all three defects because UNSW's G8+QS #19 dominance + $54,720 (within $55k) + IELTS 7.0 (met by 7.5) swamps any scoring change.

## Resolution

root_cause: Locked expected arrays for Personas B/C/D in PLAN.md §"Expected strong arrays" (lines 2062-2065) were derived from RESEARCH.md persona-simulation math that (a) uses a different budget-scoring rule than the SQL predicate in both files, (b) includes weights (placement=5, regional=5) that are now zeroed by Gideon Deltas, and (c) for Persona C uses a different (level, budget) than what the smoke SQL actually inserts. The RPC implementation is faithful to the SQL predicate in RESEARCH.md line 213 and to the locked weight vector in match-weights.ts. The seed is faithful to RESEARCH.md §"Seed data cheat-sheet". No silent weight re-tuning or seed re-jig can reconcile the contradiction.

fix: (not applied — needs Sam's decision) Three mutually exclusive paths:
  - **Path A (most honest, most work):** Re-derive expected arrays from scratch using the actual SQL predicate + actual weight vector + actual seed, with Sam's sign-off. This likely yields B=[WSU,UOW,RMIT]-ish, C=[UQ,UWA,UTS], D=[Monash,Adelaide,UOW] (all from live smoke output). Ships a consistent system; breaks the plan's contract with Gideon R1 Blocker #4 (which was itself premised on inconsistent math).
  - **Path B (retune to hit locked arrays):** Re-open RESEARCH.md weight vector, raise budget weight further, reinstate regional=5 OR placement=5 with a hard signal to capture them. This is the "silent re-tuning" the plan forbids, but we'd be doing it OPENLY with Sam's approval, not silently.
  - **Path C (soften the smoke contract):** Replace exact-top-3 assertions with tolerance/subset checks ("rank 1 ∈ {UNSW, Melbourne}, WSU in top 3 stretch or strong") as Gideon R1 originally rejected. This concedes that the seed is too small to produce deterministic top-3s under the current weight vector.

verification: (pending)
files_changed: []

## What I Explicitly Did NOT Do

- Did NOT edit `web/src/lib/match-weights.ts` (plan forbids silent weight re-tuning).
- Did NOT edit `supabase/migrations/004_match_function.sql` in place (never edit applied migrations).
- Did NOT write `005_match_function_fix.sql` (no RPC change was warranted — the RPC is correct; the expected arrays are stale).
- Did NOT re-seed the DB (seed is faithful to RESEARCH.md).
- Did NOT rewrite the expected arrays in PLAN.md (needs Sam's sign-off given Gideon R1 Blocker #4 locked them).

## Recommendation for Sam

Path A + a narrow RPC fix. Specifically:

1. Add migration `005_match_function_fix.sql` that changes stretch_flag predicate to treat `budget_score = 0` (far-stretch) as stretch-tier. Rationale: RESEARCH.md line 248 ("Stretch shown: 20-50% over budget OR 0-0.5 IELTS below") locks the SEMANTICS of the tier boundaries. The current RPC has far-stretch courses leaking into STRONG with `budget_verdict = 'far_stretch'`, which is a genuine bug in spirit even if expected arrays pretend otherwise. Fix this independently.

2. After the RPC fix, run all 4 personas. Hand Sam the fresh arrays. Ask Sam to either (a) accept them as the new expected-array contract or (b) re-derive from a tightened weight vector.

3. Document in PLAN.md that Gideon R1 Blocker #4 was based on inconsistent research math and has been re-opened.

Estimated fix size: ~8 line SQL migration + 4 lines of PLAN.md diff + new smoke commit. No new research needed if Sam accepts the fresh arrays.
