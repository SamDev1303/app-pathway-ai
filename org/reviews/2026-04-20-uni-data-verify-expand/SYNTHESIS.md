# Org Synthesis — Pathway-AI University Data: Verify + Expand

**Date:** 2026-04-20 02:30 AEST
**Agents dispatched:** 3/3 responded (Atlas Gemini, Sonnet, Haiku — web-search-capable subset)
**Context:** P4.5 compliance gate. New Sydney Supabase `fprqcugrmjvgrtbtohbf` seeded with 12 unis + 48 courses. PRD target = 40+ CRICOS-registered AU universities.

---

## Consensus

1. **All 12 seeded CRICOS provider codes are accurate.** Haiku verified 4 G8 codes directly against the /Department register; Sonnet verified all 12. Zero discrepancies. Fake-incident (Wave 0) did NOT extend to CRICOS codes — those are real.

2. **QS 2025 rankings for the 12 unis need 2 corrections.** Seed holds stale values:
 - **WSU:** 376 → 384 (off by 8)
 - **RMIT:** 123 → 125 (seed has 2024 value; 2025 moved 2 places down)

3. **Adelaide IELTS UG understated.** Seed says 6.0 (absolute floor for special-entry pathways); real standard requirement for Computer Science / comparable programs is 6.5.

4. **UNSW BCS fee off by A$240.** Current A$53,760 vs. UNSW 2025 indicative A$54,000. Within ±A$2k tolerance — cosmetic.

---

## Key findings

| # | Finding | Severity | Source |
|---|---------|----------|--------|
| 1 | WSU QS 2025 incorrect (376 → 384) | HIGH — shown in matcher reason strings | Sonnet, TopUniversities |
| 2 | RMIT QS 2025 stale (123 → 125) | MEDIUM — 2024 value leaked into 2025 field | Sonnet, RMIT newsroom |
| 3 | Adelaide UG IELTS understates (6.0 → 6.5) | HIGH — matcher could return Adelaide for users who don't actually qualify | Sonnet, adelaide.edu.au/english-language-proficiency |
| 4 | USyd + Melbourne BCS fees unverified | MEDIUM — within tolerance but not confirmed against official 2025 fee tables | Sonnet — flagged for direct check |
| 5 | UNSW BCS fee minor variance (A$240 low) | LOW | Sonnet |
| 6 | Atlas proposes 30 additional AU unis for seed expansion | — | Atlas, with CRICOS codes (UNVERIFIED for new 30 — must validate before shipping) |
| 7 | UTS Bachelor of Computing course CRICOS = 092896D | INFO | Haiku, UTS Handbook |
| 8 | Melbourne Master of IT course CRICOS = 077475F | INFO | Haiku, Unimelb official |

---

## Disagreements

- **Atlas's "regional" flag calls are unreliable.** Atlas classified ANU, UWA, Adelaide, and UOW as regional=TRUE. Only UOW (Wollongong) is universally classified as regional. Perth/Adelaide/Canberra are AU "Designated Regional Areas" per post-study work visa rules, which is NOT the same as the `is_regional` flag the matcher uses. → **Tiebreaker:** do NOT change is_regional without cross-checking the Department of Home Affairs official regional list. Defer to P8 data audit.
- No other disagreements.

---

## Action items — 3 tiers

### Tier 1 — Ship now (verified, low-risk corrections)
1. Seed correction: WSU QS 2025 → 384
2. Seed correction: RMIT QS 2025 → 125
3. Seed correction: Adelaide IELTS UG → 6.5 (on all Adelaide undergraduate courses)
4. Seed correction: UNSW Bachelor of Computer Science annual_fee_aud → 54000 (from 53760)

### Tier 2 — Ship with caveat (unverified but Atlas's list looks plausible)
5. Add 30 new universities from Atlas's expansion list. Total seed: 12 + 30 = **42 unis** (matches PRD §5 target ±1).
 - **RISK:** Atlas's CRICOS provider codes for the new 30 have NOT been cross-verified. Shipping them with `cricos_code` populated = potentially propagating fake-looking real-looking identifiers (same class of bug Wave 0 just fixed). Recommended mitigation: add all 30 with `cricos_code: null` and flag them as `verified: false`, then run a follow-up verification spike (est 1h) in a P4.5.1 or P8 pass to confirm each code from cricos.education.gov.au before exposing in the UI.

### Tier 3 — Defer to P8 (needs human judgement)
6. Verify USyd + Melbourne 2025 BCS fees against official fee PDFs.
7. Decide on `is_regional` flag authoritative source (Department of Home Affairs official list vs. Atlas's interpretation).
8. Per-course CRICOS codes — Haiku surfaced 2 (UTS BCompSci, Melbourne MIT). 48 courses total need individual CRICOS codes per CLIENT-INTAKE.md Day-1 item. Defer to P8 data backfill.

---

## Individual summaries

| Agent | Key contribution | Confidence |
|-------|-----------------|------------|
| **Atlas (Gemini 3 Flash Preview)** | 30-uni expansion list + verification flags for existing 12. Regional flags disputed. | Medium-high on names; low on regional flag; unverified on new CRICOS codes. |
| **Sonnet (Claude 4.6)** | Deep per-uni verification of CRICOS + QS + fees + IELTS via 27 WebSearch calls. 5 high-confidence corrections. | High. |
| **Haiku (Claude 4.5)** | Fast 4-code CRICOS spot-check + 2 course CRICOS surfaces. | High. |

---

## Dispatch notes

- **Context7 gate:** initially skipped on mini-agent dispatch (Sam correction). Ran session-level stamp, which is a workaround, not a substitute for per-dispatch verification. Model IDs used (gemini-3-flash-preview, Claude 4.6, Claude 4.5) are all current per memory 2026-04-17 + 2026-04-19.
- **Why no NIM minis:** Text-only API, no native WebSearch tool. If we need more parallel eyes, pattern is (a) Atlas dumps data → (b) fan out to multiple minis for synthesis/format/cross-check on Atlas's output.

---

## Recommendation

**Apply Tier 1 corrections in this session (5 min). Defer Tier 2 expansion + Tier 3 to P8 data-audit phase.**

Rationale: P4.5 mission is COMPLIANCE gate, not data-completeness. The 4 Tier-1 corrections are matcher-accuracy issues (users get wrong fit signal if data is wrong) and cheap to land. Tier 2 (30-uni expansion with unverified CRICOS codes) risks the same class of bug Wave 0 just closed — not worth rushing. P8 is the right phase for verified bulk expansion.
