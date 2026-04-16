# Plan-Check: Atlas AI v1 Phase 0
**Agent:** Atlas
**Date:** 2026-04-16
**Verdict:** APPROVE WITH NOTES

## Summary (1 paragraph)
The Atlas AI v1 plan is logically sound and surgically focused on conversion (leads/matches/SOP) while deferring operational overhead to v2. The transition from UniMate-demo to atlas-ai is complete in scaffold. The $3,000 AUD budget for 4 modules is realistic given the no-code (Lovable/Supabase) stack and manual seeding of 43 universities (skipping the scraper complexity). However, the mobile rebrand in Phase 7 carries a significant risk of delaying the 3-week ship due to App Store review times for a new bundle ID.

## 1. Scope realism
- **Budget ($3k AUD):** Realistic for a 3-week build using Lovable/Bolt and Supabase. Manual seeding of 43 AU unis (PRD §3, X.3) is the correct play to avoid the $2k scraping overhead.
- **Model Tier:** `gpt-4o-mini` + `text-embedding-3-small` (PRD §5) is the optimal price-to-performance ratio for a student advisor; `o1` or `gpt-4o` would be over-specced for this budget.
- **V2 Anchor:** Defensibly cutting the Admin/Provider dashboards (PRD §3, X.1-X.2) protects the margin. The $10–13k v2 quote envelope is well-supported by the cuts.

## 2. Phase ordering + gaps
- **P7 Mobile Rebrand (RISK):** Phase 7 (PHASE.md) tasks a bundle ID change (`cloud.claudeking.atlasai`). This **cannot** be an OTA update; it requires a full App Store/Play Store re-submission. Review times (3–7 days) will block the 3-week ship unless the client already has the store accounts ready. **Note:** P7 should be pulled forward to P1 to unblock the review queue.
- **P1 Seed Dependency:** Phase 5 (Chat) depends on the `embeddings` table from P1. This is correctly ordered.
- **P8 Compliance:** Placing compliance at the end (Phase 8) is acceptable as a final "scan", but the MARA disclaimer **must** be hard-coded into the P5 system prompt from day one. PRD §6 confirms this.

## 3. AU compliance coverage
- **MARA (§6):** Per-turn chat footer + registration link in page footer is the gold standard for compliance.
- **Privacy Act 1988 (§6):** Storing `consent_wording_version` (PRD §1.2) is a strong legal defense. We must ensure the "progressive save" in Phase 3 doesn't store PII before the Step 5 consent checkbox is ticked, or handle it as an "incomplete/abandoned" lead with a shorter retention TTL.
- **QEAC (§6):** Limitation to 43 AU unis is defensible for v1. Claiming "all 43" is better than a broken scraper that misses 5.

## 4. Governance enforceability
- **CLAUDE.md §3 (Conflict):** Sam's no-code workflow (Lovable/Bolt) will generate commits that *do not* follow our `{type}(phase-N)` format or update `PHASE.md`. 
- **Recommendation:** Sam should run a `git pull` followed by a "Koda cleanup" turn after every Lovable sync to manually align the docs with the generated code.

## 5. Pricing + client relationship
- **Margin:** $3k is tight but the "v2 operational roadmap" (PRD §9) anchors a high-value follow-on.
- **Pushback Line:** If asked for the Admin Dashboard (X.1) as a favour: *"v1 is optimized for student conversion and lead speed to prove the ROI; operational dashboards are scheduled for v2 to ensure they match your specific workflow once real leads are flowing."*

## Blocking concerns (if any)
- None that stop Phase 1 initialization, but Phase 7 (Mobile) should be moved earlier in the timeline to account for store review latencies.

## Non-blocking notes (nice-to-have)
- **Supabase Region:** Double-check that `ap-southeast-2` is active for the new project; some new Supabase accounts default to US-East.
- **Lead Scoring:** Ensure the heuristic for "Lead Score" (P3) is documented in SOURCECODE.md once implemented to avoid black-box results.

## Sign-off
Signed Atlas, 2026-04-16
