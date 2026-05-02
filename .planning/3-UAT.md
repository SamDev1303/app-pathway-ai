---
status: testing
phase: 3 (Lead capture — 5-step + progressive save + scoring)
source:
 - .planning/3-CONTEXT.md
 - .planning/3-PLAN.md
 - PHASE.md §Phase 3 (10 checklist tasks)
started: 2026-04-18T03:15:00+11:00
updated: 2026-04-18T03:15:00+11:00
tester: Sam
recorder: Koda
runtime: local pnpm dev
---

## Current Test

number: 2
name: Modal opens from Hero/Footer CTA
expected: |
 Click any "Free consultation" / "Bring your match to Liverpool"
 CTA button on the landing page. The lead modal opens: navy blurred
 backdrop, cream paper-grain card, gold rail accent top-left, Step 1
 visible inside. Modal is wider than before — `max-w-2xl` (~672px)
 instead of the old `max-w-lg` (~512px). Progress indicator shows
 `• ○ ○ ○ ○` (or on desktop: Personal · Academic · Preferences ·
 Budget · Contact with "Personal" highlighted in gold).
awaiting: user response

## Tests

1. [x] Cold Start Smoke Test — pathway-ai/web/ boots clean on pnpm dev, landing renders ✅
2. [ ] Modal opens from Hero/Footer CTA — click CTA → lead modal opens, max-w-2xl width visible
3. [ ] Step 1 APP 5 notice renders BEFORE fields — notice block visible at top, localStorage trade-off copy shown
4. [ ] Step 1 required-field gating — Next disabled until name + email + phone + country filled
5. [ ] Step 2 skippable — "Skip this step" link advances with blank values
6. [ ] Step 3 match teaser renders — select 1+ field, top-3 unis with % appears below, "Preview match" disclaimer visible
7. [ ] Step 4 budget optional — Skip works, hints about G8 $45k + Sydney living cost visible
8. [ ] Step 5 APP 5 + APP 8 notice — full notice visible, "Where we store it" Singapore paragraph present VERBATIM per DEVIATIONS.md
9. [ ] Step 5 consent gating — Submit disabled until service consent ticked; marketing optional
10. [ ] Progress indicator — dots on mobile (375px), labeled row on desktop; active step highlighted
11. [ ] Framer slide animation — forward/back navigation shows horizontal slide transition
12. [ ] Submit path — fill minimum required + consent → submit → success card "Got it."
13. [ ] DB row verification — SELECT from Supabase leads table shows the submitted row with all fields + consent_wording_version = "2026-04-17.v2"
14. [ ] Email verification — Sam's inbox shows "[Pathway-AI lead · tier X] FullName" email with score + all fields + consent audit trail
15. [ ] Draft persistence — close modal mid-step-3 → reopen → form rehydrated at step 3, "Picking up where you left off" banner visible
16. [ ] Draft clears on submit — complete a lead → close → reopen modal → blank form, no banner
17. [ ] -safe copy audit — scroll every step, no visa/migration/PR/subclass/485/500 strings visible in UI
18. [ ] Score NOT visible to student — success state does NOT show tier or score number anywhere
19. [ ] Notes placeholder -safe — Step 5 notes placeholder reads "Target intake, application deadlines, prior study, scholarships..." (no "visa history")
20. [ ] Client/server wording drift — send `consent_wording_version: "garbage"` via curl → server INSERTs row with canonical "2026-04-17.v2" anyway (proves S6 fix)

## Results

(completed tests recorded here)

## Open Issues

(issues + severity inferred from user response)

## Close-out

Verdict: pending
Gaps for /gsd-plan-phase --gaps: pending
