# Phase 3 — Lead capture (5-step + progressive save + scoring)

**Created:** 2026-04-17 · session 4 (post-resume)
**Domain:** Convert the existing single-step `LeadModal.tsx` into a 5-step progressive wizard with localStorage draft persistence, atomic Supabase INSERT on consent, server-side lead scoring, dual-recipient email, and APP 8 Singapore cross-border disclosure.

**Not in scope:** Matcher engine (Phase 4), SOP generator (Phase 6), admin CRM surface (cut to v2), chat UI (Phase 5). Scope creep redirects to `<deferred>` below.

---

## <prior_decisions>

Already locked in earlier phases — do not re-ask downstream.

### From PRD + P0.5
- **Consent split:** `consent_service` required + `consent_marketing` optional. Enforced by DB CHECK constraint `consent_service = true`.
- **Consent wording version string:** `"2026-04-17.v1"` — bump when wording changes.
- **MARA Code compliance:** no migration / visa / PR strings anywhere in form copy. Re-verified in P4.5.
- **Field rename:** `wants_pr → prioritize_outcomes` and `pr_eligible → industry_placement` (DB + types already aligned).

### From P1 (DB + DEV-001)
- **Supabase region:** `ap-southeast-1` (Singapore) — accepted deviation. **APP 8 cross-border disclosure is P3's obligation** per `planning/atlas-ai/DEVIATIONS.md` §"Downstream obligations #1".
- **`leads` table:** schema at `supabase/migrations/001_initial_schema.sql` lines 62–98. All 5-step columns + consent columns already present. RLS: anon has INSERT-only.
- **`consent_wording_version`** is TEXT NOT NULL — every INSERT must set it.

### From P2
- Auth is magic-link infrastructure only. Lead form is **anonymous** — do NOT require login to submit.

---

## <decisions>

Locked this session. Downstream agents (researcher + planner + executor) act on these without re-asking.

### D1 — Form build approach
Extend the existing hand-coded Next.js 16 component tree. **No Lovable, no Bolt, no no-code rebuild** — PRD §5 is stale on this point. Memory reference: `feedback_atlas-ai-hand-coded.md`.

### D2 — Component structure
**Split into per-step subcomponents.** New files:
- `web/src/components/lead/Step1Personal.tsx`
- `web/src/components/lead/Step2Academic.tsx`
- `web/src/components/lead/Step3Preferences.tsx`
- `web/src/components/lead/Step4Budget.tsx`
- `web/src/components/lead/Step5Contact.tsx`

`LeadModal.tsx` keeps wrapper responsibilities: step state, draft hydration, navigation (Back/Next/Skip), submit handler, APP 5 + APP 8 notice block, consent checkboxes. Step components receive `values + onChange + onNext + onBack` props.

**No `react-hook-form`.** Raw `useState` + existing Zod schema lifted to `web/src/lib/lead-schema.ts` (shared between client validation and `/api/leads/route.ts`). Adding a form library is premature for 5 steps of plain inputs.

### D3 — Wizard shape
**Modal, widened to `max-w-2xl`.** Keeps the contextual-CTA flow. Progress indicator is `•••○○ Step 3 of 5` on mobile (dot row), `Personal · Academic · Preferences · Budget · Contact` on md+ (full labels). Framer Motion horizontal slide between steps (x: +30 → 0 on forward, x: -30 → 0 on back). Modal height `max-h-[92vh]` preserved; internal scroll.

### D4 — Required fields per step
| Step | Required to advance |
|---|---|
| 1 Personal | `full_name`, `email`, `phone`, `country` |
| 2 Academic | none (all optional; Skip button visible) |
| 3 Preferences | none (Skip allowed) |
| 4 Budget | none (Skip allowed) |
| 5 Contact + Consent | `consent_service = true` (gates submit) |

Skip button style: text link, `• Skip this step`, beside the Next button on steps 2–4.

### D5 — Step-3 uni-match teaser (V1.2 / V1.3 scope boundary)
**Hard-stub with deterministic mock matches.** After user fills step 3 preferences and clicks Next, show an inline teaser card: top-3 unis with mock match % computed client-side from `preferred_fields` overlap against the 12 seeded universities' course names. Computed in `web/src/lib/match-stub.ts`. P4 replaces this stub with a real `/api/match` call. Zero DB schema churn; the teaser is UI-only and does not persist anything.

**Teaser must display a disclaimer:** `"Preview match — final ranking appears after you complete your enquiry."` So students aren't misled by the stub quality.

### D6 — Lead scoring formula
**4-dimension A/B/C/D tier, computed server-side inside the atomic INSERT, NOT shown to the student.**

Dimensions (each contributes 0–25, max 100):
- **Budget realism:** student's `tuition_budget_aud` vs AUD 38k/year median course cost. ≥35k = 25, 28–35k = 18, 20–28k = 10, <20k = 0, null = 5.
- **IELTS readiness:** `ielts_overall` ≥ 6.5 = 25, 6.0–6.4 = 15, 5.5–5.9 = 5, <5.5 = 0, null = 5.
- **Intake proximity:** `preferred_intake_month` within next 6 months = 25, 7–12 months = 15, >12 months = 5, null = 5.
- **Preference specificity:** `preferred_fields` ≥1 + `preferred_levels` ≥1 = 25, one filled = 12, both empty = 0.

Tier mapping: **A ≥ 80 · B 60–79 · C 40–59 · D < 40**.

Surfacing:
- Stored as `lead_score` int (0–100) in DB.
- Shown in Sam+UniMate email: `Lead score: 78 (tier B)`.
- **Never shown to the student.**

Implementation: `web/src/lib/lead-score.ts`, pure function `computeScore(lead: LeadInput): { score: number; tier: 'A'|'B'|'C'|'D' }`.

### D7 — localStorage draft
**Key:** `atlas-ai.lead-draft.v1` (namespaced so future schema bumps can invalidate cleanly).

**Shape:** `{ values: Partial<LeadInput>, currentStep: number, saved_at: ISO8601, schema_version: "v1" }`.

**Rules:**
- Save on every field blur + every Next click (debounced 300ms).
- On mount: hydrate if `saved_at > now - 30d` AND `schema_version === current`. Else clear.
- On successful step-5 submit: clear draft immediately.
- On schema_version bump: clear stale drafts silently (no modal).

**UX copy for draft-recovery banner on re-entry:** `"Picking up where you left off — saved on this device only."` Dismissible.

**PRD-required copy on Step 1:** `"Progress is saved to this browser only. Clearing browser data, private mode, or switching devices will lose your draft until you submit step 5."` (Per P0.5 + P3 task "UX copy surfaces the localStorage trade-off".)

### D8 — APP 5 + APP 8 notice block
Replace the existing APP 5 block in `LeadModal.tsx` lines 192–208. Keep all current paragraphs. **Insert new paragraph** between "Who we share it with" and "Your rights":

> **Where we store it.** Your information is stored on Supabase servers hosted in Singapore (`ap-southeast-1`). This is a cross-border disclosure under APP 8 of the *Privacy Act 1988 (Cth)*. Supabase is contractually bound to Australian privacy standards, and UniMate ensures reasonable steps are taken to comply with APPs in relation to overseas disclosures.

Wording source: `planning/atlas-ai/DEVIATIONS.md` §"Downstream obligations #1". Bump `consent_wording_version` to **`"2026-04-17.v2"`** on this change (v1 → v2 because wording materially changed).

### D9 — Email recipients
**Both Sam and UniMate.** Recipient list assembled in `web/src/app/api/leads/route.ts`:
- `adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? 'sam@claudeking.org'`
- `unimateEmail = process.env.UNIMATE_LEAD_EMAIL ?? 'sam@claudeking.org'` *(fallback to Sam pre-launch so no lead ever bounces)*
- `to: [adminEmail, unimateEmail]` — Resend de-duplicates if both equal.

`.env.example` gets a new line: `UNIMATE_LEAD_EMAIL=replace-with-unimate-address@example.com`.

Email body adds `Lead score: {score} (tier {tier})` line.

**Sam client-side task (not code):** Ask UniMate for their real lead-notification address before P4.5 launch.

### D10 — Atomic INSERT + email on step-5 submit
Current `/api/leads/route.ts` emails but does **not** INSERT. Close that gap:

1. Parse + Zod-validate payload.
2. Compute `lead_score` + `tier` via `lead-score.ts`.
3. `stamp consent_given_at = new Date().toISOString()` server-side (not trusted from client).
4. INSERT into `leads` via Supabase service-role client (not anon — so the CHECK runs server-side with trusted timestamps).
5. On INSERT success: fire Resend email.
6. On INSERT failure: return 500, do NOT send email, surface friendly error to client.
7. On email failure AFTER successful INSERT: log + return 200 (lead is captured, we'll re-notify manually; losing a lead is worse than missing an email).

Response contract stays `{ ok: boolean, error?: string }`.

---

## <specifics>

Concrete files + line numbers downstream agents need:

- **Existing modal to refactor:** `web/src/components/LeadModal.tsx` (278 LoC). APP 5 notice block lines 192–208. Consent checkboxes lines 210–233. Field component helper lines 260–278.
- **API route to extend:** `web/src/app/api/leads/route.ts` (76 LoC). Current Zod schema lines 4–13 — lift to `web/src/lib/lead-schema.ts`. Email send block lines 46–66 — wrap with INSERT-first sequence.
- **DB schema:** `supabase/migrations/001_initial_schema.sql` leads table lines 62–98. CHECK constraint line 96. RLS INSERT policy line 133 — note this is for anon; we'll use service_role from the API route.
- **Seed data for match stub:** `supabase/seed/*` (12 universities; need to inspect exact file during planning).
- **Branded CSS vars:** defined in `web/src/app/globals.css` (`--color-cream`, `--color-navy-950`, `--color-gold-500`, etc.). Step subcomponents inherit; do not duplicate.
- **Design primitives:** `rail-gold`, `paper-grain`, `eyebrow`, `font-display` classes — already used in LeadModal, keep consistent across step components.

---

## <canonical_refs>

Every ref below has a full relative path. Planner + researcher **must read these before writing PLAN.md**.

- `PRD.md` §2 V1.2 (scope) · §4 V1.2 user stories · §5 tech stack · §6 AU compliance
- `PHASE.md` §"Phase 3: Lead capture" (lines 155–172) — 9 tasks
- `planning/atlas-ai/DEVIATIONS.md` §DEV-001 (Singapore APP 8 obligations assigned to P3)
- `planning/atlas-ai/APPROVAL.md` — prior-phase sign-offs (pattern to follow)
- `.planning/HANDOFF.json` — session 3 close state (P3 entry conditions)
- `supabase/migrations/001_initial_schema.sql` — leads table shape of record
- `web/src/components/LeadModal.tsx` — component being refactored
- `web/src/app/api/leads/route.ts` — API route being extended
- `CLAUDE.md` §§"Plan check" and "Phase verify" — dual-seat review protocol (Gideon + Neo/Specter fallback)

---

## <deferred>

Scope-creep items parked here, not promoted to backlog yet.

- **Email draft-recovery link:** send student a one-click resume link if they abandon mid-wizard. New capability → v2 or P6 Sequence module.
- **File upload (transcripts, passport):** separate capability, opens new legal + storage scope. v2.
- **Autosave indicator animation:** "Saved" toast every step. Nice-to-have; if trivial during execute-phase, Claude's discretion.
- **Lead score shown to student:** explicitly rejected in D6. Do not re-propose without client ask.
- **Multi-language form:** V1 is English only. v2 scope.

---

## <open_for_planner>

Items the planner + researcher must close during `/gsd-plan-phase 3`:

1. **Neo research:** consent wording phrasing per Privacy Act 1988 s.6 + APP 3/5 — confirm that the split-consent wording in `LeadModal.tsx` lines 218–232 is sufficient, or prescribe edits. This is PHASE.md task #1 and a blocker for plan sign-off.
2. **Median AU course cost (AUD/year):** D6 uses $38k/year as the budget-realism anchor. Researcher should validate against 2026 CRICOS data or substitute a defensible number. If a per-course median is more accurate, the scoring function should take a uni-list parameter.
3. **Step-order UX validation:** should step 3 (Preferences) come before step 4 (Budget), or swap? Budget-before-preferences gives better filter context but feels more transactional. Planner checks against competitor AU edu lead forms (IDP, Study Australia) and recommends.
4. **Skip button copy:** `"• Skip this step"` vs `"Skip"` vs `"I'll come back"` — final pick for Neo.
5. **Teaser UI shape:** inline card inside Step 3 vs dedicated Step 3.5 reveal? Small UX call — planner recommends.

---

## <review_protocol>

**Single-seat Gideon on full `gpt-5.4` for all code, review, debug, and verify work** — Sam directive 2026-04-17. Supersedes the dual-seat + mini-for-review pattern used in P0–P2. Reference memory: `feedback_agent-model-calibration.md` (updated same day).

- **Reviewer:** Gideon (Codex CLI).
- **Model flag:** `-m gpt-5.4` — never `gpt-5.4-mini`. Never Neo. Never Specter. Never Atlas.
- **Invocation shape:** `codex exec -m gpt-5.4 --full-auto < prompt.md` for plan-check, phase-verify, and any debug pass.
- **Sign-off surfaces:** update `PHASE.md` §Phase 3 "Plan check sign-off" and "Phase verify sign-off" lines — note Gideon-only in both slots (strike through or mark N/A the former "Neo / Specter fallback" column).
- **Pre-check:** none needed — no second-seat reachability ping before plan-phase.

**Exception carve-out:** if a specific decision inside P3 hits a compliance seam Koda cannot confidently close on (e.g., APP 8 wording interpretation that goes beyond the DEVIATIONS.md text), surface it to Sam before dispatch instead of auto-spawning a second seat.

---

## Next step

`/gsd-plan-phase 3` — produce `3-PLAN.md` with task breakdown + researcher's Neo consent wording output + verification criteria. Then Telegram approval gate → `/gsd-execute-phase 3`.
