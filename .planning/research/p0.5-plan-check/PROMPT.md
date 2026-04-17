# P0.5 Plan-Check Review — MARA Scaffold Scrub

**Repo:** `~/Desktop/atlas-ai`
**Commit under review:** `f425837` — `fix(phase-0.5): scaffold scrub`
**Phase:** P0.5 (HARD BLOCK on P1)
**Reviewer role:** NO CODE WRITING. REVIEW ONLY. ONE OUTPUT FILE.

## Your output

Write ONE markdown file to `.planning/research/p0.5-plan-check/{AGENT_NAME}-v1.md` with:

- **Verdict:** `APPROVE` / `APPROVE-WITH-NOTES` / `BLOCK`
- **MARA compliance check** — Does this commit achieve zero user-facing migration/visa advice? Cite any violations by file:line.
- **Type correctness** — Did the `wants_pr → prioritize_outcomes` and `pr_eligible → industry_placement` renames leave any dangling references?
- **UX cohesion** — Does "strong graduate outcomes (industry placement + regional)" checkbox make sense as a replacement for the PR toggle? Or does it introduce new problems?
- **Consent split** — Is the LeadModal service/marketing consent split compliant with Privacy Act 1988 s.6 + APP 5?
- **Gaps** — What's still at risk for phase-verify?

## Key files to review

- `planning/atlas-ai/APPROVAL.md` — Sam's approval
- `web/src/components/MatcherForm.tsx` — new "outcomes" checkbox + indicative-only disclaimer
- `web/src/components/LeadModal.tsx` — consent split + APP 5 notice
- `web/src/components/ChatDrawer.tsx` — suggestion chips rewrite
- `web/src/lib/matcher.ts` — scoring logic with new field
- `web/src/lib/types.ts` — Student + Course types
- `web/src/app/api/match/route.ts` — zod schema update
- `web/src/app/api/sop/route.ts` — system prompt disclaimer
- `web/src/lib/universities.ts` + `web/src/lib/universities-seed.ts` — course field rename (48 seed entries)
- `mobile/lib/mockData.ts` — reasons arrays + prompts + types
- `mobile/app/(tabs)/profile.tsx` — field blurbs + IELTS captions
- `mobile/app/(tabs)/index.tsx` — import + tagline

## Grep gate result

```
grep -riE "(subclass|MLTSSL|STSOL|PR points|PR pathway|visa success|DoHA|points test|Permanent Residency|visa pathway|post-study work|migration outcomes|PR-aware|PR-eligible|wants_pr|wantsPR|prIntent|visaUpdate)" web/src/ mobile/lib/ mobile/app/ --include="*.ts" --include="*.tsx"
```

6 hits remaining — all in MARA-REQUIRED negative-constraint language (system prompts "NEVER give visa advice", code comment "// MARA-safe: NO migration/visa advice"). Zero user-facing violations claimed. **Review whether this claim is defensible** or if any of the 6 are actually violations.

## Typecheck

Both `web/` + `mobile/` pass `tsc --noEmit` with no errors.

## DO NOT

- Write code
- Modify files
- Output more than ONE markdown file
- Take longer than 6 minutes wall clock
