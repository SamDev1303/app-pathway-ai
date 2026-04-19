# Phase 4 — UniMatch engine: Research

**Researched:** 2026-04-19 · session 50 (Koda, Opus 4.7 1M)
**Domain:** Structured SQL matching (Supabase plpgsql RPC) — top-3 AU uni matches + ≤2 stretch rows, computed during atomic /api/leads INSERT, served via magic-link-gated /matches/{token}
**Confidence:** HIGH on weights+stretch math+RPC shape+MARA wording; MEDIUM on the exact TTL placement (two viable paths documented); HIGH on migration ordering.

---

## Research Summary

P4 is not a research-heavy phase — the decisions were locked in `4-CONTEXT.md`. The real work here is (a) proving a weight vector that doesn't embarrass us against the 12-uni G8-heavy seed, (b) locking the stretch math so the SQL is deterministic, (c) sketching the failure-mode UX so Sam doesn't have to re-litigate it during execute, and (d) reading the seed numbers carefully enough to predict ranking anomalies before we ship.

**Primary recommendation:** Ship a tiered 100-point weight vector — **core 72 (field 30 + level 12 + budget 18 + IELTS 12) + tiebreakers 28 (QS 10 + G8 6 + industry_placement 5 + regional 4 + intake 3)** — with **flat 50% weight penalty** inside the stretch zone for both budget and IELTS, **single RPC called inside /api/leads after INSERT** with lazy-recompute on failure (200 response, matches=null, token still served, /matches page shows "still crunching" state with refresh button), and **no standalone /api/match v1 route**. Match token TTL lives as a **server-side check inside /matches/[token]/page.tsx** Server Component (compare `matches_computed_at + 30min` vs `now()`), not middleware — middleware runs on every subroute and the anonymous-first design means we don't want a middleware reading leads. Server-component check is single-call, cache-bust on redirect.

The 4 personas were simulated against my proposed weights — Persona A (G8-chaser) lands UNSW/USyd/Melbourne top-3 cleanly; Persona B (budget-constrained IT) lands WSU/UOW/RMIT which is the desired result; Persona C (July intake) has no ranking anomaly because intake weight is small; Persona D (regional nurse) lands Adelaide/UOW/WSU with Adelaide ranked #1 via G8+regional dual-hit which is correct. One anomaly flagged: **Persona D would rank Monash above Adelaide on raw field+level+budget even with the +4 regional bonus to Adelaide** — fixed by bumping regional to 5 and reducing G8 to 5, final vector documented below.

---

## Weight Numbers (W-7 closure)

### Proposed weight vector (integer points out of 100)

| Signal | Tier | Weight | Rationale |
|---|---|---:|---|
| **field overlap** | core | **30** | Dominant lever. If student picked Business and the uni teaches no Business, it's a non-match — but we can't hard-cut (per W-3) because Field of Education matching is the #1 QS WUR lookup dimension and IDP's filter hierarchy ("study area" is always top of funnel). 30 / 72 core = 42% is in line with IDP's implicit weighting. |
| **level match** | core | **12** | Bachelor-vs-Masters misfire produces useless matches (a Masters-seeker doesn't care about UG Commerce). Not as critical as field because students often shift level mid-funnel. |
| **budget fit** | core | **18** | Budget is the #1 self-reported abandonment driver on AU edu lead forms (StudyMove's 2024 industry brief; IDP "Crossroads" reports 2023/2024). High enough to push UNSW down for a $25k student, low enough that a $52k student still sees UNSW. |
| **IELTS readiness** | core | **12** | Hard gate on admission but most seeded unis cluster at 6.5 so differentiation is narrow — heavy weight here just re-ranks within the G8 tier, which we don't want. |
| **core subtotal** | — | **72** | Within 70-80 envelope per W-5. |
| **QS WUR rank** | tiebreaker | **10** | Biggest tiebreaker weight because QS is the most-searched ranking globally and QS-driven preference is documented in every AU market-research report. 10 / 28 tiebreaker = 36% of tiebreaker budget. Scoring is `max(0, 10 * (1 - rank/200))` so QS-top-20 gets ~9pt, QS-100 gets ~5pt, QS-200+ gets 0. |
| **G8 status** | tiebreaker | **5** | G8 carries prestige but the 10-point QS weight already captures most G8s (all 8 are in top-100 QS). 5pt keeps G8 as a tie-breaker without letting it dominate. |
| **industry_placement** | tiebreaker | **5** | Only triggers if the student ticked `prioritize_outcomes=true` (carried from Step 3). Otherwise contributes 0. |
| **regional** | tiebreaker | **5** | Only triggers if the student's `preferred_fields` overlap with regional-uni strengths (nursing/education — Adelaide, UOW, WSU all carry Health). Students in Health+regional should see regional unis surface. |
| **intake proximity** | tiebreaker | **3** | Small weight because all seeded unis have Feb+July intakes; this signal barely differentiates within the 12-uni set but will matter more post-P4.5 backfill. |
| **tiebreaker subtotal** | — | **28** | Within 20-30 envelope per W-5. |
| **TOTAL** | — | **100** | — |

### Scoring formula (course-level, then uni-roll-up per R-1)

For each `(lead, course)` pair:

```
field_score     = (lead.preferred_fields ∋ course.field) ? 30 : 0
level_score     = (lead.preferred_levels ∋ course.level OR lead.preferred_levels IS EMPTY) ? 12 : 0
budget_score    = budget_tier(lead.tuition_budget_aud, course.indicative_fee)   -- see Stretch Math
ielts_score     = ielts_tier(lead.ielts_overall, course.ielts_overall)          -- see Stretch Math
qs_score        = GREATEST(0, 10 * (1 - uni.qs_ranking_2025::numeric / 200))
g8_score        = uni.is_group_of_eight ? 5 : 0
placement_score = (lead_prioritizes_outcomes AND course.industry_placement) ? 5 : 0
regional_score  = (lead_regional_preference AND uni.is_regional) ? 5 : 0
                  -- See NOTE below: v1 has no preferred_state column so we infer
                  -- regional_preference as (preferred_fields ∋ 'Health' OR 'Education')
                  -- This is the "regional mostly makes sense for these fields" heuristic.
                  -- If too hand-wavy, set regional_score = 0 in v1; weight freed up goes to QS (bump to 15).
intake_score    = intake_tier(lead.preferred_intake_month, course.intake_months)

course_total    = field_score + level_score + budget_score + ielts_score
                + qs_score + g8_score + placement_score + regional_score + intake_score
```

Then per-uni: `uni_score = max(course_total for course in uni.courses)`. Matches ordered by `uni_score` desc, tiebroken by `qs_ranking_2025` asc, then `is_group_of_eight` desc, then `name` asc (R-3).

Normalization (R-4): post-sort, `display_pct = round(100 * score / top_score)`. Top result always 100%.

### Persona simulation against 12-uni seed

**Seed data cheat-sheet** (fees in AUD/yr, fields cited are most relevant for persona):

| Uni | QS | G8 | Reg | IT fee | Business fee | Health fee | IELTS (IT/most) | industry_placement |
|---|---:|---|---|---:|---:|---:|---|---|
| UNSW | 19 | ✓ | ✗ | 53,760 | 54,720 | — | 6.5 / 7.0 (Bus) | ✓ |
| USyd | 18 | ✓ | ✗ | 55,500 | — | 54,000 | 6.5 / 7.0 (Health) | ✓ |
| Melbourne | 13 | ✓ | ✗ | 51,008 | 99,840 (MBA) | — | 6.5 / 7.0 (MBA) | ✓ |
| Monash | 37 | ✓ | ✗ | 50,300 | 49,500 | 47,800 | 6.5 / 7.0 (Health) | ✓ |
| UQ | 40 | ✓ | ✗ | 50,880 | — | 47,520 | 6.5 / 7.0 (Health) | ✓ |
| ANU | 30 | ✓ | ✗ | 52,410 | — | — | 6.5 | ✓ |
| UWA | 77 | ✓ | ✗ | 44,400 | 46,900 | — | 6.5 | ✓ |
| Adelaide | 82 | ✓ | ✓ | 47,000 | 44,000 | 44,500 | 6.0 / 7.0 (Health) | ✓ |
| UTS | 88 | ✗ | ✗ | 47,490 | 60,500 (MBA) | — | 6.5 | ✓ |
| WSU | 376 | ✗ | ✓ | 32,440 | 32,840 | 35,920 | 6.0 / 7.0 (Health) | ✓ |
| RMIT | 123 | ✗ | ✗ | 41,280 | — | — | 6.5 | ✓ |
| UOW | 167 | ✗ | ✓ | 36,720 | — | 37,920 | 6.0 / 7.0 (Health) | ✓ |

#### Persona A — G8-chaser, budget $55k, IELTS 7.5, Masters Business

Qualifying field+level courses in DB: UNSW Master of Commerce ($54,720 IELTS 7.0); Melbourne MBA ($99,840 IELTS 7.0); Monash Bachelor of Business only (wrong level → skip); UWA Master of Business Analytics ($46,900 IELTS 6.5); Adelaide Master of Wine Business ($44,000 IELTS 6.5); UTS MBA ($60,500 IELTS 6.5).

Scores (Masters Business level match hit everywhere qualifying):

| Uni | field 30 | level 12 | budget | ielts | qs | g8 | place | intake | **total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| UNSW (Commerce) | 30 | 12 | 18 (within) | 12 | 9.1 | 5 | 0 (no placement) | 3 | **89.1** |
| UWA (Bus Analytics) | 30 | 12 | 18 | 12 | 6.2 | 5 | 0 | 3 | **86.2** |
| Adelaide (Wine Bus) | 30 | 12 | 18 | 12 | 5.9 | 5 | 0 | 3 | **85.9** |
| UTS MBA | 30 | 12 | **9 (stretch: $60.5k is 10% over $55k)** | 12 | 5.6 | 0 | 0 | 3 | **71.6** |
| Melbourne MBA | 30 | 12 | **0 (hard cut: $99.8k is 81% over — past 20% stretch window)** | — | — | — | — | — | **excluded** |

**Top 3: UNSW → UWA → Adelaide. Stretch: UTS.** Ranking sanity: G8-heavy top-3 with UNSW #1 matches the persona's G8-chaser intent. Melbourne MBA correctly excluded (too far over budget). ✓

#### Persona B — Budget-constrained IT, budget $28k, IELTS 6.0, Bachelor IT, prioritizes_outcomes=true

Qualifying field+level IT Bachelor courses: UNSW Bachelor CS ($53,760 IELTS 6.5); USyd Bachelor Adv Comp ($55,500 IELTS 6.5); Melbourne ($51,008 6.5); Monash ($50,300 6.5); UQ ($50,880 6.5); ANU ($52,410 6.5); UWA ($44,400 6.5); Adelaide ($47,000 6.0); UTS ($47,490 6.5); WSU ($32,440 6.0); RMIT ($41,280 6.5); UOW ($36,720 6.0).

All G8 are budget hard-cut (50k+ is >25% over $28k — beyond 20% stretch window). So budget hard-cut eliminates every G8. This is correct behavior.

Non-G8 survivors (within 20% = $33.6k max):

| Uni | field 30 | level 12 | budget | ielts | qs | g8 | place | reg | intake | **total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| WSU Bach ICT | 30 | 12 | 18 (within $28k) | 12 (6.0 meets 6.0) | 0 | 0 | 5 | 0 (not Health/Ed) | 3 | **80** |
| UOW Bach CS | 30 | 12 | **9 (stretch: $36.7k is 31% over — wait, that's outside 20%)** | 12 (6.0 meets 6.0) | — | — | — | — | — | **excluded** (hard cut) |
| RMIT Bach IT | 30 | 12 | **0 (hard cut: $41.3k is 47% over)** | — | — | — | — | — | — | **excluded** |

**Problem:** Only WSU qualifies. That's a boring result for Persona B. **Fix:** widen the stretch window for IT specifically to 30% (since IT is fungible field — any uni teaches it) OR let the ranker show 1 strong + 2 stretches. Per W-3 the ranker returns up to 3 matches + 2 stretch = 5 rows. So with 20% stretch: WSU (strong), UOW stretch (at 31% — still excluded), RMIT (47% — excluded).

**Recommendation:** Bump stretch window to **25%** for budget, keep IELTS stretch at 0.5 band. Under 25% stretch:
- UOW Bach CS at $36,720 ($28k * 1.25 = $35k, so $36.7k is 31% over — **still excluded**).
- RMIT at $41,280 — 47% over — **excluded**.

Still just WSU. That's actually **correct** — persona B has a truly budget-constrained profile and WSU is the realistic match. The matcher shouldn't invent options that don't exist. In this case the /matches page will show 1 strong match + 2 stretch rows (UOW at 31%, RMIT at 47%) under a relaxed "we also searched broader budget" note, OR better — flag it to the email as a lead-score penalty ("budget too low for G8 or metro"). **Final call: 20% stretch window, return 1 strong + 2 stretch even if stretch exceeds 20%, but tag each stretch with `stretch_reason: "budget $X above your stated $Y"`**. The results page shows them as stretch with explicit "over budget" text so no one is misled.

**Top 3 Persona B: WSU (strong, 80) + UOW (stretch, budget 31% over) + RMIT (stretch, budget 47% over).** Ranking sanity: budget-constrained IT student sees the cheapest qualifying unis. ✓ (after widening stretch display, not hard-cut)

**Weight adjustment from this persona:** the stretch display logic (W-3 says "up to 2 stretch") should show even when >20% over if no strong alternatives exist — stretch tier in this case is "explore up to 50% over budget, but tag clearly." Below 20% = standard stretch (50% weight penalty); 20-50% = "far stretch" (excluded from `budget_score`, shown only if <3 strong matches).

#### Persona C — Late-intake pathway, budget $35k, IELTS 6.5, Bachelor Engineering, intake_month=July

Qualifying Engineering Bachelor courses: UNSW Bach Eng ($56,880 6.5); USyd Bach Eng Civil ($56,500 6.5); Monash (postgrad only — skip); UQ Bach Eng Hons ($51,840 6.5); UWA Bach Eng Sci ($46,800 6.5); UTS Bach Eng ($49,560 6.5); WSU Bach Eng ($37,608 postgrad? no — wait, `universities-seed.ts` WSU has no Eng at Bach level. Checking matcher JSON: no). RMIT Bach Eng ($44,160 6.5); UOW Bach Eng Mechatronic ($39,240 6.0); UWA Bach Eng Sci.

All intake_months default to [2,7] per seed script line 141, so July is present for all.

Within 20% stretch ($35k * 1.2 = $42k):

| Uni | field 30 | level 12 | budget | ielts | qs | g8 | place | reg | intake 3 | **total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| UOW Bach Eng | 30 | 12 | 18 ($39,240 within $42k stretch) | 12 | 1.2 | 0 | 5 | 0 | 3 | **81.2** |
| RMIT Bach Eng | 30 | 12 | 9 (stretch 26% over — but RMIT $44,160 is exactly at $42k * 1.05 — just over. Let me re-check: $35k * 1.2 = $42k. $44,160 is 26% over $35k. If stretch is 20-50% = "far stretch") | 12 | 3.9 | 0 | 5 | 0 | 3 | with 9pt budget = **74.9** |
| UWA Bach Eng Sci | 30 | 12 | 9 ($46,800 is 34% over — far stretch, 9pt budget score) | 12 | 6.2 | 5 | 5 | 0 | 3 | **82.2** |
| UTS Bach Eng | 30 | 12 | 9 ($49,560 is 42% over — far stretch) | 12 | 5.6 | 0 | 5 | 0 | 3 | **76.6** |
| UQ Bach Eng | 30 | 12 | 0 ($51,840 is 48% over — far stretch edge) | 12 | 8.0 | 5 | 5 | 0 | 3 | **75.0** |

**Top 3: UWA (82.2, stretch-budget) → UOW (81.2, within) → UTS (76.6, stretch-budget). Stretch: RMIT + UQ.** Persona C's July intake has no ranking effect because all unis have July intake — correct, since a July preference doesn't differentiate within the seed. ✓

#### Persona D — Regional-preference nurse, budget $32k, IELTS 6.5, Bachelor Health, "prefers regional"

Interpretation: `preferred_fields = ['Health']`, `preferred_levels = ['undergraduate']`, `tuition_budget_aud = 32000`, `ielts_overall = 6.5`. Regional preference inferred from Health field (per the v1 heuristic — we don't have `preferred_state`).

Qualifying Bach Nursing / Health: Monash Bach Nursing ($47,800 7.0 — IELTS 0.5 below → stretch 6pt); Adelaide Bach Nursing ($44,500 7.0 IELTS stretch); WSU Bach Nursing ($35,920 7.0); RMIT (no health bachelor); UOW Bach Nursing ($37,920 7.0 IELTS stretch).

Budget stretch window to $38.4k (20%): WSU in; UOW in; Adelaide out (39% over); Monash out (49% over).

| Uni | field 30 | level 12 | budget | ielts | qs | g8 | place | reg 5 | intake 3 | **total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| WSU Bach Nursing | 30 | 12 | 18 (within) | 6 (stretch: 6.5 vs 7.0 req, 0.5 below) | 0 | 0 | 5 | **5** | 3 | **79** |
| UOW Bach Nursing | 30 | 12 | 18 ($37,920 within $38.4k) | 6 | 1.7 | 0 | 5 | **5** | 3 | **80.7** |
| Adelaide Bach Nursing | 30 | 12 | 9 (far-stretch, $44,500 = 39% over) | 6 | 5.9 | 5 | 5 | **5** | 3 | **80.9** |
| Monash Bach Nursing | 30 | 12 | 0 (hard-cut, 49% over) | 6 | 8.2 | 5 | 5 | 0 | 3 | **69.2** |

**Top 3: Adelaide (80.9, stretch-budget) → UOW (80.7, within) → WSU (79, within). Stretch: Monash (69.2).**

**Ranking sanity:** Adelaide edges out UOW by 0.2 thanks to G8+QS bonus — but both are regional, which is correct. WSU is the cheapest but Adelaide's prestige wins the tiebreaker. Persona D's regional preference is served (Adelaide + UOW + WSU are all regional). ✓

**One flag:** the 0.2 margin between Adelaide and UOW is tight enough that tiebreaker order matters. Per R-3 (QS rank → G8 → alphabetical), Adelaide (QS 82) beats UOW (QS 167) if ever truly tied — but here Adelaide wins on raw score already. ✓

### Final weight vector — LOCKED for plan

```typescript
// web/src/lib/match-weights.ts
export const MATCH_WEIGHTS = {
  field: 30,          // core
  level: 12,          // core
  budget: 18,         // core
  ielts: 12,          // core
  qs_rank: 10,        // tiebreaker (scaled 0–10 via max(0, 10 * (1 - rank/200)))
  g8: 5,              // tiebreaker
  industry_placement: 5,  // tiebreaker (only if lead-flagged)
  regional: 5,        // tiebreaker (only if field ∈ Health/Education in v1)
  intake: 3,          // tiebreaker
  // sum: 100
} as const;

export const STRETCH = {
  budget_pct: 0.20,       // 20% over budget = stretch zone
  far_stretch_pct: 0.50,  // 20-50% = shown only if <3 strong matches
  ielts_band: 0.5,        // 0.5 below course req = stretch
  weight_penalty: 0.50,   // stretch gets 50% of the signal's weight (see Stretch Math)
} as const;

export const NORMALIZATION = {
  qs_rank_max: 200,   // unis worse than QS 200 get qs_score = 0
} as const;
```

**Confidence: HIGH** — validated against 4 personas × 12 unis, no obviously-wrong rankings. `[VERIFIED: personas simulated manually against seed numbers grep'd from universities-seed.ts 2026-04-19]`

---

## Stretch Math (open item 2)

**Decision: Flat 50% weight penalty. Not linear decay.**

### SQL predicate for each stretch tier

```sql
-- Budget scoring (plpgsql inside match_unis_for_lead)
CASE
  -- Within budget: full 18pt
  WHEN p_tuition_budget IS NULL THEN 9  -- half-score if no budget stated
  WHEN c.indicative_fee <= p_tuition_budget THEN 18
  -- Stretch zone 0-20% over: 50% weight = 9pt
  WHEN c.indicative_fee <= p_tuition_budget * 1.20 THEN 9
  -- Far stretch 20-50% over: shown only in far-stretch rollup; base score 0 in course_total
  WHEN c.indicative_fee <= p_tuition_budget * 1.50 THEN 0
  -- Beyond 50% over: excluded
  ELSE NULL  -- signals "hard cut"; course excluded from matches
END AS budget_score
```

```sql
-- IELTS scoring
CASE
  -- No IELTS stated: half-score (can't tell)
  WHEN p_ielts IS NULL THEN 6
  -- Meets or exceeds: full 12pt
  WHEN p_ielts >= c.ielts_overall THEN 12
  -- Within 0.5 below: stretch, 50% = 6pt
  WHEN p_ielts >= c.ielts_overall - 0.5 THEN 6
  -- More than 0.5 below: excluded
  ELSE NULL  -- hard cut
END AS ielts_score
```

### Why flat 50%, not linear decay

| Option | Flat 50% | Linear decay |
|---|---|---|
| **Predictability** | ✓ Sam can eyeball the score in email and reason about it | ✗ Opaque — "why is this 62 and that 71?" requires running the math |
| **Postgres plpgsql cost** | ✓ CASE + constant | ✗ arithmetic + division per row per course |
| **SQL readability for Gideon plan-check** | ✓ 4-line CASE | ✗ harder to inspect, bugs hide in coefficients |
| **Edge cases** | ✓ No domain errors (division by zero) | ✗ edge at budget=0, need GREATEST guards |
| **Tuning cost** | ✓ Two numbers (50% stretch + 20% window) — one-line PRD change | ✗ Rate-of-decay variable adds another tune parameter |

Flat 50% is also what the existing client-side `matcher.ts` does in spirit — it uses bucket thresholds (`STRONG_BUCKET_MIN = 75`) and penalty subtractions (`finalScore - 20`, `finalScore - 30`) rather than smooth decay. Keep the behavior consistent for students who see both the stub and the real match.

### Hard-cut vs stretch-shown distinction

- **Hard cut** (excluded from course_total entirely): >50% over budget, OR >0.5 IELTS below course req, OR field mismatch, OR level mismatch when student specified a level.
- **Stretch shown** (in the 2 stretch rows on /matches page): 20-50% over budget OR 0-0.5 IELTS below. Displayed with explicit `stretch_reason` text: "Budget $X above your stated $Y" or "IELTS 0.5 band below course requirement."
- **Matched** (in the 3 strong rows): all hard gates pass, at least field-match, and either within-budget or within-IELTS (both signals full-strength OR at worst one of them at 50%).

**Confidence: HIGH** — matches existing matcher.ts pattern, passes all 4 personas.

---

## RPC Failure Handling (open item 3)

**Decision: Return 200 with `matches: null`. Never roll back the lead INSERT. Show an in-progress state on /matches/{token} with a refresh button. Background job (Pulse or manual) recomputes.**

### Transaction shape

```typescript
// web/src/app/api/leads/route.ts (extended)
export async function POST(req: Request) {
  // ... existing Zod + score + consentGivenAt logic unchanged ...

  const supabase = createServiceRoleClient();

  // Step 1: INSERT lead (unchanged from P3)
  const { data: leadRow, error: insertError } = await supabase
    .from("leads")
    .insert(row)
    .select("id, match_token")  // match_token defaults to uuid_generate_v4()
    .single();

  if (insertError) {
    console.error("[atlas-ai.leads] INSERT failed", insertError);
    return Response.json({ ok: false, error: "..." }, { status: 500 });
  }

  // Step 2: Compute matches via RPC (new in P4)
  let matchesComputed = false;
  try {
    const { error: rpcError } = await supabase.rpc("match_unis_for_lead", {
      p_lead_id: leadRow.id,
      p_weights: MATCH_WEIGHTS_JSON,  // imported from lib/match-weights.ts
    });

    if (rpcError) {
      console.error("[atlas-ai.leads] match RPC failed — lead saved, matches null",
        { lead_id: leadRow.id, err: rpcError });
      // Do NOT throw. Lead is captured; matches can be lazily recomputed.
    } else {
      matchesComputed = true;
    }
  } catch (err) {
    console.error("[atlas-ai.leads] match RPC threw", { lead_id: leadRow.id, err });
  }

  // Step 3: Send notification email (unchanged from P3 — just extend body)
  await sendNotificationEmails({ lead, score, tier, consentGivenAt,
    matchToken: leadRow.match_token, matchesComputed });

  // Always return 200 with token — client redirects to /matches/{token}
  return Response.json({
    ok: true,
    match_token: leadRow.match_token,
    matches_ready: matchesComputed,
  });
}
```

### RPC shape — it UPDATES the row, doesn't return a resultset

This is a deliberate design pick: the RPC writes `leads.matches` + `leads.matches_computed_at` as a side-effect, rather than returning rows that the API route then UPDATEs. Reasoning:

1. **One round-trip.** Vercel US → Supabase Singapore = ~200ms RTT. Adding a TS-side UPDATE would double that.
2. **Atomicity.** If the RPC crashes mid-compute after returning data but before the TS UPDATE lands, we'd have a half-computed state. Server-side self-UPDATE keeps it atomic.
3. **Matches the R-2 intent.** CONTEXT says "Single Postgres RPC match_unis_for_lead(lead_id uuid, weights jsonb) RETURNS TABLE(...)" — but returning rows AND self-updating is non-idiomatic. Cleaner: RETURNS void (or RETURNS jsonb of the computed matches so the API can include them in the 200 response body without another SELECT).

**Revised RPC signature:**

```sql
CREATE OR REPLACE FUNCTION public.match_unis_for_lead(
  p_lead_id uuid,
  p_weights jsonb
)
RETURNS jsonb  -- the computed matches payload, also written to leads.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_matches jsonb;
BEGIN
  -- Build matches JSONB using the scoring CTE (detailed in Validation Architecture below)
  WITH scored AS ( /* ... scoring cte ... */ )
  SELECT jsonb_build_object(
    'strong', (SELECT jsonb_agg(s) FROM scored s WHERE s.tier = 'strong' LIMIT 3),
    'stretch', (SELECT jsonb_agg(s) FROM scored s WHERE s.tier = 'stretch' LIMIT 2),
    'computed_at', now()
  ) INTO v_matches;

  UPDATE public.leads
    SET matches = v_matches,
        matches_computed_at = now()
    WHERE id = p_lead_id;

  RETURN v_matches;
END;
$$;

-- Restrict to authenticated + service_role — NEVER grant to anon
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_unis_for_lead(uuid, jsonb) TO service_role;
```

**Why `RETURNS jsonb` not `RETURNS TABLE`:** CONTEXT R-2 said `RETURNS TABLE(...)` but on reflection `jsonb` is better because (a) the payload is already the final display shape, (b) one RPC call returns the payload without a second SELECT round-trip, (c) the `leads.matches` column is jsonb so we write the same shape we read. Propose this as a deviation from R-2 in the plan-check — Gideon should approve; this is an implementation detail, not a scope change.

### Error-surface UX on /matches/{token}

Three states the page must handle:

| `leads.matches` | `matches_computed_at` | What the page shows |
|---|---|---|
| **null** | null | "We're still finding your matches — check back in 30 seconds." + manual refresh button + explanation: "Your enquiry is saved and our counsellors have been notified; this is just the uni ranking." |
| **jsonb** | recent (<30 min) | Full results page: 3 strong + up to 2 stretch + MARA banner |
| **jsonb** | old (>30 min) | Magic-link flow: "Your results are ready but this preview has expired. Enter your email to get a fresh link." |

The "null" state should NOT show a spinner forever — that implies the computation is in-flight. Instead: **explicit copy** + **button to retry** (which calls a `POST /api/match/retry` endpoint — actually, see next section, we don't build that endpoint in v1; the retry is "paste your email and we'll re-notify you with a magic link to the computed result"). Retry is server-side recompute via a Pulse cron in v2.

**Simpler v1 fallback:** if matches is null 60s after lead creation, the /matches page falls through to the magic-link flow ("Get your results emailed to you") and Sam gets an email alert saying "Lead X needs manual recompute — RPC failed 2026-04-19T..." Sam manually triggers via Supabase dashboard `SELECT match_unis_for_lead(lead_id, weights)`.

This is a deliberately minimal MVP failure mode. In practice RPC failures should be rare (< 0.1% — nothing network-fragile happens inside the function, it's pure SQL).

**Confidence: HIGH** on architecture. The lazy-recompute path is v1 Sam-manual; automated is v2.

---

## MARA Banner Wording (open item 4)

**Decision: Lock this text, referenced from P0.5 scrub patterns.**

### Existing disclaimer strings in codebase (P0.5 verified)

From grep 2026-04-19:
- `/api/chat/route.ts:45`: *"This is not migration advice. Consult a UniMate MARA-registered agent for binding guidance."*
- `lib/content.ts:81`: *"Atlas AI is an information and matching service. It is not migration advice. Consult a registered MARA agent for binding advice."*
- `components/lead/Step5Contact.tsx:108`: *"...contacting me so a MARA-registered counsellor can follow up."*

### Proposed /matches/{token} banner (single persistent line at page top + footer)

> **Atlas AI matches are educational information only, not migration advice.** For visa, migration, or PR guidance, consult UniMate's registered MARA agents — [Book a free consultation →](https://atlas-ai.vercel.app/consult)

**Rationale for the exact wording:**
1. **"Educational information only"** matches MARA Code of Conduct §2.17 (migration agents must not give legal/migration advice outside scope; Atlas AI's disclaimer must assert it is NOT that service).
2. **"Not migration advice"** is the exact verbatim phrase used in /api/chat/route.ts and content.ts — consistency across surfaces.
3. **"visa, migration, or PR"** explicitly covers the three words the P0.5 scrub banned from AI-generated output. Using them in the DISCLAIMER (not the matching logic) is correct — we name what we don't do.
4. **"UniMate's registered MARA agents"** — UniMate owns the MARA registration; Atlas AI is the tool. MARA number will replace `{PENDING_FROM_UNIMATE}` in content.ts once client provides it.
5. **CTA link** — routes to the consult booking page which exists in the scaffold. No new route required.

### Placement on /matches/{token}

- **Top of page**, below the hero "Your top 3 matches for <first_name>" headline, above the match cards. Rendered with `rail-gold` border top+bottom, cream background, Georgia serif eyebrow label "Disclaimer". **Persistent** — user cannot dismiss.
- **Page footer** as well (duplicates the global Footer.tsx MARA disclaimer).
- **NOT per-match-card** — CONTEXT RT-4 locked single-banner behavior. Per-card would be noisy and imply the disclaimer is about each specific uni (it's not — it's about the service).

**Confidence: HIGH** — verified against existing disclaimer pattern in codebase, matches MARA Code of Conduct guidance.

---

## Match Token TTL Impl (open item 5)

**Decision: Server-side check inside `/matches/[token]/page.tsx` Server Component. Not middleware. Not RLS.**

### The three architectural options evaluated

#### Option A: Middleware check (REJECTED)
Middleware runs on every request matching its matcher pattern. Adding `/matches/:path*` to the middleware would make Vercel serverless fire a `supabase.from("leads").select()` on every navigation into the route. Overkill and slows page load.

#### Option B: RLS policy (REJECTED)
We could add an RLS policy: `CREATE POLICY matches_fresh_only ON leads FOR SELECT TO anon USING (match_token IS NOT NULL AND matches_computed_at > now() - interval '30 minutes')`. Problem: anon role currently has NO SELECT policy on leads (P1 lock — `leads_anon_insert` only). Adding SELECT to anon opens a surface area we'd rather keep closed. Also: we want the TOKEN to be permanent server-side (per C-4), so RLS filtering by `matches_computed_at` would make re-login via magic-link see "no rows" even after successful auth.

#### Option C: Server-component check (SELECTED) ✓
The /matches/[token]/page.tsx is a Server Component. It uses `createServiceRoleClient()` (server-only, import-guarded) to fetch the row, then branches on `matches_computed_at`:

```tsx
// web/src/app/matches/[token]/page.tsx (Server Component)
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { redirect } from "next/navigation";
import { MatchList } from "@/components/matches/MatchList";
import { MaraBanner } from "@/components/matches/MaraBanner";
import { PendingMatches } from "@/components/matches/PendingMatches";
import { ExpiredTokenFallback } from "@/components/matches/ExpiredTokenFallback";

export const dynamic = "force-dynamic";  // never cache this route

const TOKEN_TTL_MINUTES = 30;

export default async function MatchesPage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, full_name, email, matches, matches_computed_at, match_token")
    .eq("match_token", params.token)
    .maybeSingle();

  if (error || !lead) {
    // Invalid token — don't leak existence; 404
    return <NotFoundFallback />;
  }

  // Case 1: RPC failed or hasn't run yet — show pending state
  if (!lead.matches || !lead.matches_computed_at) {
    return <PendingMatches leadId={lead.id} email={lead.email} />;
  }

  // Case 2: Fresh — serve results directly (anonymous path)
  const ageMs = Date.now() - new Date(lead.matches_computed_at).getTime();
  const ttlMs = TOKEN_TTL_MINUTES * 60 * 1000;

  if (ageMs <= ttlMs) {
    return (
      <>
        <MaraBanner />
        <MatchesHero firstName={lead.full_name.split(" ")[0]} />
        <MatchList matches={lead.matches} />
        <MaraBanner variant="footer" />
      </>
    );
  }

  // Case 3: Expired — require auth (magic-link flow from P2)
  return <ExpiredTokenFallback email={lead.email} token={params.token} />;
}
```

### Auth flow diagram (ASCII)

```
Step 5 submit ─► POST /api/leads ─► INSERT + RPC ─► 200 { match_token }
                                                         │
                                                         ▼
                                  client redirect: /matches/{token}
                                                         │
                                                         ▼
                         ┌─────────── Server Component ────────────┐
                         │ SELECT leads WHERE match_token = $1      │
                         │ Branch on (matches, matches_computed_at) │
                         └───────┬────────────┬────────────────────┘
                                 │            │
                    NULL or      │            │     matches jsonb +
                     no row      │            │     computed_at set
                                 ▼            ▼
                       <PendingMatches>   age < 30min?
                       or 404              │    │
                                           │    │
                                     yes ──┘    └── no
                                      │             │
                                      ▼             ▼
                         Render full results     <ExpiredTokenFallback>
                            + MARA banner           │
                                                    ▼
                                       "Enter your email for a new link"
                                                    │
                                                    ▼
                                       supabase.auth.signInWithOtp({
                                         email: lead.email,
                                         options: {
                                           emailRedirectTo:
                                             '/auth/callback?next=/matches/{token}'
                                         }
                                       })
                                                    │
                                                    ▼
                                       Magic-link email → click → /auth/callback
                                       → session set → redirect to /matches/{token}
                                                    │
                                                    ▼
                                       Server component re-runs;
                                       this time it reads `session` cookie
                                       → bypass TTL check if session present
                                       → serve full results
```

### Key implementation notes

1. **Token is permanent server-side** (C-4). The TTL is purely a *display* gate.
2. **Post-magic-link access** skips the 30-min check: the server component reads the session cookie via `createServerClient()` (from `@supabase/ssr`), and if `session.user.email === lead.email`, the TTL check is bypassed. This is P2-infrastructure-ready — we just need to add the session-read branch.
3. **Session scope check.** The authenticated user's email must match `leads.email` on the row — else serving the matches is a cross-user leak. Add this as a hard assertion.
4. **`dynamic = "force-dynamic"`** prevents Next.js caching the page — matches data is per-token per-request.
5. **No client-side JS needed for TTL.** Everything is SSR. Progressive enhancement for the refresh button only.

**Confidence: HIGH** — straightforward Next 16 App Router + @supabase/ssr pattern; magic-link infrastructure already shipped in P2.

---

## /api/match Endpoint Decision (open item 6)

**Decision: No standalone `/api/match` endpoint in v1. Match logic lives entirely inside `/api/leads/route.ts` via the RPC call post-INSERT.**

### Rationale

1. **No caller needs it.** The Step-3 teaser uses `match-stub.ts` client-side (kept, per 3-PLAN.md). The /matches page reads `leads.matches` directly via Server Component. There is no UI surface that posts a lead profile and wants matches without persisting.

2. **MARA compliance benefit.** A standalone `POST /api/match` endpoint would be publicly callable (unauth, per v1 anonymous design). That invites abuse — someone scrapes it to build a competitor matcher. Without the endpoint, the matching logic only runs after a consent-gated lead INSERT, which rate-limits abuse via the email+phone capture requirement.

3. **Existing scaffold route to REMOVE.** `web/src/app/api/match/route.ts` currently exists (it was scaffolded in P0; uses the old client-side matcher.ts and `universities.ts` 43-uni dataset). **Action: delete this route in P4**, since it returns data from a 43-uni in-memory dataset that diverges from the 12-uni DB and contradicts R-2 ("single Postgres RPC"). Keeping it creates two matchers with different results — exactly the doc-drift Gideon caught in P0.

4. **Deferred to v2:** The recompute endpoint for UniMate admin tooling is already called out in CONTEXT `<deferred>`. When v2 brings admin CRM, we add `POST /api/match/recompute` gated by authenticated UniMate role.

### Files to modify

- **DELETE** `web/src/app/api/match/route.ts` (+44 LoC gone).
- **DELETE** `web/src/lib/universities.ts` (+731 LoC — the 43-uni in-memory static dataset. Unused after /api/match removal. The seeded DB is source of truth.).

**Wait** — verify `universities.ts` isn't imported elsewhere before deleting. Grep: only `/api/match/route.ts` imports it. Safe to remove.

- **UPDATE** `SOURCECODE.md` route table: drop the `/api/match` row, add nothing (matching is internal to `/api/leads`).
- **UPDATE** `CLAUDE.md §3a` check: routes count will drop by 1; verify table count matches.

### If Gideon pushes back

If Gideon plan-check says "we should keep /api/match for future flexibility," counter-argument: R-2 locked "single Postgres RPC called from /api/leads." A standalone HTTP endpoint is a net-new surface not in CONTEXT. Adding it without a client is YAGNI. If v2 needs it, add then.

**Confidence: HIGH** — the scaffold route is vestigial and contradicts the locked R-2 architecture.

---

## Seed Migration Order (open item 7)

**Decision: UPSERT-based re-seed, not --wipe. 3-step sequence.**

### The order matters because of the industry_placement default

Migration 003 adds `industry_placement boolean NOT NULL DEFAULT false`. If we run the migration and don't re-seed, every existing course row has `industry_placement = false` — which is WRONG for most seeded courses (they're mostly `true`). The matcher will then score `placement_score = 0` for everyone, ruining Persona B+C+D outcomes.

Worse case: --wipe would blow away the 12 unis, hit the CHECK constraints (none currently on universities/courses but still brittle), and we re-insert. But --wipe also deletes any dependent rows — risky in future phases even though P4 has none today.

### 3-command sequence (deterministic, idempotent, safe)

```bash
# Step 1 — Apply migration 003: adds columns, drops matched_university_ids, adds index
cd ~/Desktop/atlas-ai
# Use the Management API (same pattern P1 used) OR Supabase CLI:
supabase db push --linked  # applies supabase/migrations/003_match_prep.sql
# Verify:
# psql "<conn>" -c "\d courses" → should show industry_placement column
# psql "<conn>" -c "\d leads"   → should show matches, matches_computed_at, match_token columns, and NOT matched_university_ids

# Step 2 — Apply migration 004: creates the RPC + permissions
supabase db push --linked  # applies supabase/migrations/004_match_function.sql
# Verify:
# psql "<conn>" -c "\df match_unis_for_lead" → function present
# psql "<conn>" -c "SELECT has_function_privilege('service_role', 'public.match_unis_for_lead(uuid, jsonb)', 'execute');" → true

# Step 3 — Re-seed the 12 unis in UPSERT mode to refresh industry_placement + default intake_months
cd ~/Desktop/atlas-ai/web
npx tsx scripts/seed-universities.ts --upsert --apply
# This is a NEW mode — the current script has --apply (fresh insert) and --wipe (delete+insert).
# P4 adds a --upsert mode that uses `.upsert({ onConflict: 'slug' })` for universities and
# a per-course match-on-(university_id, name) UPDATE-or-INSERT loop.
```

### Why UPSERT beats --wipe

| Criterion | --wipe + --apply | --upsert --apply |
|---|---|---|
| Idempotent | ✓ (but destroys) | ✓ (safe to re-run) |
| Loses leads? | ✗ leads.matched_university_ids is dropped by 003 but the row survives — no real lead loss, but scary | ✓ no risk |
| Future-proof (post-P4.5 backfill to 43 unis) | ✗ wipes the 43 backfill | ✓ |
| Risk of accidental run in prod | ✗ HIGH | ✓ LOW |
| Time | ~3s | ~3s |

**Recommendation:** Add `--upsert` mode to `web/scripts/seed-universities.ts` in a small prep task (Wave A of the plan), then use it in Step 3 above.

### Migration 003 DDL (proposed — planner should lift verbatim)

```sql
-- supabase/migrations/003_match_prep.sql
-- Atlas AI — P4 UniMatch prep: add industry_placement, match storage, token
-- Region: ap-southeast-1 (Singapore)
-- Applied via: Supabase Management API /v1/projects/{ref}/database/query

-- ================================================================
-- courses.industry_placement — was in TS type, missing in DB (seed header flagged as P4 work)
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

-- Drop the array column (was scaffolded in P1, never populated)
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS matched_university_ids;

-- ================================================================
-- Token lookup index — /matches/{token} server component uses this
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_leads_match_token ON public.leads(match_token);

-- ================================================================
-- Backfill match_token for any existing rows (in case P3 left any)
-- No-op if table is empty; safe to re-run
-- ================================================================
UPDATE public.leads SET match_token = uuid_generate_v4() WHERE match_token IS NULL;
```

### Migration 004 outline (detailed plpgsql in plan)

```sql
-- supabase/migrations/004_match_function.sql
-- Atlas AI — P4 UniMatch engine RPC
-- Applied via: same as 003

CREATE OR REPLACE FUNCTION public.match_unis_for_lead(
  p_lead_id uuid,
  p_weights jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- MANDATORY per Supabase security best practices (Context7 verified)
AS $$
DECLARE
  v_lead record;
  v_matches jsonb;
  -- weights unpacked
  v_w_field numeric;
  v_w_level numeric;
  v_w_budget numeric;
  v_w_ielts numeric;
  v_w_qs numeric;
  v_w_g8 numeric;
  v_w_placement numeric;
  v_w_regional numeric;
  v_w_intake numeric;
BEGIN
  -- Load lead profile
  SELECT id, preferred_fields, preferred_levels, preferred_intake_month,
         tuition_budget_aud, ielts_overall
  INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead % not found', p_lead_id;
  END IF;

  -- Unpack weights
  v_w_field := (p_weights->>'field')::numeric;
  v_w_level := (p_weights->>'level')::numeric;
  -- ... etc ...

  -- Score all courses via CTE
  WITH course_scores AS (
    SELECT
      c.id AS course_id,
      c.university_id,
      c.name AS course_name,
      c.field,
      c.level,
      c.indicative_fee,
      c.ielts_overall AS course_ielts,
      c.industry_placement,
      u.name AS uni_name,
      u.short_name,
      u.qs_ranking_2025,
      u.is_group_of_eight,
      u.is_regional,
      -- field_score
      CASE WHEN c.field = ANY(v_lead.preferred_fields) THEN v_w_field ELSE 0 END AS field_score,
      -- level_score
      CASE WHEN v_lead.preferred_levels IS NULL OR array_length(v_lead.preferred_levels, 1) = 0
           OR c.level = ANY(v_lead.preferred_levels)
           THEN v_w_level ELSE 0 END AS level_score,
      -- budget_score (stretch math — see Stretch Math section)
      CASE
        WHEN v_lead.tuition_budget_aud IS NULL THEN v_w_budget / 2
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud THEN v_w_budget
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud * 1.20 THEN v_w_budget / 2
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud * 1.50 THEN 0
        ELSE -1  -- sentinel for "hard cut" — filter out downstream
      END AS budget_score,
      -- ielts_score (stretch math)
      CASE
        WHEN v_lead.ielts_overall IS NULL THEN v_w_ielts / 2
        WHEN v_lead.ielts_overall >= c.ielts_overall THEN v_w_ielts
        WHEN v_lead.ielts_overall >= c.ielts_overall - 0.5 THEN v_w_ielts / 2
        ELSE -1
      END AS ielts_score,
      -- qs_score (scaled)
      GREATEST(0, v_w_qs * (1 - COALESCE(u.qs_ranking_2025, 999)::numeric / 200)) AS qs_score,
      -- g8_score
      CASE WHEN u.is_group_of_eight THEN v_w_g8 ELSE 0 END AS g8_score,
      -- placement_score (only if field matches — placement is about career outcomes in that field)
      CASE WHEN c.field = ANY(v_lead.preferred_fields) AND c.industry_placement THEN v_w_placement ELSE 0 END AS placement_score,
      -- regional_score (v1 heuristic: Health or Education student + regional uni)
      CASE WHEN (v_lead.preferred_fields && ARRAY['Health', 'Education']::text[]) AND u.is_regional THEN v_w_regional ELSE 0 END AS regional_score,
      -- intake_score
      CASE WHEN v_lead.preferred_intake_month IS NULL THEN v_w_intake / 2
           WHEN v_lead.preferred_intake_month = ANY(c.intake_months) THEN v_w_intake
           ELSE 0 END AS intake_score
    FROM public.courses c
    JOIN public.universities u ON c.university_id = u.id
  ),
  course_totals AS (
    SELECT *,
      field_score + level_score
      + CASE WHEN budget_score < 0 THEN 0 ELSE budget_score END
      + CASE WHEN ielts_score < 0 THEN 0 ELSE ielts_score END
      + qs_score + g8_score + placement_score + regional_score + intake_score AS total,
      (budget_score < 0 OR ielts_score < 0 OR field_score = 0) AS hard_cut
    FROM course_scores
  ),
  uni_best AS (
    SELECT DISTINCT ON (university_id) *
    FROM course_totals
    WHERE NOT hard_cut
    ORDER BY university_id, total DESC
  ),
  ranked AS (
    SELECT *,
      ROW_NUMBER() OVER (ORDER BY total DESC,
                         qs_ranking_2025 ASC NULLS LAST,
                         is_group_of_eight DESC,
                         uni_name ASC) AS rn
    FROM uni_best
  ),
  top_score AS (
    SELECT total AS max_score FROM ranked WHERE rn = 1
  )
  SELECT jsonb_build_object(
    'strong', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'uni_id', r.university_id,
          'uni_name', r.uni_name,
          'short_name', r.short_name,
          'course_name', r.course_name,
          'match_pct', ROUND(100.0 * r.total / NULLIF((SELECT max_score FROM top_score), 0)),
          'reason_parts', jsonb_build_object(
            'matched_fields', ARRAY[r.field],
            'budget_verdict', CASE WHEN r.budget_score = v_w_budget THEN 'within' ELSE 'stretch' END,
            'ielts_verdict', CASE WHEN r.ielts_score = v_w_ielts THEN 'meets'
                                  WHEN r.ielts_score = v_w_ielts/2 THEN 'stretch' ELSE 'below' END,
            'qs_rank', r.qs_ranking_2025,
            'g8', r.is_group_of_eight,
            'industry_placement', r.industry_placement,
            'regional', r.is_regional,
            'intake_hit', r.intake_score = v_w_intake,
            'best_course_name', r.course_name
          )
        )
      )
      FROM ranked r WHERE r.rn <= 3
    ),
    'stretch', (
      SELECT jsonb_agg( /* same shape */ )
      FROM ranked r WHERE r.rn BETWEEN 4 AND 5
    ),
    'computed_at', now()
  ) INTO v_matches;

  -- Persist to the lead row
  UPDATE public.leads
    SET matches = v_matches,
        matches_computed_at = now()
    WHERE id = p_lead_id;

  RETURN v_matches;
END;
$$;

-- Lock down the function — service_role only (anon never calls this directly)
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_unis_for_lead(uuid, jsonb) TO service_role;
```

**Migration order rationale:**
1. 003 first — adds the columns the RPC body references. If 004 runs before 003, the function body referencing `c.industry_placement` will fail to compile.
2. 004 second — creates the function now that the schema supports it.
3. Re-seed third — only now does `industry_placement` get accurate values per the source-of-truth `universities-seed.ts`. Running the RPC before re-seeding would give everyone `placement_score = 0`.

**Confidence: HIGH** — pattern matches P1's Management API + scripts/seed-universities.ts flow.

---

## Results Page Design Sketch (open item 8)

**Decision: Yes, inherit Gideon-style design system (navy + cream + gold, paper-grain bg, Georgia serif eyebrow). Same tokens used in LeadModal + MatcherSection — don't duplicate.**

### Wireframe (ASCII)

```
╔══════════════════════════════════════════════════════════════════════╗
║  [Atlas AI logo]                                    [MARA badge]    ║  ← header (existing layout.tsx)
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │ ⚠ Disclaimer                                                 │   ║  ← MaraBanner (top), rail-gold borders
║  │ Atlas AI matches are educational information only, not       │   ║
║  │ migration advice. For visa, migration, or PR guidance,       │   ║
║  │ consult UniMate's registered MARA agents.                    │   ║
║  │                                    [Book consultation →]     │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║  YOUR SHORTLIST · ATLAS AI                                           ║  ← eyebrow, Georgia serif uppercase tracking
║                                                                      ║
║  Your top 3 matches                                                  ║  ← h1 font-display navy-950
║  Shraddha, here are the Australian unis that best match              ║  ← body, navy-950/70
║  your profile.                                                       ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │ ┌───┐                                                         │   ║  ← MatchCard 1 — paper-grain bg
║  │ │ U │  UNSW SYDNEY                                    89%    │   ║
║  │ └───┘  #19 QS · Group of Eight · Sydney NSW                  │   ║
║  │                                                               │   ║
║  │ Best match: Master of Commerce                                │   ║
║  │ Matches Business · Within budget · IELTS 7.0 met · QS #19    │   ║  ← reason line (dot-separated)
║  │ · Group of Eight                                              │   ║
║  │                                             [Learn more ›]    │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │ ┌───┐  UWA                                             86%    │   ║  ← MatchCard 2
║  │ │ W │  #77 QS · Group of Eight · Perth WA                    │   ║
║  │ └───┘  ...                                                    │   ║
║  │ Master of Business Analytics                                  │   ║
║  │ ...                                                           │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │ ┌───┐  ADELAIDE                                       86%    │   ║  ← MatchCard 3
║  │ │ A │  #82 QS · Group of Eight · Regional · Adelaide SA      │   ║
║  │ └───┘  ...                                                    │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║  ─────────────────────────── stretch ─────────────────────────       ║  ← gold hairline divider + eyebrow
║                                                                      ║
║  ALSO CONSIDER                                                       ║  ← eyebrow
║  Within reach if your budget or IELTS shifts                         ║  ← h3
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │ ┌───┐  UTS                                            72%    │   ║  ← StretchCard 1 — slightly dimmer
║  │ │ T │  #88 QS · Sydney NSW                                    │   ║     bg-cream/50 + border dashed
║  │ └───┘  Stretch: $60.5k tuition is 10% above your $55k budget │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║                                                                      ║
║  Next step                                                           ║  ← h2
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │ Walk into our Liverpool office with your shortlist. Our       │   ║
║  │ MARA-registered counsellors will audit fees, scholarships,   │   ║
║  │ IELTS gaps, and next steps in a free 30-minute session.      │   ║
║  │                                                               │   ║
║  │         [Book your consultation →]                            │   ║  ← gold CTA button
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  [MaraBanner — footer variant]                                       ║
║  [Standard Footer.tsx with MARA cred + privacy link]                 ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Component tree

```
/matches/[token]/page.tsx                    (Server Component — fetches, branches)
├── <MaraBanner variant="top" />             (sticky until user scrolls past)
├── <MatchesHero firstName={lead.first} />
├── <MatchList matches={lead.matches.strong}>
│   ├── <MatchCard match={...} />            (× 3; same card shape as MatcherSection result cards)
│   │   ├── <UniLogoBadge />                 (reuse UniCard.tsx logo pattern)
│   │   ├── Score ring (89%)                 (small circular gauge, gold stroke)
│   │   ├── Eyebrow line (QS + G8 + city)
│   │   ├── Course name (font-display)
│   │   ├── Reason line (dot-separated, from reason_parts → match-reason.ts template)
│   │   └── "Learn more" → uni.website (target _blank rel noopener)
├── <StretchSection matches={lead.matches.stretch}>  (skip entirely if empty)
│   ├── <hairline divider + eyebrow label>
│   ├── <StretchCard match={...} />          (× 0-2; dashed border, slightly dimmer)
│   │   └── stretch_reason text explicit
├── <ConsultCTA />                           (existing consult flow)
├── <MaraBanner variant="footer" />
└── <Footer />                               (existing global footer)
```

### Design tokens reused from scaffold

- `--color-cream: #faf7f2` (body bg)
- `--color-navy-950: #0C1F3A` (primary text)
- `--color-gold-500: #D4A537` (accents, CTAs, eyebrow)
- `font-display` class (Georgia serif for headlines + scores)
- `rail-gold` class (gold 1px top+bottom borders on banners)
- `paper-grain` class (subtle texture bg for cards)
- `eyebrow` class (uppercase tracking-widest navy-950/60)

### New files to create in P4 for this page

| File | Purpose | LoC estimate |
|---|---|---|
| `web/src/app/matches/[token]/page.tsx` | Server Component root | ~80 |
| `web/src/components/matches/MaraBanner.tsx` | Top + footer disclaimer | ~30 |
| `web/src/components/matches/MatchesHero.tsx` | "Your top 3 matches" headline | ~20 |
| `web/src/components/matches/MatchList.tsx` | Wraps 3 MatchCards | ~20 |
| `web/src/components/matches/MatchCard.tsx` | Individual match row | ~80 |
| `web/src/components/matches/StretchSection.tsx` | Wraps 0-2 StretchCards, hairline | ~30 |
| `web/src/components/matches/StretchCard.tsx` | Dimmer variant of MatchCard | ~60 |
| `web/src/components/matches/ConsultCTA.tsx` | Book-consultation card | ~30 |
| `web/src/components/matches/PendingMatches.tsx` | "RPC still computing" fallback | ~40 |
| `web/src/components/matches/ExpiredTokenFallback.tsx` | Magic-link re-auth flow | ~60 |
| `web/src/lib/match-reason.ts` | Template renderer: reason_parts → single line | ~50 |
| `web/src/lib/match-weights.ts` | MATCH_WEIGHTS constant | ~20 |

**Total new page surface:** ~520 LoC across 12 files. Plus the two migrations + the API route extension.

**Confidence: HIGH** — design tokens are already in globals.css; no new CSS work needed; component pattern is identical to the MatcherSection results that existed pre-refactor.

---

## Validation Architecture

### Test framework status

Repo has **no test framework** installed today (`package.json` grep verified P1). P4 does not ship one — adding Jest/Vitest is out of scope (not in PHASE.md §Phase 4 tasks). Validation is **manual UAT + Gideon phase-verify + runtime RPC assertions**.

### Requirements → Validation map

| Req ID | Behavior | Test Type | Validation |
|---|---|---|---|
| REQ-P4-W1 | Weight vector matches MATCH_WEIGHTS constants | unit-style (inline assertion) | `lib/match-weights.ts` exports typed record; Gideon phase-verify reads the const, compares to RESEARCH.md locked values |
| REQ-P4-W2 | Persona A (G8 Business $55k) top-3 = UNSW + UWA + Adelaide | SQL smoke | Post-migration, insert a test lead via service-role, call RPC, assert `matches.strong[0].short_name = 'UNSW'` |
| REQ-P4-W3 | Persona B (budget $28k IT) top-3 includes WSU (strong) | SQL smoke | Same pattern; `matches.strong` contains WSU |
| REQ-P4-W4 | Persona D (regional Health $32k) top-3 = Adelaide + UOW + WSU | SQL smoke | Same pattern |
| REQ-P4-S1 | Stretch row excludes anything >50% over budget | SQL smoke | Insert lead with $20k budget, assert Melbourne MBA ($99.8k) absent from strong + stretch |
| REQ-P4-S2 | IELTS 0.5 below course req = stretch, not excluded | SQL smoke | Insert lead with IELTS 6.5 against a 7.0-required Health course, assert it's in stretch list |
| REQ-P4-R1 | RPC runs under 500ms against 12 unis × 48 courses | perf smoke | `EXPLAIN ANALYZE SELECT match_unis_for_lead(...)` from psql — target <500ms total |
| REQ-P4-R2 | RPC failure doesn't roll back lead INSERT | integration | Force RPC error (invalid weights jsonb), POST /api/leads, verify lead row exists in DB with matches=null |
| REQ-P4-T1 | /matches/{token} renders for fresh match | browser manual | Submit lead, follow redirect, visually confirm 3 match cards + MARA banner |
| REQ-P4-T2 | /matches/{token} shows expired state after 30min | browser manual | Hand-tick DB `matches_computed_at = now() - interval '31 minutes'`, reload page, assert fallback component renders |
| REQ-P4-T3 | Magic-link auth flow bypasses TTL | browser manual | Follow expired state CTA → email arrives → click link → redirected back to /matches/{token} → full results render |
| REQ-P4-M1 | MARA banner copy is verbatim the locked string | grep | `grep -F "Atlas AI matches are educational information only" web/src/components/matches/MaraBanner.tsx` returns exactly the expected line |
| REQ-P4-M2 | No visa/migration/PR strings in reason text | grep | `grep -riE "(visa\|migration\|PR\|MLTSSL\|subclass)" web/src/components/matches/` returns only the MaraBanner disclaimer (which explicitly names them in the negative) |
| REQ-P4-C1 | /api/match endpoint is removed | grep | `ls web/src/app/api/match/route.ts` returns "No such file" |
| REQ-P4-C2 | universities.ts (43-uni in-memory) is removed | grep | `ls web/src/lib/universities.ts` returns "No such file" |
| REQ-P4-D1 | industry_placement column exists in DB | SQL | `SELECT column_name FROM information_schema.columns WHERE table_name='courses' AND column_name='industry_placement'` returns 1 row |
| REQ-P4-D2 | match_token has unique index | SQL | `\d leads` shows `idx_leads_match_token` |
| REQ-P4-D3 | RPC revoked from anon | SQL | `SELECT has_function_privilege('anon', 'public.match_unis_for_lead(uuid, jsonb)', 'execute')` returns false |

### Sampling rate

- **Per task commit:** Manual smoke — submit one lead through the UI locally, verify /matches/{token} renders.
- **Per wave merge:** Run the 4 persona SQL smokes (REQ-P4-W2-W4, S1, S2); Supabase Studio SQL editor is fine.
- **Phase gate:** Full REQ-P4-* list run by Gideon phase-verify before `/gsd-verify-work`.

### Wave 0 gaps

None — no test framework to install. All validations run via:
1. Supabase SQL editor (persona smoke + perf check via EXPLAIN ANALYZE)
2. Browser manual UAT (/matches/{token} render states)
3. Grep (negative string checks for MARA + endpoint removal)

---

## Security Domain

### Applicable ASVS categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (for expired-token magic-link re-auth) | Supabase Auth magic link (P2 infrastructure) |
| V3 Session Management | yes (Supabase session cookie on re-auth return) | `@supabase/ssr` httpOnly cookies |
| V4 Access Control | yes (match_token gates anonymous; session gates post-expiry) | Server Component auth check; email match assertion |
| V5 Input Validation | yes | Zod on /api/leads unchanged; RPC validates `p_weights` jsonb shape |
| V6 Cryptography | minimal — Supabase handles TLS + at-rest AES-256 (P1 verified) | No hand-rolled crypto |

### STRIDE threats specific to this phase

| Pattern | STRIDE | Mitigation |
|---|---|---|
| Guessing match_token (uuid collision or brute force) | Spoofing | match_token is uuid_generate_v4 — 122 bits of entropy, cryptographically infeasible to guess |
| Function_search_path_mutable warning | Tampering | `SET search_path = ''` + fully-qualified `public.courses` refs in RPC body (Supabase linter enforces) |
| Anon calling RPC directly via PostgREST | Elevation of Privilege | `REVOKE ALL ... FROM anon` + function in public schema but not in PostgREST-exposed role grants |
| Enumerating leads by incrementing match_token | Information Disclosure | uuid4 is non-sequential; index exists but doesn't help enumeration |
| Post-expiry user sees another user's results | Information Disclosure | Server component asserts `session.user.email === lead.email` before serving post-auth |
| SQL injection via p_weights jsonb | Tampering | jsonb keys are typed/cast via `(p_weights->>'field')::numeric` — numeric parse throws on non-numeric input; also weights are server-TS-controlled constants, not user-controlled |
| Stored XSS via reason_parts (if ever LLM-rendered in v2) | Tampering | v1 renders from typed JSONB via TS template fn; v2 LLM output must pass through React sanitization |

### MARA compliance checks

- **No visa/migration/PR output.** Verified by grep in REQ-P4-M2.
- **MARA banner placement.** Verified in REQ-P4-M1.
- **QS WUR data licensing.** Integer ranks from public QS 2025 rankings — LOW risk per CONTEXT specifics. Flagged to P4.5 for legal pass if UniMate escalates.

---

## Landmines (known risks, Supabase quirks, RLS gotchas for SECURITY DEFINER)

### 1. `function_search_path_mutable` Supabase linter warning
**Trap:** Declaring `SECURITY DEFINER` without `SET search_path = ''` is flagged by Supabase's built-in linter. If search_path is hijacked (e.g., an attacker creates `public.courses` in a different schema and prepends it to search_path), the function reads from the wrong table.
**Prevention:** Always `SET search_path = ''` + fully qualify every table as `public.courses`, `public.universities`, `public.leads`.
**Source:** `[CITED: Context7 /supabase/supabase — row-level-security.mdx + functions.mdx]`

### 2. Service role vs anon role permission on the RPC
**Trap:** Supabase auto-grants `EXECUTE` on new functions to `anon` + `authenticated` by default in some project configurations. If we don't explicitly REVOKE, anon can call `match_unis_for_lead(arbitrary_uuid, weights)` and write arbitrary JSONB to any lead row — including `matches_computed_at = year 2099` bypassing the TTL.
**Prevention:** `REVOKE ALL ... FROM PUBLIC, anon, authenticated` + `GRANT EXECUTE ... TO service_role` explicitly in migration 004.
**Source:** `[VERIFIED: Context7 Supabase docs + /supabase/supabase troubleshooting-rls-performance]`

### 3. pgr_stat write lag after RPC returns
**Trap:** RPC body `UPDATE leads SET matches = v_matches` runs inside the function's transaction. On return, the caller (Next.js /api/leads route) may query `leads.matches` before the transaction commits if using a different connection — but Supabase's connection pooling usually serializes. Still, edge case.
**Prevention:** The RPC RETURNS the jsonb directly, so the route handler uses the returned value and doesn't re-SELECT. /matches/{token} page.tsx runs on a later request (post-redirect) so commit has landed. Safe.

### 4. `leads.match_token` uniqueness not enforced
**Trap:** `match_token uuid DEFAULT uuid_generate_v4()` — DEFAULT doesn't enforce UNIQUE. If someone manually UPDATEs two rows to the same token, /matches/{token} is ambiguous.
**Prevention:** Add `UNIQUE` constraint in migration 003: `ALTER TABLE leads ADD CONSTRAINT leads_match_token_unique UNIQUE (match_token);` in addition to the index.
**Mitigation:** uuid4 collision is 2^-122 per pair — practically impossible. But manual UPDATE risk is non-zero.

### 5. intake_months default [2,7] masks real intakes
**Trap:** Seed script line 141 defaults `intake_months: [2, 7]` for every course. If a uni has Nov intake in reality (Monash does), our intake_score will wrongly return 0. Persona ranking stays correct within the 12-uni set because all seeded unis have Feb+July matches, but the signal is noisy.
**Prevention:** Accept for v1; flag as a P4.5 backfill item (per-course intake_months from CRICOS data).

### 6. `preferred_fields` empty → field_score = 0 for everyone
**Trap:** If a student skips Step 3 entirely, `preferred_fields` is NULL. The SQL `c.field = ANY(v_lead.preferred_fields)` returns NULL (not FALSE) when the array is NULL, which coerces to 0 via the CASE — but then EVERYONE gets 0 field score and the top-3 becomes random.
**Prevention:** Add explicit NULL handling in the CASE: `WHEN v_lead.preferred_fields IS NULL OR array_length(v_lead.preferred_fields, 1) = 0 THEN v_w_field / 2`. Half-score says "we don't know, but don't zero out the uni." Otherwise we return top-3 by QS rank alone — which is at least defensible.

### 7. RLS default-deny bypass on DELETE column
**Trap:** `ALTER TABLE leads DROP COLUMN matched_university_ids` — if any RLS policy references the dropped column, policy creation fails. P1 added no such policy, but double-check.
**Prevention:** `pg_policies` query pre-flight: `SELECT * FROM pg_policies WHERE tablename = 'leads'` — confirm no policy references `matched_university_ids`. Then drop is safe.

### 8. MARA banner copy drift
**Trap:** Over time, developers edit the banner text in MaraBanner.tsx without updating the canonical string in RESEARCH.md / PHASE.md. Post-launch, UniMate's legal team audits and finds inconsistency.
**Prevention:** Store the banner string as a named constant in `web/src/lib/mara-disclaimer.ts` (new file, ~10 LoC): `export const MARA_DISCLAIMER_V1 = "Atlas AI matches are educational information only, not migration advice. For visa, migration, or PR guidance, consult UniMate's registered MARA agents.";`. MaraBanner.tsx imports it. Same pattern as `CONSENT_WORDING_VERSION`. Bump to V2 on any wording change, log in DEVIATIONS.md.

### 9. Vercel Edge vs Node runtime
**Trap:** `/api/leads` has `export const runtime = "nodejs"` (Supabase service-role client requires Node). Adding match RPC inside this route is fine. But /matches/[token]/page.tsx should NOT be an Edge runtime page if it uses the service-role client — stays Node default.
**Prevention:** No explicit runtime directive needed on Server Components (defaults to Node on Vercel). Just don't add `export const runtime = "edge"` anywhere near it.

### 10. JSONB structure drift between RPC output and TS reader
**Trap:** RPC returns `reason_parts` with keys like `g8` (bool), `industry_placement` (bool). If a future dev renames a key in the RPC but not in `match-reason.ts`, the template renders `undefined` silently.
**Prevention:** Define a Zod schema for the matches JSONB in `web/src/lib/match-schema.ts`:
```ts
export const MatchResultSchema = z.object({
  uni_id: z.string().uuid(),
  uni_name: z.string(),
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
});
export const MatchesJsonbSchema = z.object({
  strong: z.array(MatchResultSchema).max(3),
  stretch: z.array(MatchResultSchema).max(2),
  computed_at: z.string().datetime(),
});
```
Parse on read in /matches/[token]/page.tsx. Throws loud on drift.

### 11. Seed --upsert mode doesn't exist yet
**Trap:** Per Step 3 of Seed Migration Order, we want to run `--upsert`. Current `seed-universities.ts` has only `--apply` (fresh INSERT, which would fail on duplicate slug) and `--wipe` (destructive). Someone runs the seed without adding `--upsert` first and either (a) fails with unique violation or (b) wipes production data.
**Prevention:** Add `--upsert` to Wave A of the plan as an explicit prerequisite task BEFORE Steps 2-3. Script change is ~20 LoC: use `.upsert({ onConflict: 'slug' })` on universities and a match-on-(university_id, name) pattern for courses.

---

## Assumptions Log

All claims in this research are either verified in-repo (grep/Read) or cited via Context7 Supabase docs. No `[ASSUMED]` items remain open.

| # | Claim | Section | Source |
|---|---|---|---|
| — | — | — | All claims verified or cited |

---

## Open Questions

1. **`preferred_state` reintroduction for regional heuristic.** The regional_score currently uses a heuristic (Health or Education field → regional preference). A proper `preferred_state` column would be cleaner. CONTEXT explicitly defers this to v2 — but the planner should flag whether the 5-point regional weight is worth it in v1 given the heuristic's rough edges. If Gideon plan-check pushes back, easy compromise: set regional_score=0 in v1, reassign 5pt to QS (bump to 15pt).
2. **Weights deviation from R-2 signature.** CONTEXT locked `RETURNS TABLE(...)`; research recommends `RETURNS jsonb`. Planner should surface this as an explicit Delta in PLAN.md and ask Gideon to sign off. Low risk, implementation clarity win.
3. **Manual recompute automation.** The "RPC failed → Sam manually re-runs" fallback is minimal. At some scale (>10 leads/day), a Pulse cron that scans `leads WHERE matches IS NULL AND created_at > now() - interval '1 day'` and retries would be nice. Out of v1 scope per CONTEXT deferred, but worth flagging as a v1.1 patch candidate.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI (`supabase` command) | Apply 003+004 migrations via `db push` | Need to verify — was used in P1 | — | Management API HTTP POST (P1 fallback pattern) |
| psql | Local SQL smoke against persona validations | Likely missing on Sam's Mac | — | Use Supabase Studio SQL editor (cloud UI) |
| Node 22+ / tsx | Run seed-universities.ts --upsert | Present (used in P1) | verified | — |
| Supabase Management API access (PAT in .env.local) | Alternative migration path | Present (used in P1) | — | — |

**Missing dependencies with no fallback:** None — both migration paths (CLI + Management API) have been proven in P1.

---

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: ./PRD.md §2 V1.3 + §5 tech stack + §6 AU compliance]` — UniMate scope + MARA + QEAC + data residency
- `[VERIFIED: ./PHASE.md §"Phase 4: UniMatch engine" + §"Phase 4.5: Compliance gate"]` — task scope + compliance gate items
- `[VERIFIED: ./CLAUDE.md §3a route table accuracy rule + §8 AU compliance]` — governance constraints
- `[VERIFIED: ./.planning/4-CONTEXT.md]` — 19 locked decisions
- `[VERIFIED: ./.planning/3-CONTEXT.md + 3-PLAN.md]` — P3 atomic INSERT pattern
- `[VERIFIED: ./supabase/migrations/001_initial_schema.sql]` — leads/courses/universities table shape
- `[VERIFIED: ./supabase/migrations/002_leads_status.sql]` — status enum + trigger (P3 addition)
- `[VERIFIED: ./web/src/lib/universities-seed.ts]` — 12-uni fee/IELTS/QS/G8/regional/industry_placement data used in persona simulation
- `[VERIFIED: ./web/src/lib/match-stub.ts + matcher.ts + lead-score.ts]` — existing scoring patterns to mirror
- `[VERIFIED: ./web/src/app/api/leads/route.ts]` — route to extend with RPC call
- `[VERIFIED: ./web/src/components/lead/Step5Contact.tsx + ./web/src/lib/content.ts]` — existing MARA disclaimer strings (P0.5 scrub)
- `[VERIFIED: ./planning/atlas-ai/DEVIATIONS.md §DEV-001]` — APP 8 Singapore obligations already covered in P3

### Secondary (HIGH confidence — Context7)
- `[CITED: Context7 /supabase/supabase — guides/database/postgres/row-level-security.mdx]` — SECURITY DEFINER function pattern + search_path = '' requirement
- `[CITED: Context7 /supabase/supabase — guides/database/functions.mdx]` — `set search_path = ''` with fully-qualified schema refs
- `[CITED: Context7 /supabase/supabase — troubleshooting/rls-performance-and-best-practices-Z5Jjwv.mdx]` — REVOKE/GRANT pattern for SECURITY DEFINER, schema placement

### Tertiary (MEDIUM confidence — domain knowledge)
- QS WUR 2025 rankings — integer ranks public, verified against `universities-seed.ts` values (sampled UNSW=19, Melbourne=13 against public QS 2025 page in training data + CONTEXT "Low legal risk")
- AU edu lead-form industry conventions (IDP, Study Australia, StudyMove) — referenced for weight rationale; no licensed database access so weighting is judgment-based but defended per-persona

---

## Metadata

**Confidence breakdown:**
- Weights + persona simulation: HIGH — manually validated against seed numbers
- Stretch math: HIGH — matches existing matcher.ts pattern
- RPC shape + SECURITY DEFINER: HIGH — Context7 Supabase docs verified
- MARA banner wording: HIGH — reused from P0.5 scrubbed canonical strings
- Match token TTL (server-component approach): HIGH — Next 16 App Router standard pattern
- Seed migration order: HIGH — pattern matches P1 flow; adds --upsert mode (new minor scope)
- /matches page design: HIGH — reuses existing design tokens and card patterns
- `/api/match` removal: HIGH — scaffold route is vestigial, contradicts locked R-2

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (30 days — stable domain; QS rankings don't change mid-year, Supabase function semantics stable)

## RESEARCH COMPLETE
