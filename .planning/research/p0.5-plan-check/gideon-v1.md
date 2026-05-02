# P0.5 Plan-Check Review — Scaffold Scrub

## Verdict
`BLOCK`

## compliance check
The commit does **not** yet achieve zero user-facing migration/visa advice.

### Actual blockers
- `mobile/app/(tabs)/index.tsx:188-191` still says `migration fit` and `PR intent`. That is affirmative user-facing migration framing, not a disclaimer.
- `mobile/lib/mockData.ts:165-168` still returns a visible chip response that says `migration-related questions`, which keeps migration language in surfaced copy.

### Defensible negative-constraint language
I do **not** count these as blockers by themselves:
- `web/src/components/ChatDrawer.tsx:92-95`
- `web/src/components/MatcherForm.tsx:261-266`
- `web/src/components/Footer.tsx:88-90`

Those are disclaimer / regulator notices, not advice claims.

## Type correctness
The `wants_pr -> prioritize_outcomes` and `pr_eligible -> industry_placement` renames look consistent. I did not find dangling references in live source.

The rename is wired through the expected paths:
- `web/src/lib/types.ts:24-33, 51-58`
- `web/src/app/api/match/route.ts:6-26`
- `web/src/lib/matcher.ts:11-18, 41-46, 92-99`
- `web/src/lib/universities.ts:3-20`
- `web/src/lib/universities-seed.ts:18-239`
- `mobile/lib/mockData.ts:25-33, 182-190`

Residual risk: archived docs and phase notes still mention old PR / migration concepts, but those are outside the live type path and not part of the runtime dangling-reference check.

## UX cohesion
`Prioritise courses with strong graduate outcomes (industry placement + regional)` is a safer replacement than a PR toggle, but the label is a little overloaded.

Why:
- `industry placement` is a course attribute.
- `regional` is a location signal.
- The scoring logic only uses `industry_placement` directly, while `regional` only changes the human-readable reason text (`web/src/lib/matcher.ts:41-46, 92-99`).

Net: the control is directionally right, but it reads like a heuristic gloss rather than a literal single preference. It should be treated as a user preference, not a factual claim about outcomes.

## Consent split
The LeadModal change is structurally correct: required service consent is separated from optional marketing consent in `web/src/components/LeadModal.tsx:192-218`.

I would **not** call it fully APP 5 safe yet.

Why:
- OAIC APP 5 requires a collection notice to cover more than purpose and consent. It should also notify the individual of identity/contact details, the collection circumstances, consequences of not providing the information, usual disclosures, APP Privacy Policy info, and overseas disclosures where relevant.
- The current notice in `web/src/components/LeadModal.tsx:192-194` only partially covers those matters.
- The line promising the details will “never share” with third parties without written consent is too absolute unless the implementation truly excludes processors, legal disclosures, and other ordinary exceptions.

Official refs:
- [OAIC APP 5 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information/)
- [Privacy Act 1988, s 6 definition of personal information](https://www.legislation.gov.au/C2004A03712/2006-07-01/2022-04-01/text/original/epub/OEBPS/document_1/document_1.html)

## Gaps
Still at risk for phase-verify:
- The mobile home surface still ships migration/PR language in visible copy.
- The mobile prompt data still mixes outcomes language with migration framing.
- The LeadModal notice needs a fuller APP 5 collection notice before I would treat it as compliance-closed.
- The commit should be re-grepped after the mobile copy cleanup to prove the zero user-facing migration/visa claim on the shipped surfaces.
