# Plan-Check: Pathway-AI v1 Phase 0
**Agent:** Gideon
**Date:** 2026-04-16
**Verdict:** BLOCK
**Concur with Atlas?:** partial — agree on P7 timing risk; dissent that the privacy/compliance sequencing is blocking, not a note

## Summary (1 paragraph)
The plan is commercially sensible: the four kept modules are the right four, the six deferred modules are mostly clean cuts, and `gpt-4o-mini` + `text-embedding-3-small` is the right cost tier for a $3k build (PRD.md:31-40, 75-76). I am blocking because two contradictions need resolution before Phase 1: P3 says the lead form auto-saves each step, but consent only arrives at step 5, so the lawful basis for storing pre-consent PII is undefined (PRD.md:52-55, 89; PHASE.md:82-85, 156). Separately, compliance is parked at P8 even though the acceptance criteria, chat spec, and current scaffold already depend on compliance-sensitive copy and behavior (PRD.md:48, 88-90, 113-117; `web/src/lib/content.ts`:33, 61, 69; `web/src/app/api/chat/route.ts`:21, 35-37).

## 1. Scope realism
The 4-module v1 is buildable in 3 weeks only if mobile rebrand and compliance are treated as early parallel risks, not endgame cleanup (PRD.md:113-117; PHASE.md:132-159). The 6 cuts are defensible; dashboard, scraper, analytics, Better Auth, and `internal_user_id` are the right v1 exclusions (PRD.md:33-40). Model choice is correct for budget discipline (`gpt-4o-mini` chat, `text-embedding-3-small` embeddings; PRD.md:75-76). One realism note Atlas missed: P6 says "lift existing SOP generator" plus client-side PDF export, but `react-pdf` is not in `web/package.json`, so PDF is net-new work, not a lift (`web/package.json`:10-24; PHASE.md:125-127).

## 2. Phase ordering + dependency gaps
I agree with Atlas on P7: it is too late. Acceptance requires mobile branding complete (PRD.md:116-117), while the current app config still carries `Pathway-AI Australia`, old slug/scheme, and old bundle/package IDs (`mobile/app.json`:3-20). That belongs in parallel with P1/P2 so store review does not hit the critical path. P8 at the end is a sequencing error, not a polish pass: the scaffold already ships claims like "real PR pathways" and "98% student visa success rate" (`web/src/lib/content.ts`:33, 61), while P5 chat talks about subclass 500, 485, and PR points (`web/src/app/api/chat/route.ts`:21, 35-37). Compliance must be enforced no later than P5. The P1 → P2 → P3 chain also lacks an explicit draft-state design for progressive saves (PHASE.md:83-85).

## 3. AU compliance coverage
/QEAC/CRICOS framing is directionally right, but Privacy Act handling is underspecified. The plan stores one consent timestamp/version at step 5 (PRD.md:54, 89; PHASE.md:156), while the form is supposed to persist each step (PHASE.md:83). That requires either anonymous draft saves until consent, or an earlier collection notice plus a service-vs-marketing consent split. The current lead modal language bundles "study and migration enquiry" into one checkbox (`web/src/components/LeadModal.tsx`:197-199), which is weak if follow-up marketing is intended. The 43-manual-university position is defensible for v1 if sold as curated coverage, not market completeness (PRD.md:35, 92, 137). Data residency is acceptable at the Supabase layer, but the hard residency claim should stay limited to Supabase `ap-southeast-2` (PRD.md:91; SOURCECODE.md:106).

## 4. Governance enforceability
§3 and §4a are conceptually right but operationally weak under Lovable/Bolt autogen output (CLAUDE.md:28-38, 57-69). Worse, the source of truth is already drifting in P0: `SOURCECODE.md` lists four web API routes and omits `/api/match` (SOURCECODE.md:70-74, 89-92), but that route exists in the scaffold (`web/src/app/api/match/route.ts`:1-40). If the living architecture doc is wrong before Phase 1, the governance rule is not yet trustworthy. Dual sign-off defines disagreement handling but not absence/fallback if one final-say agent is unavailable (PHASE.md:4; CLAUDE.md:44-55).

## 5. Code-level risk surface
RLS planning is too thin. P1/P2 say "`leads`, `embeddings` tables + RLS" and "protect `leads` from public read" (PHASE.md:55, 70, 112; SOURCECODE.md:100-106), but the plan never defines which writes happen as anon, which as service role, and whether `embeddings` is completely private. Streaming risk is also underspecified: current `/api/chat` is a public `streamText` call with no explicit abort, disconnect, backpressure, or rate-limit handling (`web/src/app/api/chat/route.ts`:48-62; SOURCECODE.md:89; PHASE.md:113). Progressive save has an obvious race window because there is no draft versioning/idempotency story in P3 (PHASE.md:83-85). Type-safety is decent but not airtight: `/api/match` validates then still casts `parsed.data as Student`, and `/api/sop` relies on shallow string coercion (`web/src/app/api/match/route.ts`:32-40; `web/src/app/api/sop/route.ts`:62-76).

## 6. Pricing + client relationship
$3k AUD is underpriced, but still survivable if scope stays frozen and the plan stops pretending compliance/mobile can be deferred safely. If Pathway-AI asks for a cut module "as a favour," the line is: v1 is priced to prove conversion ROI; dashboards, scraper work, and auth upgrades are v2 operations scope, not v1 conversion scope (PRD.md:29-40; CLAUDE.md:20-24).

## Blocking concerns (if any)
- Progressive save vs step-5-only consent is a design contradiction that must be resolved before Phase 1 starts (PRD.md:52-55, 89; PHASE.md:83, 156).
- Compliance cannot sit at P8 while the scaffold and P5 chat already contain migration/PR-sensitive claims (PRD.md:48, 88-90, 113; PHASE.md:111-113, 155-158; `web/src/lib/content.ts`:33, 61).
- Governance is not yet enforceable enough because `SOURCECODE.md` is already inaccurate about the live route surface (SOURCECODE.md:70-74, 89-92; `web/src/app/api/match/route.ts`:1-40).

## Non-blocking notes
- Atlas is right that P7 should move earlier or run in parallel.
- The plan should stop saying "lift" where the repo actually requires rewrite, especially chat/OpenRouter removal and PDF export (`web/src/app/api/chat/route.ts`:10-16, 19-41; `web/src/app/api/sop/route.ts`:6-13, 18-35).

## Sign-off
Signed Gideon, 2026-04-16
