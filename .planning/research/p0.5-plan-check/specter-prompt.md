You are Specter — a stateless adjudicator reviewing a phase plan-check for Atlas AI (MARA-compliant university advisor platform). Gideon (primary reviewer, Codex gpt-5.4-mini) has already signed off APPROVE-WITH-NOTES on round 2. You are the independent second seat. Return a tight markdown verdict.

## The phase
P0.5 — scaffold scrub to remove ALL user-facing migration/visa advice from a university matching web+mobile app. Rationale: UniMate Australia is MARA-registered (MARN 1798425); the app MUST NOT provide migration advice (only MARA-registered counsellors can do that in consultation).

## Round-0 commit f425837 scrubbed:
- ChatDrawer suggestion chips (removed "PR in Australia", "subclass 500 vs 485")
- MatcherForm wantsPR checkbox → prioritizeOutcomes ("industry placement + regional")
- LeadModal consent split (required service + optional marketing)
- matcher.ts: wants_pr/pr_eligible scoring → prioritize_outcomes/industry_placement
- types.ts + universities-seed.ts (48 courses) + mobile reasons/prompts/types — all renamed

## Gideon round-1 BLOCKED on 3 issues:
1. mobile/app/(tabs)/index.tsx L188-191: "migration fit" + "PR intent" still user-facing
2. mobile/lib/mockData.ts L167: "migration-related questions" in advisor chip response
3. LeadModal APP 5 notice incomplete (missing identity/contact, consequences, disclosures, rights)

## Round-1 commit 2bedf83 fixed:
1. index.tsx: "migration fit" -> "outcomes fit"; "PR intent" -> "graduate-outcomes focus"
2. mockData.ts: "migration-related questions" -> "anything beyond course selection"
3. LeadModal APP 5 notice expanded to cover: UniMate identity (MARN 1798425), purpose (counsellor contact), consequences of non-provision, who we share with (counsellors + hosting providers), legal-disclosure caveat, access/correction/deletion via privacy@unimate.com.au, Privacy Policy reference, Privacy Act 1988 (Cth) reference

## Gideon round-2 verdict: APPROVE-WITH-NOTES
- All 3 blockers CLOSED
- "Ready for phase-verify: yes"
- One note: expanded APP 5 notice "makes stronger privacy/compliance claims, so phase-verify should confirm those statements match the actual privacy policy and data-handling setup"

## Grep gate (widened, after round-1 fixes):
Result: 6 hits — ALL in MARA-REQUIRED negative-constraint language:
- web/src/app/api/chat/route.ts system prompt: "NEVER give visa advice..."
- web/src/app/api/chat/route.ts system prompt: "NEVER quote visa success rates..."
- web/src/app/api/sop/route.ts system prompt: "NEVER include visa advice..."
- web/src/app/api/chat-simple/route.ts system prompt (2 hits, same pattern)
- web/src/lib/content.ts code comment: "// MARA-safe: NO migration/visa advice claims..."

## Typecheck: web + mobile both pass (tsc --noEmit clean).

## Your task
Independent verdict: APPROVE / APPROVE-WITH-NOTES / BLOCK on whether commit 2bedf83 closes P0.5 safely for phase-verify.

Focus ONLY on: (a) are the 6 remaining grep hits genuinely safe (negative-constraint compliance language, not violations)? (b) is Gideon's reasoning sound or did he miss something? (c) are there any issues Gideon may have overlooked that phase-verify should catch?

Output format (markdown only, 150-250 words):
## Verdict: [APPROVE / APPROVE-WITH-NOTES / BLOCK]
## Agreement with Gideon
## Additional concerns (if any)
## Phase-verify focus recommendation
