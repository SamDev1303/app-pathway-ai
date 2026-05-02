You are Specter — stateless adjudicator. Gideon (Codex gpt-5.4-mini) is running parallel phase-verify on Pathway-AI P0.5 scrub. You're the independent dual-seat reviewer. Return a concrete verdict.

## Context
P0.5 shipped as 2 commits: f425837 (round-0 scrub, 14 files) + 2bedf83 (round-1 fix, 3 files absorbing Gideon's BLOCK on residual migration copy + expanded APP 5 notice). Dual plan-check passed: Gideon APPROVE-WITH-NOTES + Specter APPROVE-WITH-NOTES.

## What was delivered (cumulative across 17 file-level changes)

### Web
- `web/src/components/ChatDrawer.tsx`: SUGGESTED chips → non- questions; placeholder "Ask about courses, IELTS, fees…"
- `web/src/components/MatcherForm.tsx`: wantsPR state → prioritizeOutcomes; "Permanent Residency" checkbox → "strong graduate outcomes (industry placement + regional)"; indicative-only disclaimer rewrite
- `web/src/components/LeadModal.tsx`: consent split (required service + optional marketing), APP 5 notice with identity/purpose/consequences/sharing/legal/rights/policy-ref
- `web/src/components/Footer.tsx`: "PR fit" → "outcomes fit"
- `web/src/lib/types.ts`: Student.wants_pr → prioritize_outcomes; Course.pr_eligible → industry_placement
- `web/src/lib/matcher.ts`: full rename; WEIGHTS.pr → WEIGHTS.outcomes; reason labels updated
- `web/src/lib/universities.ts`: course helper param rename
- `web/src/lib/universities-seed.ts`: 48 course entries renamed
- `web/src/app/api/match/route.ts`: zod schema rename
- `web/src/app/api/sop/route.ts`: system prompt — added NEVER clause for visa/migration/residency
- `web/src/app/api/chat/route.ts` + `chat-simple/route.ts`: pre-existing NEVER-give-visa-advice system prompts (-required, kept)
- `web/src/lib/content.ts`: pre-existing disclaimer text "not migration advice"

### Mobile
- `mobile/lib/mockData.ts`: reasons arrays scrubbed of PR-aware/PR-eligible/PR-pathway; prIntent → outcomesFocus; visaUpdate → admissionsUpdate; advisor chip deflection updated
- `mobile/app/(tabs)/profile.tsx`: field blurbs scrubbed; IELTS caption scrubbed
- `mobile/app/(tabs)/index.tsx`: "migration fit" → "outcomes fit"; "PR intent" → "graduate-outcomes focus"; tagline "Study migration" → "Study abroad"; import rename visaUpdate → admissionsUpdate

### Gates
- Widened grep: 6 hits remaining, ALL in system-prompt negative constraints (`NEVER give visa advice...`) + 1 code comment (`// -safe: NO migration/visa advice claims`). ZERO user-facing violations.
- Typecheck: web + mobile both pass `tsc --noEmit` with zero errors.
- APPROVAL.md written: `planning/pathway-ai/APPROVAL.md` timestamped 2026-04-17 12:08 AEDT with Sam's verbal "finish the gsd phases" captured.

## Phase-verify question (goal-backward)
Does P0.5 actually deliver the promise? Is the codebase -safe enough to commit to P1 Supabase schema without risking Pathway-AI's ?

## Your output (150-250 words, markdown only)

## Verdict: [PASS / PARTIAL / FAIL]
## 14-item checklist evidence
(Go through items 1-14 below, mark PASS/FAIL/PARTIAL + brief evidence for each. If you believe an item is PASS from the evidence above, say so; if you'd need direct file inspection, say PARTIAL with what you'd verify.)

1. No user-facing "PR" / "Permanent Residency" claims.
2. No user-facing "visa" as advice.
3. No user-facing "subclass" / "MLTSSL" / "STSOL" / "post-study work" / "DoHA".
4. MatcherForm wantsPR→prioritizeOutcomes rename through full type chain.
5. Course pr_eligible→industry_placement rename through 48 entries + helper.
6. Consent split with consent_service + consent_marketing + consent_wording_version.
7. APP 5 collection notice covers: identity + purpose + consequences + sharing + legal + rights + policy ref + Privacy Act.
8. ChatDrawer suggestions scrubbed.
9. sop/route.ts system prompt has explicit NEVER-clause for visa/migration/residency.
10. chat + chat-simple route system prompts preserve required deflection.
11. mobile/index.tsx hero scrubbed.
12. mobile/profile.tsx field blurbs scrubbed.
13. mobile/mockData.ts advisor prompts scrubbed.
14. web + mobile typecheck clean.

## Ready to close P0.5? yes/no
## Ready to unblock P1 Supabase execution? yes/no
