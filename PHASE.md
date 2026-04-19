# PHASE.md — Atlas AI v1 Phase Tracker

**Plan locked:** 2026-04-16 · **Granularity:** fine · **Research + plan-check + verifier:** enabled
**Sign-off rule:** Gideon AND Neo must both sign off in a phase before it moves to `done` (Specter / NVIDIA Nemotron via NIM serves as NeMo Tron fallback if Neo/OpenCode infra is unavailable). No self-signoff by Koda. If they disagree, escalate to Sam.
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
**Status:** done
**Started:** 2026-04-16 22:59 AEDT
**Completed:** 2026-04-16 23:50 AEDT
**Owner:** Sam (file moves) + Koda (orchestration) + Gideon (string updates in later steps if needed)
**Research sign-off:** n/a (no research phase)
**Plan check sign-off:** Gideon 2026-04-16 (APPROVE WITH NOTES, round 2 — transcribed by Koda from `org/reviews/2026-04-16-atlas-ai-p0-plan-check/gideon-round-2.md`) | Atlas 2026-04-16 (APPROVE, round 2 — transcribed from `atlas-round-2.md`). Round 1 (Atlas APPROVE WITH NOTES, Gideon BLOCK) archived at same dir. **Atlas retired from this project after round 2** (Gemini quota/capacity issues); Neo replaces Atlas for all future phases per Sam 2026-04-16.
**Phase verify sign-off:** Gideon 2026-04-16 (PASS — `gpt-5.4-mini`, transcribed from `gideon-verify-v2-pass.md`) | Specter 2026-04-16 (PASS — NVIDIA `nemotron-3-super-120b-a12b` served as NeMo Tron fallback when Neo/OpenCode sandbox blocked external-dir reads; 14/14 checklist items; transcribed from `specter.md`)
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
- [x] Phase verify dispatched — Gideon PASS (`gpt-5.4-mini`) + Specter PASS (NeMo Tron fallback after Neo/OpenCode sandbox blocked `.vercel/` read)
- [x] Swap Atlas → Neo globally in PHASE.md + CLAUDE.md for all future phases (Specter as NeMo Tron fallback documented)
- [ ] Write `planning/atlas-ai/APPROVAL.md` on Sam's Telegram "proceed" before `/gsd-execute-phase 0.5`

---

### Phase 0.5: Scaffold scrub + copy audit (HARD BLOCK on P1)
**Status:** done
**Started:** 2026-04-17 00:05 AEDT (autonomous partial)
**Completed:** 2026-04-17 12:36 AEDT
**Owner:** Gideon (code) + Neo (copy review + MARA legal check) — Neo OpenCode unreachable for this phase; Specter (NVIDIA Nemotron via NIM) filled the fallback seat
**Research sign-off:** Gideon (implicit via plan-check review of MARA Code of Conduct violations)
**Plan check sign-off:** Gideon APPROVE-WITH-NOTES (round 2, 2026-04-17 12:20 AEDT, `.planning/research/p0.5-plan-check/gideon-v2.md`) | Specter APPROVE-WITH-NOTES (NeMo Tron fallback, 2026-04-17 12:23 AEDT, `.planning/research/p0.5-plan-check/specter-v1.md`)
**Phase verify sign-off:** Gideon PASS (round 2, 2026-04-17 12:36 AEDT, `.planning/research/p0.5-phase-verify/gideon-v2.md` — item 6 CLOSED after leads-route fix) | Specter PASS (NeMo Tron fallback, 2026-04-17 12:34 AEDT, `.planning/research/p0.5-phase-verify/specter-v1.md` — 14/14 PASS)
**Commits:** `f425837` (round-0 scrub, 14 files) + `2bedf83` (Gideon round-1 BLOCK fix, 3 files) + `4a81cc8` (Gideon phase-verify FAIL fix — /api/leads schema wiring, 2 files)
**Why this exists:** Gideon P0 plan-check BLOCK — the scaffold ships migration-advice strings (`web/src/lib/content.ts:33,61`; `web/src/app/api/chat/route.ts:21, 35-37`). These violate MARA Code of Conduct and must be removed before P1 commits to a schema that amplifies them.
**Tasks:**
- [x] Scrub `web/src/lib/content.ts` — full rewrite 2026-04-17 (removed PR pathway claim + visa success stat + visa-pathway CTA; replaced brand to Atlas AI powered by UniMate; MARA numbers now `{PENDING_FROM_UNIMATE}` placeholders until client provides)
- [x] Scrub `web/src/app/api/chat/route.ts` system prompt — full rewrite 2026-04-17 (removed MLTSSL/STSOL/subclass/PR-points/post-study-work; added hard deflection rule + per-turn disclaimer footer)
- [x] Scrub `web/src/app/api/chat-simple/route.ts` system prompt — mirrors chat/route.ts scrub 2026-04-17
- [x] Scrub `web/src/components/ChatDrawer.tsx` — SUGGESTED chips rewritten (no PR / subclass / visa); placeholder "Ask about courses, IELTS, fees…"
- [x] Scrub `web/src/components/MatcherForm.tsx` — `wantsPR` → `prioritizeOutcomes`; "Permanent Residency" checkbox → "strong graduate outcomes (industry placement + regional)"; indicative disclaimer rewritten
- [x] Split `web/src/components/LeadModal.tsx` consent — `consent_service` (required) + `consent_marketing` (optional) + `consent_wording_version`; full APP 5 notice (identity/purpose/consequences/sharing/legal/rights/policy ref)
- [x] Scrub `web/src/app/api/sop/route.ts` — added explicit NEVER clause for visa/migration/residency/post-study work
- [x] Scrub `web/src/app/api/match/route.ts` — zod schema renamed `wants_pr` → `prioritize_outcomes`
- [x] Type rename: `web/src/lib/types.ts` Student.wants_pr → prioritize_outcomes; Course.pr_eligible → industry_placement; LeadInput consent shape updated
- [x] Type rename: `web/src/lib/matcher.ts` — WEIGHTS.pr → WEIGHTS.outcomes; reason labels rewritten
- [x] Seed rename: `web/src/lib/universities.ts` helper + `web/src/lib/universities-seed.ts` (48 course entries) `pr_eligible` → `industry_placement`
- [x] Scrub mobile side: `mobile/lib/mockData.ts` reasons + prompts + types (prIntent→outcomesFocus, visaUpdate→admissionsUpdate); `mobile/app/(tabs)/profile.tsx` field blurbs + IELTS caption; `mobile/app/(tabs)/index.tsx` hero copy + import + tagline
- [x] /api/leads route wiring: `web/src/app/api/leads/route.ts` LeadSchema + email body updated to new consent fields (Gideon phase-verify catch)
- [x] Grep gate WIDENED: zero user-facing violations; 6 remaining hits ALL in MARA-required negative-constraint system-prompt language + 1 code comment
- [x] Typecheck clean (web + mobile both `tsc --noEmit` zero errors)
- [x] Commit `f425837 fix(phase-0.5): scaffold scrub — remove migration-advice strings per MARA Code of Conduct (web + mobile)`
- [x] Plan-check rounds 1-2 (Gideon + Specter — Neo unreachable, Specter is documented fallback)
- [x] Phase-verify rounds 1-2 (Gideon + Specter) — all 14 checklist items PASS

---

### Phase 1: Supabase project + AU universities seed
**Status:** done (2026-04-17 12:58 AEDT — dual-seat PASS, with DEV-001 region deviation + 3 P4.5 backlog items documented)
**Started:** 2026-04-17 12:36 AEDT (immediately after P0.5 closure)
**Completed:** 2026-04-17 12:58 AEDT
**Owner:** Koda (execution via Management API + PostgREST seed) + Sam (provisioning + PAT + DB password)
**Research topic:** CRICOS open dataset; Supabase schema patterns for AU uni data; pgvector enablement
**Plan check sign-off:** Gideon APPROVE-WITH-NOTES (`.planning/research/p1-plan-check/gideon-v1.md`, 2026-04-17 12:50 AEDT) | Specter APPROVE-WITH-NOTES (`.planning/research/p1-plan-check/specter-v1.md`, NeMo Tron fallback, 2026-04-17 12:51 AEDT)
**Phase verify sign-off:** Gideon PASS (`.planning/research/p1-phase-verify/gideon-v1.md`, 2026-04-17 12:55 AEDT, file:line citations across schema + seed + DEV-001) | Specter PASS (`.planning/research/p1-phase-verify/specter-v1.md`, 2026-04-17 12:56 AEDT, 12/12 PASS)
**Handoff doc:** `planning/atlas-ai/P1-HANDOFF.md` (superseded — execution path used Management API not `supabase db push`)
**Deviation log:** `planning/atlas-ai/DEVIATIONS.md` DEV-001 — project in `ap-southeast-1` not `ap-southeast-2` (Sam override); 4 downstream obligations gate production at P4.5
**Commit:** `5ac9bf7 feat(phase-1): apply schema + seed 12 unis to Supabase ap-southeast-1 — region deviation recorded`
**Tasks:**
- [x] **Supabase project provisioned** (2026-04-17, Sam) — `szuqcptsmmgycvagteza` in `ap-southeast-1` (DEVIATION from PRD §6 target `ap-southeast-2` — Sam override, DEV-001)
- [x] API keys in `web/.env.local` (gitignored) — legacy JWT anon + service_role + new v2 publishable + secret + PAT + DB password
- [x] pgvector 0.8.0 + uuid-ossp 1.1 extensions enabled (via schema migration CREATE EXTENSION)
- [x] Schema applied via Management API `/v1/projects/{ref}/database/query` (HTTP 201) — 4 tables + 2 extensions + 3 RLS policies + 2 CHECK constraints on leads
- [x] Seed data applied via `web/scripts/seed-universities.ts --apply` (service_role PostgREST): **12 universities + 48 courses** (scope gap vs aspirational 43 — P4.5 backfill backlog item)
- [x] RLS behavior live-verified: anon SELECT universities/courses = 200; anon SELECT leads = [] (default-deny); anon INSERT leads with consent_service=true = 201; service_role bypasses RLS
- [x] CHECK constraints enforced: `leads_consent_service_must_be_true`, `leads_email_basic_shape`
- [x] Env template: `web/.env.example`
- [x] Seed script: `web/scripts/seed-universities.ts` with dry-run + --apply + --wipe modes
- [x] Plan-check dual-seat (Gideon + Specter — both APPROVE-WITH-NOTES)
- [x] Phase-verify dual-seat (Gideon + Specter — both PASS, 12/12)
- [x] Commit `5ac9bf7 feat(phase-1): apply schema + seed 12 unis to Supabase ap-southeast-1 — region deviation recorded`
- [x] P1 handoff doc obligations captured in DEVIATIONS.md for P4.5 review

**P4.5 backlog from P1 (production gates):**
1. APP 8 cross-border disclosure in LeadModal APP 5 notice (Singapore hosting)
2. Backfill 31 more universities to reach PRD §4 "43 AU unis" target
3. Backfill per-course `cricos_code` (currently NULL for all 48 — PRD §5 + QEAC rule)
4. Add `industry_placement` column to `courses` DB schema (currently client-type only)

---

### Phase 2: Supabase Auth magic link (infrastructure only)
**Status:** done (2026-04-17 13:05 AEDT — dual-seat PASS, infrastructure-only scope per Koda push-back + Sam approval)
**Started:** 2026-04-17 13:00 AEDT
**Completed:** 2026-04-17 13:05 AEDT
**Owner:** Koda (implementation) + Gideon + Specter (review)
**Research topic:** Supabase SSR v2 (`@supabase/ssr`) patterns for Next.js 16 App Router; magic link PKCE/OTP flow
**Plan check sign-off:** Gideon APPROVE-WITH-NOTES (`.planning/research/p2-plan-check/gideon-v1.md`) | Specter APPROVE-WITH-NOTES (`.planning/research/p2-plan-check/specter-v1.md`)
**Phase verify sign-off:** Gideon PASS (`.planning/research/p2-phase-verify/gideon-v1.md`, 10/10) | Specter PASS (`.planning/research/p2-phase-verify/specter-v1.md`, 10/10)
**Commit:** `809d7dc feat(phase-2): Supabase Auth magic link infrastructure`
**Scope decision:** Koda pushed back on "Auth magic link" as a user-facing feature given admin dashboard (X.1) was cut to v2 + V1.1–V1.4 anonymous by design. Sam directed: build as INFRASTRUCTURE ONLY. Result: auth plumbing wired + config applied, no user-facing login wall. Satisfies PRD §4 stack requirement while preserving anonymous-first UX.
**Tasks:**
- [x] Install `@supabase/ssr` (current Next.js SSR helper, replaces deprecated auth-helpers-nextjs)
- [x] `src/lib/supabase/client.ts` — browser client factory
- [x] `src/lib/supabase/server.ts` — server client factory with cookies.getAll/setAll
- [x] `src/lib/supabase/middleware.ts` — `updateSession()` helper; calls `auth.getUser()` immediately; NO redirect (anonymous-first design)
- [x] `web/middleware.ts` — Next.js middleware entrypoint
- [x] `src/app/auth/callback/route.ts` — GET handler using `verifyOtp({ type, token_hash })`, redirects via pathname (no open-redirect)
- [x] `src/app/auth/auth-code-error/page.tsx` — error page with "Request a new link" CTA
- [x] `src/app/login/page.tsx` — magic link request form with "check your email" confirmation state
- [x] Supabase config via Management API: site_url, uri_allow_list (localhost + prod + preview), external_email_enabled, 1h OTP expiry
- [x] `next build` + `tsc --noEmit` clean
- [x] Magic link generation tested via Admin API (test user created + deleted clean)
- [x] Plan-check dual-seat PASS (Gideon + Specter)
- [x] Phase-verify dual-seat PASS (Gideon + Specter, 10/10 each)

**Non-blocking note from both seats (P4 improvement):**
- Prefer `auth.getClaims()` over `auth.getUser()` in middleware per latest Supabase SSR guide. Non-blocker for P2 close; consider swapping when P4 adds auth-gated server logic.

**Known gaps (intentional, v2 scope):**
- No admin page (admin dashboard X.1 cut to v2)
- No `@me` profile page (no use case in v1)
- Middleware does NOT redirect (would break anonymous UX)

---

### Phase 3: Lead capture (5-step + progressive save + scoring)
**Status:** ✅ done (closed 2026-04-18 02:56 AEST — single-seat Gideon PASS round 2)
**Owner:** Sam (product + approval) + Koda (hand-coded Next.js extensions — no Lovable per `feedback_atlas-ai-hand-coded.md`)
**Research topic:** APP 8 Singapore disclosure verbatim per DEV-001; lead scoring heuristics validated against 12-uni G8-heavy seed (see `.planning/3-PLAN.md` Delta #3)
**Review protocol:** **Single-seat Gideon on `gpt-5.4` full** (supersedes P0–P2 dual-seat; reference `feedback_agent-model-calibration.md` updated 2026-04-17)
**Plan check sign-off:** Gideon APPROVE round 2 (2026-04-17 23:40 AEST) — transcripts `/tmp/atlas-p3-plancheck-output.md` + `/tmp/atlas-p3-plancheck-r2-output.md`
**Phase verify sign-off:** Gideon PASS round 2 (2026-04-18 02:56 AEST) — transcripts `/tmp/atlas-p3-phaseverify-output.md` + `/tmp/atlas-p3-phaseverify-r2-output.md`
**Tasks:**
- [x] Neo research — consent wording per Privacy Act 1988 s.6 + APP 3/5; service-vs-marketing split *(reassigned to Gideon per single-seat protocol — verbatim APP 5 + APP 8 notice in `web/src/components/lead/Step5Contact.tsx:23-53`)*
- [x] Step 1 shows explicit APP 5 collection notice BEFORE user enters personal info *(`web/src/components/lead/Step1Personal.tsx:14-27`)*
- [x] UX copy surfaces the localStorage trade-off *(`web/src/components/lead/Step1Personal.tsx:23-26`)*
- [x] Steps 1-4 persist only to `localStorage` client-side — zero server writes pre-consent *(`LeadModal.tsx:82-149, 194-198, 235-256`)*
- [x] Step 5: single atomic `INSERT` into `leads` with form fields + consent fields *(`/api/leads/route.ts:56-83, 95-137`; consent fields at 124-130)*
- [x] Consent UX: required + optional checkboxes on step 5, submit blocked until service ticked *(`Step5Contact.tsx:96-123`; gating in `LeadModal.tsx:45-47, 237-239, 401-407`)*
- [x] Submission emails Sam + UniMate via Resend *(`/api/leads/route.ts:157-176`; env wiring `.env.example:21-25`)*
- [x] Lead score computed server-side in the same atomic write *(`/api/leads/route.ts:46-47` calls `lead-score.ts:computeScore`)*
- [x] Verification: DB audit enforced via CHECK constraint — zero rows with `consent_service=false` possible *(`supabase/migrations/001_initial_schema.sql:96`)*
- [x] Commit `feat(phase-3): lead capture ...` *(commit chain: 8c01d3d plan-lock, e93202a Wave A, 818fafa Wave B, 3a82436 Wave C, b210d69 Wave D, 68a9a9b phase-verify fixes)*

---

### Phase 4: UniMatch engine (backend API)
**Status:** done (2026-04-20 00:55 AEST — 6-wave execution; Round-5 4-persona contract PASS; migration 005 stretch_flag fix live on szuqcptsmmgycvagteza; must_have #3 REVOKE/GRANT failure-injection PASS; MARA grep gate clean; `npm run build` PASS)
**Owner:** Gideon (port matcher to API) + Neo (weighting validation) — single-seat Gideon per 2026-04-17 protocol
**Research topic:** Weighting strategy; QS WUR public data; CRICOS metadata
**Plan check sign-off:** Gideon APPROVE r4 (single-seat gpt-5.4, 2026-04-19 19:22 AEST; 4 rounds: R1/R2/R3 BLOCK absorbed 9 issues → R4 APPROVE)
**Phase verify sign-off:** Gideon PASS-WITH-NOTES (single-seat gpt-5.4, 2026-04-20 01:13 AEST, `.planning/research/p4-phase-verify/gideon-v1.md` — 4 PASS + 4 PASS-WITH-NOTES, zero push blockers; notes are verification-surface only: must_have #3 REVOKE/GRANT live-run + must_have #4 browser 31-min expiry UAT deferred to P4.5 harness) | Neo n/a (single-seat protocol)
**Commits:** `807c452` W1 + `448045b` W2 + `72200ec` W3 + `f0b0a70` W4 + `cf82e9a` W5 + `e2a6163` W6
**Tasks:**
- [x] Port existing JS matcher to `/api/match` reading from Supabase *(superseded — `match_unis_for_lead(uuid, jsonb)` RPC in `supabase/migrations/004_match_function.sql` + stretch_flag fix in `005_match_function_stretch_fix.sql`; orphan `/api/match/route.ts` deleted in `f0b0a70`; ranking now invoked inline from `/api/leads`)*
- [x] Returns ranked list with match % + reason text *(`web/src/lib/match-schema.ts` MatchResultSchema + `web/src/lib/match-reason.ts` reason template + `web/src/app/matches/[token]/page.tsx` Server Component render; MARA banner via `web/src/lib/mara-disclaimer.ts` canonical constant)*
- [x] Caches per-user match result for 24h *(side-effect UPDATE in RPC persists to `leads.matches` + `leads.matches_computed_at`; `/matches/[token]` reads via `match_token` uuid with magic-link fallback)*
- [x] Commit `feat(phase-4): /api/match ranked against 43 AU unis` *(superseded by 6 atomic Wave commits above — one per wave, Round-5 contract locked post-005 after Sam accepted Path A for Gideon R1 Blocker #4 unachievable-arrays discovery; debug transcript at `.planning/debug/wave-6-persona-smoke-failures.md`)*

---

### Phase 4.5: Compliance gate (HARD BLOCK on P5)
**Status:** not_started
**Owner:** Gideon (code enforcement) + Neo (MARA-safe copy sign-off + legal re-check)
**Research sign-off:** Neo — (final MARA / QEAC / Privacy Act verification before chat goes live)
**Plan check sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Phase verify sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Why this exists:** Gideon P0 plan-check — compliance cannot sit at P8 while P5 is the chat surface. This gate verifies compliance BEFORE chat launches, not after.
**Tasks:**
- [ ] Site-wide MARA disclaimer footer wired (every page, not just chat routes)
- [ ] UniMate MARA registration number displayed in page footer with live registration link
- [ ] Chat system prompt (staging for P5): MARA-safe — deflects all visa/PR/migration questions; no hedged answers
- [ ] Per-turn chat-message footer disclaimer rendered in DOM (audit via screenshot diff)
- [ ] Privacy consent wording (service + marketing split) live on lead form step 5
- [ ] RLS policies verified: anon role has INSERT-only on `leads`; service role owns all reads
- [ ] Data residency verified: Supabase project region is `ap-southeast-2` (not the us-east default)
- [ ] **APP encryption verification** (Vector mini round-2 finding 2026-04-17): verify Supabase Postgres encryption at rest (AES-256 by default) + TLS 1.2+ in transit; document in compliance attestation
- [ ] Commit `feat(phase-4.5): compliance gate — MARA + Privacy Act + RLS + APP encryption verification`

---

### Phase 5: AI Advisor Chat + basic RAG
**Status:** not_started
**Owner:** Gideon (AI SDK wiring) + Neo (system prompt + MARA-safe tone)
**Research topic:** MARA-safe prompt patterns; streaming chat latency; pgvector retrieval
**Plan check sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Phase verify sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
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
**Owner:** Gideon (react-pdf component) + Neo (SOP template voice)
**Research topic:** SOP best practices for AU uni applications; react-pdf layout
**Plan check sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Phase verify sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
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
**Plan check sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Phase verify sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
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
**Owner:** Gideon (code verification) + Neo (audit sweep + legal re-scan)
**Research topic:** MARA Code of Conduct delta since P4.5; QEAC 2026 guideline updates
**Plan check sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Phase verify sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Tasks:**
- [ ] Re-verify MARA disclaimer footer site-wide + per chat turn (regression check vs P4.5)
- [ ] Re-verify consent flags on every `leads` row (`consent_service=true` 100%)
- [ ] Verify UniMate MARA number + registration link in page footer
- [ ] Full fact-check pass — `grep -riE "(subclass|MLTSSL|STSOL|PR points|PR pathway|visa success|migration advice)" web/src/ mobile/` returns zero hits
- [ ] Generate compliance attestation doc for client handover pack (signed by Gideon + Neo)
- [ ] Commit `feat(phase-8): compliance final audit + attestation`

---

### Phase 9: QA, handover docs, deploy
**Status:** not_started
**Owner:** Full org review (10 agents) + Sam for client handover
**Plan check sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Phase verify sign-off:** Gideon — | Neo — (fallback: Specter/NeMo Tron)
**Tasks:**
- [ ] Full org review via `/org-dispatch`
- [ ] Generate `~/Desktop/clients/unimate/ATLAS-AI-SOW.pdf` from PRD.md + plan §10
- [ ] Deploy to `atlas-ai.vercel.app`
- [ ] Keep `unimate-demo.vercel.app` aliased for 30 days
- [ ] Client walkthrough pack + 30-day bug-fix support note
- [ ] **OAIC Notifiable Data Breaches plan** (Echo mini round-2 finding 2026-04-17): draft + hand UniMate a documented NDB response plan (who detects, who notifies OAIC within 72h, template notification wording). Not optional under Privacy Amendment 2017.
- [ ] Post-v1 retrospective — dispatch Haiku + `/skill-creator` per plan §15
- [ ] Commit `chore(phase-9): v1 handover + SOW generated + NDB plan delivered`

---

## Off-plan register

Any change that can't map to a phase above goes here BEFORE coding. Each row needs Sam's approval.

| Date | Change | Phase impact | Sam approved? |
|---|---|---|---|
| — | — | — | — |

---

## Approval gate

Sam writes a timestamped "proceed" line in `planning/atlas-ai/APPROVAL.md` via Telegram before `/gsd-execute-phase 1` runs. P0 is in-session; P1+ waits for the gate.
