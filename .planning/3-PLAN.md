# Phase 3 — PLAN.md (Lead capture — 5-step + progressive save + scoring)

**Created:** 2026-04-17 · session 4
**Upstream:** `.planning/3-CONTEXT.md` · `PRD.md` v1.1 · `PHASE.md` §Phase 3 · `planning/pathway-ai/DEVIATIONS.md` §DEV-001
**Review protocol:** single-seat Gideon on `-m gpt-5.4` (supersedes dual-seat — see `feedback_agent-model-calibration.md`)
**Budget position:** within $3,000 fixed. N8N pipeline ships dormant per PRD §3 X.1.1 (+$200 activation add-on).

---

## Delta from CONTEXT.md (refinements after pre-plan scouting)

1. **Email env var:** CONTEXT D9 proposed `UNIMATE_LEAD_EMAIL`. Actual repo has `LEAD_NOTIFY_EMAILS=<comma-sep>` already in `.env.example`. Plan uses the existing var (no churn).
2. **No Make.com, no N8N call from app code:** CONTEXT D10 had a webhook POST step inside `/api/leads/route.ts`. PRD v1.1 removed Make.com; N8N is now a Pathway-AI-hosted dormant add-on (X.1.1). `/api/leads` will NOT call any webhook. Supabase DB Webhooks handle the N8N hand-off entirely outside Next.js.
3. **Budget anchor for scoring:** CONTEXT D6 used $38k/yr median. The actual 12-uni seed is G8-heavy (UNSW/USyd undergrad IT ≈ $53–56k). Revised anchors:
 - ≥ $45k = 25 · $35–44.9k = 18 · $25–34.9k = 10 · <$25k = 0 · null = 5
4. **Consent wording version bump:** `2026-04-17.v1` → `2026-04-17.v2` because the APP 5 notice gains a new "Where we store it" APP 8 paragraph (DEV-001 requirement).

---

## Scope

**In:** 5-step lead wizard (Personal → Academic → Preferences → Budget → Contact), localStorage draft, atomic Supabase INSERT on consent, server-side lead scoring (A/B/C/D tier), dual-recipient email via Resend, APP 5 + APP 8 notice block, Step-3 deterministic match-stub teaser, N8N dormant pipeline artifacts (workflow JSON + README), PRD v1.1 + `.env.example` updates.

**Out:**
- Real matcher engine (Phase 4)
- Admin UI / CRM dashboard (cut to v2 as X.1)
- Live N8N activation (PRD X.1.1 post-launch add-on)
- Magic-link auth gating on the form (v1 is anonymous — PRD §4 V1.2)
- File uploads / transcript attachments (v2)

**Scope discipline:** Any "we could also…" surfaced during execution → `<deferred>` section of `3-CONTEXT.md`, not added to this plan.

---

## Task waves (dependency-ordered, within-wave parallelizable)

### Wave A — Shared foundations
*No cross-dependencies within the wave. Can run concurrently.*

- **T-A1** Create `web/src/lib/lead-schema.ts` — lift the Zod schema currently inline in `/api/leads/route.ts` to a shared module. Export: `LeadInputSchema` (client), `LeadDbRowSchema` (server, includes derived fields), `LeadInput` + `LeadDbRow` types. `consent_wording_version` default `"2026-04-17.v2"`.
- **T-A2** Create `web/src/lib/lead-score.ts` — pure fn `computeScore(lead: LeadInput): { score: number; tier: 'A'|'B'|'C'|'D' }`. Anchors from Delta #3. No side effects. Jest-style assertions in a sibling `lead-score.test.ts` (optional if we skip test framework setup, at minimum 4 inline `console.assert` examples in a `/** */` doc block).
- **T-A3** Create `web/src/lib/match-stub.ts` — `stubTopMatches(prefs: { preferred_fields: string[]; preferred_levels: string[] }, unis: University[]): Array<{ uni_id: string; uni_name: string; match_pct: number; reason: string }>`. Deterministic: score each uni by `courses[].field` intersection with `preferred_fields`, sort desc, take top 3, format match_pct as rounded int 0–100. Pulls `seedUniversities` from `web/src/lib/universities-seed.ts`.
- **T-A4** Create `web/src/components/lead/Field.tsx` — extract the inline `Field` helper from `LeadModal.tsx` lines 260–278 for reuse across step components.

### Wave B — Step subcomponents
*Depends on T-A1 (shared Zod schema) + T-A4 (Field helper). Additionally: **T-B3 depends on T-A3** (`stubTopMatches` from `lib/match-stub.ts`). T-B1, T-B2, T-B4, T-B5 can land concurrently; T-B3 must wait for T-A3 if parallelising.*

- **T-B1** `web/src/components/lead/Step1Personal.tsx` — `full_name`, `email`, `phone` (with `+61` placeholder + country picker), `country`. All REQUIRED per CONTEXT D4. Surfaces the localStorage trade-off copy from CONTEXT D7 at the top of the step. Renders the APP 5 collection notice above fields (PHASE task #2).
- **T-B2** `web/src/components/lead/Step2Academic.tsx` — `highest_qualification` (select: High School / Bachelor / Master / PhD / Other), `gpa` (0.0–4.0 number), `ielts_overall` (0.0–9.0 number step 0.5). All optional. "Skip this step" link visible.
- **T-B3** `web/src/components/lead/Step3Preferences.tsx` — `preferred_fields` (multi-select chips: IT, Engineering, Business, Health, Arts, Law, Sciences), `preferred_levels` (multi-select: undergraduate / postgraduate), `preferred_intake_month` (select: Feb / Jul / Nov of current + next year). On Next click, call `stubTopMatches` and render an inline teaser card: "Preview match — final ranking appears after you complete your enquiry." with the top-3 unis + match %. All optional; Skip link visible.
- **T-B4** `web/src/components/lead/Step4Budget.tsx` — `tuition_budget_aud` (number, step 1000), `living_budget_aud` (number). All optional; Skip link visible.
- **T-B5** `web/src/components/lead/Step5Contact.tsx` — `preferred_contact_channel` (email / phone / either), `notes` (textarea), APP 5 + APP 8 notice block, required service-consent checkbox, optional marketing checkbox, submit button gated on service consent.

 **Notice block composition (mandatory — Gideon plan-check #1 compliance):**
 1. Lift paragraphs 1–4 of the existing APP 5 notice from `web/src/components/LeadModal.tsx:192–208` verbatim (Collection notice, Why we need it, Who we share it with, Your rights).
 2. Insert a **new paragraph** titled "Where we store it" between the existing "Who we share it with" paragraph and the "Your rights" paragraph. The body text **MUST USE VERBATIM** the sentence from `planning/pathway-ai/DEVIATIONS.md:42` (DEV-001 "Downstream obligations #1"):

 > *Your information is stored on Supabase servers hosted in Singapore (ap-southeast-1). This is a cross-border disclosure under APP 8 of the Privacy Act 1988 (Cth). Supabase is contractually bound to Australian privacy standards, and Pathway-AI ensures reasonable steps are taken to comply with APPs in relation to overseas disclosures.*

 No paraphrasing. No word substitutions. No added qualifiers. Markdown/JSX semantic formatting (`<code>` around `ap-southeast-1`, `<em>` around `Privacy Act 1988 (Cth)`) is permitted; the **words** must be byte-identical to DEVIATIONS.md:42.
 3. Keep paragraph 5 ("We handle your data under the *Privacy Act 1988 (Cth)*.") from the existing notice unchanged.
 4. This notice block is rendered BEFORE the two consent checkboxes, so APP 8 disclosure is visible BEFORE the service-consent tick (PRD §6 compliance + Code of Conduct).

### Wave C — Orchestrator
*Depends on all of Wave B.*

- **T-C1** Refactor `web/src/components/LeadModal.tsx`:
 - Replace single-form body with step state machine (`const [step, setStep] = useState(1)`, range 1–5)
 - Navigation: Back button (visible on steps 2–5), Next button (steps 1–4), Submit button (step 5, disabled until `consent_service`)
 - Skip link on steps 2–4 (advances to next step with current values preserved)
 - Progress indicator: mobile `• • • ○ ○ Step 3 of 5` dots; md+ `Personal · Academic · Preferences · Budget · Contact` with the active step bolded
 - Framer Motion horizontal slide between steps (key the wrapper on step number; `x: +30 → 0` on forward, `x: -30 → 0` on back)
 - `max-w-2xl` container (widened from current `max-w-lg`)
 - Draft persistence (CONTEXT D7): load from `localStorage['pathway-ai.lead-draft.v1']` on mount if `saved_at > now-30d` AND `schema_version === 'v1'`; save (debounced 300ms) on field blur + every Next click; clear on successful submit
 - Draft-recovery banner when hydrated: `"Picking up where you left off — saved on this device only."` (dismissible)
 - Submit handler: POST to `/api/leads` with merged values + `consent_wording_version: "2026-04-17.v2"`
 - Success state: existing styled success card preserved; add a reset CTA "Submit another enquiry" that clears state

### Wave D — API route
*Depends on T-A1 + T-A2. Runs concurrently with Wave C.*

- **T-D1** Extend `web/src/app/api/leads/route.ts`:
 - Import `LeadInputSchema` from `lib/lead-schema.ts` (replaces the inline Zod)
 - Import `computeScore` from `lib/lead-score.ts`
 - After Zod parse: compute `{ score, tier }`
 - Stamp `consent_given_at = new Date().toISOString()` server-side (NOT trusted from client)
 - Create a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` (server-only import path — not from `NEXT_PUBLIC_*`)
 - **INSERT row — mandatory fields pinned server-side (Gideon plan-check #2):**
 - `full_name, email, phone, country` (Step 1)
 - `highest_qualification, gpa, ielts_overall` (Step 2, nullable)
 - `preferred_fields, preferred_levels, preferred_intake_month` (Step 3, nullable)
 - `tuition_budget_aud, living_budget_aud` (Step 4, nullable)
 - `preferred_contact_channel, notes` (Step 5, nullable)
 - `consent_service: true` (DB CHECK rejects false)
 - `consent_marketing` (client-provided boolean)
 - **`consent_wording_version: "2026-04-17.v2"` — server pins this constant; do NOT accept from client payload.** This is the canonical wording hash for the APP 5 + APP 8 block shipped in T-B5.
 - `consent_given_at` (server-stamped above, never client-trusted)
 - `lead_score` (from computeScore)
 - `user_agent` (from request headers), `locale` (from request Accept-Language or client payload)
 - If INSERT fails → return 500, NOT send email
 - If INSERT succeeds → send Resend email to recipients from `LEAD_NOTIFY_EMAILS.split(',').map(s => s.trim()).filter(Boolean)` (fallback `['sam@claudeking.org']` if env unset)
 - Email body adds `Lead score: {score} (tier {tier})` line + `Consent wording version: 2026-04-17.v2` line
 - If email fails AFTER successful INSERT → log + return 200 (lead is captured)
 - Response contract unchanged: `{ ok: boolean, error?: string }`

 **Note on constant pinning:** `consent_wording_version` MUST be defined once as a module-level constant (`const CONSENT_WORDING_VERSION = "2026-04-17.v2"`) in `lib/lead-schema.ts` and imported by both the client submit path (T-C1) and the server INSERT (T-D1). No string-literal duplication — a single source of truth for wording-version-to-notice-block mapping.

### Wave E — Ops artifacts
*Independent. Can ship in any wave; grouped here for commit atomicity.*

- **T-E1** ✅ `ops/n8n/lead-sync-workflow.json` — completed this session
- **T-E2** ✅ `ops/n8n/README.md` — completed this session
- **T-E3** ✅ `web/.env.example` — Make.com removed, N8N block added as dormant documentation; completed this session
- **T-E4** Verify `web/src/lib/universities-seed.ts` matches what Match-Stub expects; no changes unless field names drift
- **T-E5** Add top-level `.gitignore` entry (if missing) for `web/.env.local` — verify only; no change if present

### Wave F — Governance + scope docs
*Independent. Ships with final commit.*

- **T-F1** ✅ `PRD.md` → v1.1 with changelog, §3 X.1.1 row, §5 Lead CRM row updated — completed this session
- **T-F2** Tick `PHASE.md` §Phase 3 task checkboxes as they land; mark `Plan check sign-off: Gideon PASS` + `Phase verify sign-off: Gideon PASS` (no Neo/Specter row — single seat)
- **T-F3** Update `.planning/STATE.md` — move P3 from `not_started` to `in_progress` at Wave A start, `ready_for_verify` after Wave E, `done` after T-G3
- **T-F4** Update `.planning/HANDOFF.json` at wave-boundary checkpoints (in case of interruption)

### Wave G — Verification
*Blocks commit-to-main.*

- **T-G1** Local UAT (Sam driving, Koda instrumenting):
 1. `cd web && pnpm dev` (or existing dev script)
 2. Open landing page, click Hero CTA → modal opens
 3. Fill Step 1 (required), Next → Step 2 fills OR skips → Step 3 fills OR skips → see top-3 teaser render → Step 4 fills OR skips → Step 5 tick service consent (not marketing), submit
 4. Verify: success card renders
 5. Refresh page + re-open modal → confirm draft cleared (because we submitted)
 6. Repeat, but close browser mid-step-3 → reopen → confirm draft-recovery banner appears + form rehydrates at step 3
 7. Verify Resend email landed in Sam's inbox with `Lead score: X (tier Y)` line
- **T-G2** DB audit:
 ```sql
 SELECT count(*) FROM leads WHERE consent_service = false; -- MUST be 0
 SELECT full_name, email, lead_score, consent_wording_version, consent_given_at FROM leads ORDER BY created_at DESC LIMIT 5;
 ```
 Manually via `supabase` CLI or Studio SQL editor.
- **T-G3** Gideon phase-verify:
 - `cd ~/Desktop/Gideon/ && codex exec -m gpt-5.4 --full-auto < prompt.md`
 - Prompt checks: CONTEXT D1–D10 + Delta 1–4 → actual code, APP 8 notice present, `consent_wording_version = "2026-04-17.v2"`, atomic INSERT-then-email ordering, no webhook call from app code, LEAD_NOTIFY_EMAILS honoured, scoring matches anchors
 - PASS = Wave G clears. FAIL = iterate per Gideon findings before commit to main.

### Wave H — Release gate
*Final gate.*

- **T-H1** Atomic commits per wave, pushed to `main`:
 - Commit 1 (after Wave A): `feat(phase-3): shared lead schema + scoring + match-stub foundations`
 - Commit 2 (after Wave B): `feat(phase-3): per-step lead components (Step1–Step5)`
 - Commit 3 (after Wave C): `feat(phase-3): LeadModal 5-step wizard + localStorage draft`
 - Commit 4 (after Wave D): `feat(phase-3): /api/leads atomic INSERT + score + dual-recipient email`
 - Commit 5 (after Wave E): `feat(phase-3): dormant N8N add-on pipeline + env cleanup` *(includes the artifacts already staged this session)*
 - Commit 6 (after Wave F + G): `feat(phase-3): PRD v1.1 + PHASE/STATE sign-off + Gideon PASS`
 - Final commit message template ends with: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- **T-H2** **Telegram approval gate** (CLAUDE.md HARD RULE):
 - Before any commit to `main` in this plan lands, write `planning/pathway-ai/APPROVAL.md` with Sam's "proceed" timestamp received via Telegram or direct CLI reply
 - Dispatch: summary of plan + link to `.planning/3-PLAN.md` + link to key changed files preview → Sam approves → commit chain starts

---

## Files to create / modify (exhaustive)

**Create:**
- `web/src/lib/lead-schema.ts` (T-A1)
- `web/src/lib/lead-score.ts` (T-A2)
- `web/src/lib/match-stub.ts` (T-A3)
- `web/src/components/lead/Field.tsx` (T-A4)
- `web/src/components/lead/Step1Personal.tsx` (T-B1)
- `web/src/components/lead/Step2Academic.tsx` (T-B2)
- `web/src/components/lead/Step3Preferences.tsx` (T-B3)
- `web/src/components/lead/Step4Budget.tsx` (T-B4)
- `web/src/components/lead/Step5Contact.tsx` (T-B5)
- `ops/n8n/lead-sync-workflow.json` ✅
- `ops/n8n/README.md` ✅

**Modify:**
- `web/src/components/LeadModal.tsx` (T-C1) — full rewrite body, keep shell
- `web/src/app/api/leads/route.ts` (T-D1) — extend with INSERT + score
- `web/.env.example` ✅ (T-E3)
- `PRD.md` ✅ (T-F1) — v1.1 changelog + §3 X.1.1 + §5 Lead CRM row
- `PHASE.md` (T-F2) — tick P3 tasks + sign-off lines
- `.planning/STATE.md` (T-F3)
- `.planning/HANDOFF.json` (T-F4)

**Verify only (no change expected):**
- `web/src/lib/universities-seed.ts`
- `supabase/migrations/001_initial_schema.sql`
- `.gitignore`

---

## Acceptance criteria (maps to PHASE.md §Phase 3 tasks)

| PHASE task | Plan coverage | Verified in |
|---|---|---|
| Neo research consent wording | APP 8 paragraph added verbatim from DEVIATIONS.md; single-seat so "Neo" reassigned to Gideon plan-check | T-G3 |
| Step 1 APP 5 notice before PII entry | T-B1 renders notice above fields; T-B5 keeps full block visible at consent | T-G1 step 3, T-G3 |
| UX copy surfaces localStorage trade-off | T-B1 surfaces the copy verbatim from CONTEXT D7 | T-G1 step 3, T-G3 |
| Steps 1–4 localStorage only, zero server writes | T-C1 only submits on step 5; T-D1 only INSERTs on POST to `/api/leads` | T-G1 step 6 + T-G2 |
| Step 5 atomic INSERT with consent fields | T-D1 INSERT includes all 5 consent fields (service, marketing, wording_version, given_at, score-derived tier in email) | T-G2 |
| Consent UX required/optional | T-B5 renders both checkboxes; submit gated on service | T-G1 step 3 |
| Submission emails Sam + Pathway-AI | T-D1 LEAD_NOTIFY_EMAILS split + Resend `to: []` | T-G1 step 7 |
| Lead score computed server-side | T-A2 + T-D1 computes server-side inside the atomic flow | T-G2, T-G3 |
| DB audit: zero consent_service=false rows | T-G2 SQL query (CHECK constraint enforces; audit confirms) | T-G2 |
| Commit `feat(phase-3): lead capture — ...` | T-H1 commit chain; final commit message matches template | T-H1 |

---

## Rollback plan

If Gideon phase-verify FAILS or T-G1 UAT surfaces a blocker:

1. **Uncommitted local state:** `git stash` current work; diagnose; re-apply after fix
2. **Wave already committed but broken:** revert the offending commit(s) via `git revert <sha>` (never `git reset --hard` on main — MEMORY rule `feedback_hitl-for-deletes.md`); fix forward on a new commit
3. **Draft pollution:** localStorage bug could leave stale drafts in the wild post-launch. Mitigation: `schema_version` key in D7 lets us silently invalidate all stale drafts by bumping to `v2` in a hotfix
4. **Lead CHECK constraint reject:** any lead insert failing the `consent_service=true` CHECK means we shipped a client-side bug. Rollback = re-enable the consent checkbox gating + hotfix deploy; the DB rejection prevents bad data from landing — no audit exposure
5. **Schema drift between `lead-schema.ts`, `leads` table, and dormant ops/n8n artifacts:** if a future migration adds/renames/drops a column on `leads`, three surfaces must stay in lock-step — (a) `web/src/lib/lead-schema.ts` Zod types, (b) the `CREATE TABLE leads` migration, (c) the `ops/n8n/lead-sync-workflow.json` "Normalise Fields + Tier" node mapping + the Google Sheet header row documented in `ops/n8n/README.md`. **Rollback protocol:** bump the migration to an additive-only change (never destructive); update `lead-schema.ts` in the same commit as the migration; update `ops/n8n/lead-sync-workflow.json` + README in the same commit if touched; if the N8N pipeline is already activated (post-X.1.1), Sam must re-import the updated JSON into Pathway-AI's N8N instance AND add matching columns to Pathway-AI's Google Sheet BEFORE the migration deploys. If any of the three surfaces drifts, the fix is to roll the migration forward on a new commit that realigns all three — never roll the DB schema back destructively on a table holding real consent records
6. **Consent wording version mismatch:** if `lead-schema.ts` `CONSENT_WORDING_VERSION` constant and the rendered notice block in `Step5Contact.tsx` fall out of sync (e.g. someone edits the notice copy without bumping the constant), any future compliance audit will see `consent_wording_version=v2` on rows whose actual rendered wording no longer matches the v2 canonical text. **Mitigation:** add a comment in both files cross-referencing the other; any edit to the notice block MUST bump the constant (e.g. to `v3`) in the same commit. No hotfix path — this is a forward-only discipline.

Pathway-AI has **no live traffic yet** (per HANDOFF.json human-action note — magic link untested with real email; no real leads in `leads` table). Rollbacks are code-only — zero PII at risk.

---

## Gideon plan-check — run this BEFORE kicking off Wave A

```bash
cd ~/Desktop/Gideon
cat > /tmp/atlas-p3-plancheck.md << 'EOF'
You are Gideon, single-seat code reviewer for pathway-ai Phase 3.

Read:
- /Users/shamalkrishna/Desktop/pathway-ai/.planning/3-CONTEXT.md
- /Users/shamalkrishna/Desktop/pathway-ai/.planning/3-PLAN.md
- /Users/shamalkrishna/Desktop/pathway-ai/PRD.md (focus on v1.1 changelog + §3 X.1.1 + §5)
- /Users/shamalkrishna/Desktop/pathway-ai/PHASE.md (§Phase 3)
- /Users/shamalkrishna/Desktop/pathway-ai/planning/pathway-ai/DEVIATIONS.md
- /Users/shamalkrishna/Desktop/pathway-ai/web/src/components/LeadModal.tsx (current state being refactored)
- /Users/shamalkrishna/Desktop/pathway-ai/web/src/app/api/leads/route.ts (current state being extended)
- /Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql (leads table lines 62–98)

Issue a plan-check verdict: APPROVE / APPROVE-WITH-NOTES / BLOCK.

Check specifically:
1. Does the Wave A→H ordering respect data + code dependencies?
2. Are all 9 PHASE.md §Phase 3 tasks covered by at least one T-X task with measurable acceptance?
3. Does the APP 5 + APP 8 notice wording in T-B5 match DEVIATIONS.md §"Downstream obligations #1" verbatim, and is consent_wording_version bumped to v2?
4. Is the scoring anchor set in Delta #3 defensible against the G8-heavy 12-uni seed? (Tuition fees visible in web/src/lib/universities-seed.ts)
5. Is there ANY path where a Supabase INSERT could happen before the user ticks consent_service? (Review T-D1 + T-C1 together.)
6. Is there ANY path where an email could go out without a DB row? (Review T-D1 ordering.)
7. Does the rollback plan cover the top-3 realistic failure modes?
8. Are the 6 atomic commits in T-H1 coherent and independently-revertable?

If BLOCK: enumerate each blocker with file:line references and a specific fix proposal.
If APPROVE-WITH-NOTES: list non-blocking improvements.
If APPROVE: confirm and recommend starting Wave A.
EOF
codex exec -m gpt-5.4 --full-auto < /tmp/atlas-p3-plancheck.md
```

**Expected turnaround:** 5–10 minutes on full gpt-5.4 (slower than mini but depth matches Sam's directive).

**Handling outcomes:**
- APPROVE → proceed to Wave A
- APPROVE-WITH-NOTES → absorb non-blocking notes into the plan inline, commit as `chore(phase-3): absorb Gideon plan-check notes`, then proceed
- BLOCK → iterate plan (up to 3 rounds; if still blocking, escalate to Sam with a summary and a decision ask)

---

## Telegram approval gate (HARD RULE — CLAUDE.md)

Before any commit lands on `main`:

1. Post to Telegram:
 > "Phase 3 plan ready. `.planning/3-PLAN.md` written. Gideon: APPROVE (or APPROVE-WITH-NOTES / BLOCK). PRD v1.1 + N8N dormant pipeline included. Budget: within $3k; $200 add-on priced separately (X.1.1). Proceed to Wave A?"
2. Wait for Sam's "proceed" (or equivalent).
3. Write `planning/pathway-ai/APPROVAL.md`:
 ```
 ## Phase 3 approval
 Plan: .planning/3-PLAN.md
 Approved at: {ISO timestamp}
 Approved via: Telegram (chat 6223934300) / CLI
 Approver: Sam
 Scope: Waves A–H as enumerated in PLAN.md
 Budget position: within $3,000 fixed; X.1.1 add-on (+$200) priced separately
 ```
4. Begin Wave A.

---

## Open-for-planner items (from CONTEXT.md) — resolution

| Item | Resolution |
|---|---|
| Neo consent-wording research | Single-seat Gideon replaces Neo; DEVIATIONS.md §"Downstream obligations #1" gives verbatim APP 8 paragraph. T-B5 lifts it as-is. APP 5 block in current LeadModal already passed P0.5 Gideon review — unchanged except insertion of the new paragraph. |
| Median AU course cost | Resolved via Delta #3 using 12-uni G8-heavy seed inspection. Revisit when 43-uni backfill lands in P4.5 — then re-evaluate anchors empirically. |
| Step order UX (Preferences vs Budget) | Keep PRD order (Personal → Academic → Preferences → Budget → Contact). Rationale: Step 3 shows the match teaser, which is a motivation-anchor before asking about money. Reversing would hurt conversion. |
| Skip button copy | `"Skip this step"` (plain) beside Next button. No bullet, no "I'll come back". Consistent + testable. |
| Teaser UI shape | Inline card appended to Step 3 after user clicks Next (NOT a separate Step 3.5). Collapses if user navigates Back. Less jarring + preserves the 5-step count. |

---

## Current session artifacts

Already landed this session (not yet committed — awaiting Telegram approval):
- `.planning/3-CONTEXT.md`
- `.planning/3-PLAN.md` *(this file)*
- `PRD.md` v1.1 edits
- `web/.env.example` edits
- `ops/n8n/lead-sync-workflow.json`
- `ops/n8n/README.md`

---

## Next action

Run Gideon plan-check (block above) → present verdict + Telegram approval summary → on `proceed`, start Wave A.
