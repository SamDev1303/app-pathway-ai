# P0.5 Phase-Verify — MARA Scaffold Scrub Delivery Check

**Repo:** `~/Desktop/atlas-ai`
**Commits:** `f425837` + `2bedf83` (cumulative P0.5 delivery)
**Plan-check sign-offs:** Gideon APPROVE-WITH-NOTES (round 2, 2026-04-17) | Specter APPROVE-WITH-NOTES (NIM Nemotron fallback, 2026-04-17)

## Phase-verify question (goal-backward)

**Does P0.5 actually deliver what it promised?** Not "were tasks checked off" but "is the codebase now MARA-safe enough to unblock P1 Supabase commitment?"

## 14-item checklist — verify each against the actual codebase

Check each item. Mark PASS / FAIL / PARTIAL with file:line citations.

1. **No user-facing "PR" or "Permanent Residency" claims.** Grep `web/src/` + `mobile/lib/` + `mobile/app/` for bare "PR" / "Permanent Residency" in user-facing strings (not comments, not type names, not disclaimer language).
2. **No user-facing "visa" as advice.** Grep the same scope. "Not migration advice" disclaimers pass; "visa pathway available" or similar advice claims fail.
3. **No user-facing "subclass 500" / "subclass 485" / "MLTSSL" / "STSOL" / "post-study work" / "DoHA".** Must be zero in shipped copy.
4. **MatcherForm wantsPR → prioritizeOutcomes rename complete.** Type flows through: Student interface, matcher.ts scoring, /api/match zod schema, MatcherForm state + JSX.
5. **Course `pr_eligible` → `industry_placement` rename complete.** Course interface, universities.ts helper, universities-seed.ts (48 entries), matcher.ts scoring.
6. **Consent split in LeadModal.** Required service consent + optional marketing consent, both submit-tracked as `consent_service` + `consent_marketing` + `consent_wording_version`.
7. **APP 5 collection notice complete.** Identity (MARN 1798425), purpose, consequences of non-provision, who we share with (including processors), legal-disclosure caveat, access/correction/deletion contact, Privacy Policy reference, Privacy Act 1988 reference.
8. **ChatDrawer suggestion chips scrubbed.** No "PR in Australia", no "subclass" references in `SUGGESTED[]`.
9. **sop/route.ts system prompt has explicit negative constraint.** Must contain "NEVER include visa advice, migration pathway guidance, residency claims, or post-study work..."
10. **chat + chat-simple route system prompts preserved as MARA-safe deflection.** Must contain "NEVER give" / "NOT a migration agent" language (these are REQUIRED, not violations).
11. **mobile/index.tsx hero copy scrubbed.** No "migration fit" / "PR intent" — currently "outcomes fit" / "graduate-outcomes focus".
12. **mobile/profile.tsx field blurbs scrubbed.** No "PR-active pathway" / "MLTSSL" / "PR-eligible pathway".
13. **mobile/mockData.ts advisor prompts scrubbed.** No "PR pathway courses" / "migration outcomes" / "migration-related questions".
14. **Both web + mobile typecheck clean.** `tsc --noEmit` → 0 errors.

## Output

Write ONE markdown file to `.planning/research/p0.5-phase-verify/{AGENT_NAME}-v1.md` with:

- **Verdict:** PASS (all 14 pass) / PARTIAL (14 items with mixed statuses) / FAIL (blocker found)
- **14-item table** with status + evidence per item
- **Ready to close P0.5?** yes/no
- **Ready to unblock P1 Supabase execution?** yes/no

## DO NOT

- Modify files
- Output more than ONE markdown file
- Take longer than 6 minutes
