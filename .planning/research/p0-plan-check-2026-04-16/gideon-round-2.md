# Plan-Check Round 2: Pathway-AI v1 Phase 0
**Agent:** Gideon
**Date:** 2026-04-16
**Verdict:** APPROVE WITH NOTES
**Round 1 → Round 2 movement:** BLOCK → APPROVE WITH NOTES

## Summary (1 paragraph)
The three round-1 blockers are materially addressed: consent is now defined as client-side only until step 5, compliance is pulled forward into P0.5 and P4.5, and the active endpoint table now includes `/api/match` with a mechanical check in `CLAUDE.md` (PRD.md:21-23, 52-56, 89-90; PHASE.md:52-69, 102-116, 134-149; CLAUDE.md:40-54; SOURCECODE.md:85-97). I am moving from `BLOCK` to `APPROVE WITH NOTES`, not full `APPROVE`, because the revision leaves three residual weaknesses: `SOURCECODE.md` still has one drift outside the route table, the P0.5 grep gate is narrower than the actual migration-sensitive copy surface, and the plan still does not flag the UX downside of `localStorage`-only progressive save.

## Blocker 1 resolution (consent pattern)
**Addressed, with residual privacy note.** The plan is now unambiguous that steps 1-4 persist only to `localStorage`, and step 5 performs one atomic insert carrying `consent_given_at`, `consent_wording_version`, `consent_service`, and `consent_marketing` (PRD.md:21, 52-56, 90; PHASE.md:109-116). The service-vs-marketing split is directionally correct for AU expectations: required service consent, optional marketing consent, no bundled marketing default. Remaining risk: the plan still does not explicitly require an APP 5-style collection notice at the first personal-info step; it only specifies consent at step 5. Also, `localStorage` creates a UX/data-loss edge case on tab clear, private browsing, or storage eviction, and that tradeoff is not surfaced anywhere in PRD.md or PHASE.md.

## Blocker 2 resolution (compliance sequencing)
**Addressed.** P0.5 is now a true pre-build scrub gate before P1, and P4.5 is a true pre-chat compliance gate before P5, which closes the sequencing hole I blocked in round 1 (PHASE.md:52-69, 134-149, 153-165). P8 still has a real job: regression re-check plus handover attestation, not primary compliance discovery (PHASE.md:200-212). The remaining weakness is enforcement breadth, not ordering. The P0.5 grep gate only scans `web/src/` and only for a short phrase list (PHASE.md:67). Current migration-sensitive copy also exists in `web/src/components/ChatDrawer.tsx:7-12,140`, `web/src/components/MatcherForm.tsx:124-126,234,260-264`, `mobile/lib/mockData.ts:165-172`, and `mobile/app/(tabs)/profile.tsx:58-66`. P7 can run in parallel (PHASE.md:185-196), but no dependency note says mobile/store work must wait for the scrub.

## Blocker 3 resolution (SOURCECODE.md)
**Partially addressed.** The active endpoint table is now correct: five live `route.ts` files and five rows, including `/api/match` (SOURCECODE.md:85-97; live inventory confirms `chat`, `chat-simple`, `leads`, `match`, `sop`). `CLAUDE.md` §3a is a useful stopgap because it forces a row-count check before API-touching commits (CLAUDE.md:40-54). Two notes remain. First, `SOURCECODE.md`'s `/web/src` tree still omits `/api/match` (SOURCECODE.md:70-79), so the document is not fully in sync yet. Second, §3a checks row count only and only counts `POST|GET|DELETE`; it will miss a wrong path label or future `PUT/PATCH` routes. This should move to CI or a generated table, but it is no longer a blocker for P1.

## New risks introduced by the revision
- P0.5 and P4.5 consume schedule slack. They are necessary, but they most likely squeeze P6 polish and P9 handover/deploy buffer inside the fixed 3-week window (PRD.md:4; PHASE.md:52-69, 134-149, 169-228).
- `localStorage`-only save reduces privacy risk but adds recoverability risk; the plan does not warn users that draft data is device-local and not durable.
- P7 has an owner, but the “can run in parallel” note is still hand-wavy because it does not map explicit dependencies to compliance scrub, store account readiness, or resubmission lead time (PHASE.md:185-196).
- The P0.5 grep list misses likely phrases such as `Permanent Residency`, `visa pathway`, `post-study work`, `migration outcomes`, and mobile-only variants.

## Governance observation
`CLAUDE.md` §4a does prevent the round-1 failure mode. One writer for `PHASE.md`, plus required response-file verification, is the right control if Koda actually enforces it (CLAUDE.md:72-84). The P0 task list is now an accurate and auditable trace of the round-1 block, Sam’s acceptance, the document revisions, and the round-2 redispatch state (PHASE.md:39-48).

## Blocking concerns (if any)
None.

## Non-blocking notes
- Add an explicit collection notice at the first personal-info step, not only at consent step 5.
- Widen the P0.5 scrub scope from `web/src/` to `web/src/` plus `mobile/`, and expand the phrase list.
- Tighten §3a with CI or script-generated endpoint rows.

## Sign-off
Signed Gideon, 2026-04-16
