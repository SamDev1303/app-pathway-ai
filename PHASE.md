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
**Plan check sign-off:** Gideon — | Atlas —
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
- [ ] Gideon + Atlas plan-check sign-off (pre P1)
- [ ] Gideon + Atlas phase verify sign-off (closes P0)
- [ ] Write `planning/atlas-ai/APPROVAL.md` on Sam's Telegram "proceed" before `/gsd-execute-phase 1`

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
- [ ] Neo research — consent wording signed off against Privacy Act 1988 s.6
- [ ] Form step 1-5 persists to Supabase on each step
- [ ] Submission emails Sam + UniMate via Resend (copy by Atlas)
- [ ] Lead score computed + stored
- [ ] Commit `feat(phase-3): lead capture 5-step + consent + score`

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

### Phase 5: AI Advisor Chat + basic RAG
**Status:** not_started
**Owner:** Gideon (AI SDK wiring) + Atlas (system prompt + MARA-safe tone)
**Research topic:** MARA-safe prompt patterns; streaming chat latency; pgvector retrieval
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Switch demo OpenRouter → OpenAI `gpt-4o-mini`
- [ ] Embed 43 unis + visa subclass 500 basics into `embeddings` table
- [ ] `/api/chat` streams with RAG retrieval + MARA disclaimer on every turn
- [ ] Commit `feat(phase-5): chat with RAG + MARA disclaimer`

---

### Phase 6: SOP Generator + PDF export
**Status:** not_started
**Owner:** Gideon (react-pdf component) + Atlas (SOP template voice)
**Research topic:** SOP best practices for AU uni applications; react-pdf layout
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] Lift existing SOP generator from demo
- [ ] react-pdf client-side export
- [ ] Edit + regenerate loop preserves section state
- [ ] Commit `feat(phase-6): SOP generator + PDF export`

---

### Phase 7: Mobile rebrand (Expo app)
**Status:** not_started
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

### Phase 8: AU compliance + disclaimers
**Status:** not_started
**Owner:** Atlas (compliance copy) + Gideon (enforcement in code) + Neo (legal scan)
**Research topic:** MARA Code of Conduct latest; QEAC 2026 guidelines
**Plan check sign-off:** Gideon — | Atlas —
**Phase verify sign-off:** Gideon — | Atlas —
**Tasks:**
- [ ] MARA disclaimer footer on every page + every chat turn
- [ ] Consent checkboxes + `consent_given_at` + `consent_wording_version` live
- [ ] UniMate MARA number displayed in page footer
- [ ] Fact-check pass — no migration advice anywhere in the app
- [ ] Commit `feat(phase-8): AU compliance + MARA disclaimers`

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
