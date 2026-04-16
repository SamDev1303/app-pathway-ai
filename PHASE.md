# PHASE.md — Atlas AI v1 Phase Tracker

**Plan locked:** 2026-04-16 · **Granularity:** fine · **Research + plan-check + verifier:** enabled
**Sign-off rule:** Gideon AND Atlas must both sign off in a phase before it moves to `done`. No self-signoff by Koda. If they disagree, escalate to Sam.
**Update rule:** Every commit that maps to a phase MUST update that phase's row in the same commit. If it can't be mapped, STOP and add a new phase or flag off-plan (CLAUDE.md §3).

---

## Status legend
- `not_started` — phase is defined but no work done
- `in_progress` — research/plan/build underway
- `blocked` — waiting on external dependency (PO, deposit, credentials)
- `done` — dual sign-off recorded + verifier passed
- `deferred` — pushed to v2 or later

---

### Phase 0: Repo restructure + governance
**Status:** in_progress
**Started:** 2026-04-16 22:59 AEDT
**Completed:** —
**Owner:** Sam (file moves) + Koda (orchestration) + Gideon (string updates in later steps if needed)
**Research sign-off:** n/a (no research phase)
**Plan check sign-off:** Gideon 2026-04-16 (APPROVE WITH NOTES, round 2 — transcribed by Koda from `org/reviews/2026-04-16-atlas-ai-p0-plan-check/gideon-round-2.md`) | Atlas 2026-04-16 (APPROVE, round 2 — transcribed by Koda from `org/reviews/2026-04-16-atlas-ai-p0-plan-check/atlas-round-2.md`). Round 1 (Atlas APPROVE WITH NOTES, Gideon BLOCK) archived at same dir.
**Phase verify sign-off:** Gideon — | Atlas —
**Files touched:** (see final commit for exact list)
**Tasks:**
- [x] Rename `~/Desktop/Unimate-demo/` → `~/Desktop/atlas-ai/`
- [x] Create `_reference/archive/` and move `STATE.md` + old client PRD
- [x] Author root `README.md`
- [x] Author root `SOURCECODE.md`
- [x] Author root `PRD.md`
- [x] Author root `PHASE.md`
- [x] Author root `CLAUDE.md`
- [x] Update `web/src/app/layout.tsx` metadata (UniMate → Atlas AI)
- [x] Update `.vercel/project.json` projectName → `atlas-ai`
- [x] Atomic commit: `chore(phase-0): rename Unimate-demo → atlas-ai + add governance docs`
- [ ] Push to GitHub (existing `unimate-demo` remote) — pending Sam's push approval per CLAUDE.md §5
- [x] Plan-check round 1 dispatched (Gideon + Atlas) — Atlas APPROVE WITH NOTES, Gideon BLOCK
- [x] Sam accepted Gideon's 3 blockers (consent pattern, compliance sequencing, SOURCECODE drift) on 2026-04-16
- [x] Revise PRD.md (V1.1/V1.2 user stories + §6 Privacy Act row)
- [x] Revise SOURCECODE.md (add `/api/match` + accuracy rule reference)
- [x] Revise CLAUDE.md (add §3a route-table accuracy rule)
- [x] Insert P0.5 (scaffold scrub) + P4.5 (compliance gate); reshape P3/P5/P6/P7/P8
- [x] Plan-check round 2 dispatched (Gideon + Atlas on revised plan)
- [x] Gideon + Atlas plan-check sign-off recorded (both non-blocking — P1 unblocked after P0.5)
- [x] Absorb round 2 non-blocking notes (expanded P0.5 scope, SOURCECODE tree fix, APP 5 collection notice)
- [ ] Gideon + Atlas phase verify sign-off (closes P0)
- [ ] Write `planning/atlas-ai/APPROVAL.md` on Sam's Telegram "proceed" before `/gsd-execute-phase 0.5`

---

### Phase 0.5: Scaffold scrub + copy audit (HARD BLOCK on P1)
**Status:** not_started
**Started:** —
**Completed:** —
**Owner:** Gideon (code) + Atlas (copy review) + Neo (MARA legal check)
**Research sign-off:** Neo — (MARA Code of Conduct check vs current scaffold)
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Why this exists:** Gideon P0 plan-check BLOCK — the scaffold ships migration-advice strings (`web/src/lib/content.ts:33,61`; `web/src/app/api/chat/route.ts:21, 35-37`). These violate MARA Code of Conduct and must be removed before P1 commits to a schema that amplifies them.
**Tasks:**
- [ ] Scrub `web/src/lib/content.ts`: remove "real PR pathways" (L33), "98% student visa success rate" (L61), audit L69 and any other migration/visa claims
- [ ] Scrub `web/src/app/api/chat/route.ts` system prompt: remove MLTSSL/STSOL, subclass 500/485, PR points, post-study work references (L21, L35-37)
- [ ] Scrub `web/src/app/api/chat-simple/route.ts` system prompt under the same rule
- [ ] Scrub `web/src/components/ChatDrawer.tsx` (L7-12, 140): chip suggestions + placeholder currently reference PR / subclass 500 / subclass 485 / visas (Gideon round-2 citation)
- [ ] Scrub `web/src/components/MatcherForm.tsx` (L24, 35, 119-120, 165, 180, 201-207, 234, 260-264): `wantsPR` toggle + "visa pathway" CTA + pathway-result sections need MARA-safe rewrite
- [ ] Audit `web/src/components/LeadModal.tsx` L197-199: split "study and migration enquiry" checkbox into separate service/marketing consents (preps P3)
- [ ] Scrub `web/src/app/api/sop/route.ts` and `web/src/app/api/match/route.ts` for migration-advice leakage
- [ ] Scrub mobile side: `mobile/lib/mockData.ts` (L48, 94, 123, 139, 153-154, 162, 166-167, 172) + `mobile/app/(tabs)/profile.tsx` (L58-66) — PR-aware / migration outcomes / pathway references
- [ ] Grep gate (WIDENED per Atlas + Gideon round 2): `grep -riE "(subclass|MLTSSL|STSOL|PR points|PR pathway|visa success|migration advice|DoHA|points test|Permanent Residency|visa pathway|post-study work|migration outcomes|PR-aware|PR-eligible|wants_pr|wantsPR)" web/src/ mobile/` returns zero hits before phase closes
- [ ] Commit `fix(phase-0.5): scaffold scrub — remove migration-advice strings per MARA Code of Conduct (web + mobile)`

---

### Phase 1: Supabase project + AU universities seed
**Status:** not_started
**Owner:** Gideon (migrations + seed script) + Sam (Supabase dashboard)
**Research topic:** CRICOS open dataset; Supabase schema patterns for AU uni data; pgvector enablement
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Neo + Vector research — CRICOS public data shape, consent wording patterns
- [ ] Provision Supabase project in `ap-southeast-2`
- [ ] Enable pgvector extension
- [ ] Migrations: `universities`, `courses`, `leads`, `embeddings` tables + RLS
- [ ] Seed 43 AU universities from CRICOS + public uni pages
- [ ] Commit `feat(phase-1): Supabase schema + 43 AU unis seeded`

---

### Phase 2: Supabase Auth magic link
**Status:** not_started
**Owner:** Sam (Lovable) + Gideon (server validation)
**Research topic:** Supabase Auth v2 magic link patterns; RLS policies per role
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Echo research — AU-compliant session token handling
- [ ] Email-only magic link working on web
- [ ] RLS policies protect `leads` from public read
- [ ] Commit `feat(phase-2): Supabase Auth magic link + RLS`

---

### Phase 3: Lead capture (5-step + progressive save + scoring)
**Status:** not_started
**Owner:** Sam (Lovable form) + Gideon (API + scoring) + Atlas (UX copy + consent wording)
**Research topic:** Privacy Act 1988 consent wording; lead scoring heuristics for AU edu market
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Neo research — consent wording per Privacy Act 1988 s.6 + APP 3/5; service-vs-marketing split
- [ ] Step 1 shows explicit APP 5 collection notice BEFORE user enters personal info: "Atlas AI collects this information so UniMate's MARA-registered agents can respond. Stored only after you tick consent on step 5." (Gideon round 2 non-blocking note)
- [ ] UX copy surfaces the localStorage trade-off: "Progress saved locally on this device only — clear browser data / private mode / device switch will lose your draft until you submit step 5." (Atlas + Gideon round 2)
- [ ] Steps 1-4 persist only to `localStorage` client-side — zero server writes pre-consent
- [ ] Step 5: single atomic `INSERT` into `leads` with form fields + `consent_given_at` + `consent_wording_version` + `consent_service` (required true) + `consent_marketing` (bool)
- [ ] Consent UX: required checkbox (service) + optional checkbox (marketing) on step 5 — submit blocked until service ticked
- [ ] Submission emails Sam + UniMate via Resend (copy by Atlas)
- [ ] Lead score computed server-side in the same atomic write
- [ ] Verification: DB audit shows zero rows with `consent_service=false`
- [ ] Commit `feat(phase-3): lead capture — localStorage progressive save + consent-gated atomic write`

---

### Phase 4: UniMatch engine (backend API)
**Status:** not_started
**Owner:** Gideon (port matcher to API) + Atlas (weighting validation)
**Research topic:** Weighting strategy; QS WUR public data; CRICOS metadata
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Port existing JS matcher to `/api/match` reading from Supabase
- [ ] Returns ranked list with match % + reason text
- [ ] Caches per-user match result for 24h
- [ ] Commit `feat(phase-4): /api/match ranked against 43 AU unis`

---

### Phase 4.5: Compliance gate (HARD BLOCK on P5)
**Status:** not_started
**Owner:** Atlas (MARA-safe copy sign-off) + Gideon (code enforcement) + Neo (legal re-check)
**Research sign-off:** Neo — (final MARA / QEAC / Privacy Act verification before chat goes live)
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Why this exists:** Gideon P0 plan-check — compliance cannot sit at P8 while P5 is the chat surface. This gate verifies compliance BEFORE chat launches, not after.
**Tasks:**
- [ ] Site-wide MARA disclaimer footer wired (every page, not just chat routes)
- [ ] UniMate MARA registration number displayed in page footer with live registration link
- [ ] Chat system prompt (staging for P5): MARA-safe — deflects all visa/PR/migration questions; no hedged answers
- [ ] Per-turn chat-message footer disclaimer rendered in DOM (audit via screenshot diff)
- [ ] Privacy consent wording (service + marketing split) live on lead form step 5
- [ ] RLS policies verified: anon role has INSERT-only on `leads`; service role owns all reads
- [ ] Data residency verified: Supabase project region is `ap-southeast-2` (not the us-east default)
- [ ] Commit `feat(phase-4.5): compliance gate — MARA + Privacy Act + RLS verification`

---

### Phase 5: AI Advisor Chat + basic RAG
**Status:** not_started
**Owner:** Gideon (AI SDK wiring) + Atlas (system prompt + MARA-safe tone)
**Research topic:** MARA-safe prompt patterns; streaming chat latency; pgvector retrieval
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Switch demo OpenRouter → OpenAI `gpt-4o-mini`
- [ ] Embed 43 unis + CRICOS course metadata ONLY — no visa/PR/migration content (MARA rule from P0.5 + P4.5)
- [ ] System prompt enforces deflection: visa/PR/migration questions → "Consult a registered MARA agent" + UniMate link
- [ ] `/api/chat` streams with RAG retrieval + MARA disclaimer footer on every turn
- [ ] Abort/disconnect/backpressure handling + per-IP rate limit (Gideon P0 plan-check non-blocking note)
- [ ] Commit `feat(phase-5): chat with RAG + MARA-safe deflection + resilience`

---

### Phase 6: SOP Generator + PDF export
**Status:** not_started
**Owner:** Gideon (react-pdf component) + Atlas (SOP template voice)
**Research topic:** SOP best practices for AU uni applications; react-pdf layout
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Install `react-pdf` in `web/package.json` (NOT present today — this is net-new, not a "lift" per Gideon P0 plan-check)
- [ ] Rebuild SOP generator API off Supabase lead profile (replaces demo's shallow string-coercion approach in `web/src/app/api/sop/route.ts`)
- [ ] react-pdf client-side export with font preload + large-doc memory guard
- [ ] Edit + regenerate loop preserves section state via draft versioning
- [ ] Commit `feat(phase-6): SOP rebuild + react-pdf client export`

---

### Phase 7: Mobile rebrand (Expo app)
**Status:** not_started — **CAN RUN IN PARALLEL with P1–P4** (both Atlas + Gideon plan-check flagged: Play/App Store review adds 3–7 day latency; starting P7 only after P6 risks blocking ship)
**Owner:** Sam (Lovable/manual) + Gideon (asset pipeline)
**Research topic:** Expo OTA vs re-submit thresholds; Play Store review impact
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] `mobile/app.json`: name → "Atlas AI", slug → "atlas-ai", scheme → "atlasai"
- [ ] Bundle ID + package: `cloud.claudeking.atlasai`
- [ ] Icon + splash rebranded
- [ ] Copy strings audited for "UniMate" leftovers
- [ ] OTA update if bundle ID can stay same; else Play Store re-submit
- [ ] Commit `feat(phase-7): mobile rebrand to Atlas AI`

---

### Phase 8: Compliance final audit + pre-handover pack
**Status:** not_started — primary compliance work moved to P0.5 (scaffold scrub) + P4.5 (pre-chat gate); this phase is the final audit before client handover
**Owner:** Atlas (audit sweep) + Gideon (code verification) + Neo (legal re-scan)
**Research topic:** MARA Code of Conduct delta since P4.5; QEAC 2026 guideline updates
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Re-verify MARA disclaimer footer site-wide + per chat turn (regression check vs P4.5)
- [ ] Re-verify consent flags on every `leads` row (`consent_service=true` 100%)
- [ ] Verify UniMate MARA number + registration link in page footer
- [ ] Full fact-check pass — `grep -riE "(subclass|MLTSSL|STSOL|PR points|PR pathway|visa success|migration advice)" web/src/ mobile/` returns zero hits
- [ ] Generate compliance attestation doc for client handover pack (signed by Gideon + Atlas + Neo)
- [ ] Commit `feat(phase-8): compliance final audit + attestation`

---

### Phase 9: QA, handover docs, deploy
**Status:** not_started
**Owner:** Full org review (10 agents) + Sam for client handover
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Full org review via `/org-dispatch`
- [ ] Generate `~/Desktop/clients/unimate/ATLAS-AI-SOW.pdf` from PRD.md + plan §10
- [ ] Deploy to `atlas-ai.vercel.app`
- [ ] Keep `unimate-demo.vercel.app` aliased for 30 days
- [ ] Client walkthrough pack + 30-day bug-fix support note
- [ ] Post-v1 retrospective — dispatch Haiku + `/skill-creator` per plan §15
- [ ] Commit `chore(phase-9): v1 handover + SOW generated`

---

## Off-plan register

Any change that can't map to a phase above goes here BEFORE coding. Each row needs Sam's approval.

| Date | Change | Phase impact | Sam approved? |
|---|---|---|---|
| — | — | — | — |

---

## Approval gate

Sam writes a timestamped "proceed" line in `planning/atlas-ai/APPROVAL.md` via Telegram before `/gsd-execute-phase 1` runs. P0 is in-session; P1+ waits for the gate.
