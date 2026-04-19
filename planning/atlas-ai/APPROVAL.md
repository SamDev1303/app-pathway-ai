# APPROVAL.md — Atlas AI Phase gate

## proceed 2026-04-17 12:08 AEDT — Sam — approve P0.5 scaffold scrub + P1 provisioning

**Verbal approval captured from Telegram/CLI session 3 (12:07 AEDT 2026-04-17).**

Sam's instruction: "finish the GSD phases" — interpreted by Koda as timestamped approval to proceed with P0.5 execution end-to-end (remaining 5 files scrub + widened grep gate + plan-check + phase-verify) and P1 prep-to-execution handoff.

Scope of this approval:
- ✅ P0.5 completion — 5 remaining files scrub, grep gate to 0 hits (excluding node_modules + binaries), plan-check dispatch, phase-verify dispatch
- ✅ P0.5 close — dual sign-off recorded, PHASE.md + STATE.md updated
- ✅ P1 handoff doc — exact Supabase setup steps for Sam
- ⛔ NOT approved in this session: P1 execution (requires Sam provisioning Supabase project first), P2+

Governance:
- CLAUDE.md §11 approval gate satisfied
- Dual-seat sign-off rule still applies (Gideon + Neo, Specter fallback)
- No self-signoff by Koda
- If Gideon/Neo disagree → escalate to Sam

---

## proceed 2026-04-17 23:41 AEST — Sam — approve P3 plan lock + PRD v1.1 + N8N X.1.1 dormant + Wave A–H execution

**Verbal approval captured from CLI session 4 (23:41 AEST 2026-04-17).**

Sam's instruction: "yes" — in response to Koda's Telegram approval-gate summary after Gideon plan-check round 2 returned `VERDICT: APPROVE` with zero new findings and recommendation "Proceed to Wave A".

### Scope of this approval

**✅ Plan-phase close (immediate commit):**
- `.planning/3-CONTEXT.md` — 10 decisions (D1–D10) + single-seat review protocol
- `.planning/3-PLAN.md` — 8 waves (A–H) + acceptance matrix + rollback + Gideon plan-check + Telegram approval gate
- `PRD.md` v1.1 — changelog block + §3 X.1.1 N8N add-on row + §5 Lead CRM row update (Make.com removed)
- `web/.env.example` — Make.com env removed, N8N dormant documentation added, Supabase region comment fixed to ap-southeast-1 (DEV-001)
- `ops/n8n/lead-sync-workflow.json` — dormant importable workflow for UniMate Hostinger N8N
- `ops/n8n/README.md` — X.1.1 activation runbook

**✅ P3 Wave A–H execution (atlas-ai web/ hand-coded extensions):**
- Wave A: shared foundations (`lead-schema.ts` + `lead-score.ts` + `match-stub.ts` + `Field.tsx`)
- Wave B: per-step components (Step1Personal → Step5Contact)
- Wave C: `LeadModal.tsx` refactor to 5-step wizard + localStorage draft
- Wave D: `/api/leads/route.ts` extension — atomic INSERT + server-side score + dual-recipient email (no webhook calls)
- Wave E: N8N artifacts (already landed this commit)
- Wave F: governance + scope doc sync
- Wave G: local UAT + DB audit + Gideon phase-verify
- Wave H: 6-commit atomic chain → main

**Scope boundaries honoured:**
- ⛔ No scope creep beyond PHASE.md §Phase 3 checklist (10 tasks)
- ⛔ N8N X.1.1 activation is OUT of this approval — requires UniMate PO + additional $200 invoice
- ⛔ Real matcher engine (P4) is OUT — Step-3 teaser uses `match-stub.ts` only

### Review protocol (updated this session — supersedes P0–P2 dual-seat)

- **Single-seat:** Gideon on `codex exec -m gpt-5.4 --full-auto` (full, not mini)
- **No Neo / no Specter / no Atlas** in P3 review cycles per Sam directive
- Reference memory: `feedback_agent-model-calibration.md` (updated 2026-04-17)

### Gideon plan-check chain (this approval)

- Round 1: `VERDICT: BLOCK` (2 blockers: APP 8 verbatim, `consent_wording_version` pinning; 4 non-blocking notes)
- Round 2: `VERDICT: APPROVE` (all 6 items resolved; recommendation "Proceed to Wave A")
- Gideon transcripts: `/tmp/atlas-p3-plancheck-output.md`, `/tmp/atlas-p3-plancheck-r2-output.md` (retained for audit)

### Budget

- v1 scope: **within $3,000 AUD fixed** (HARD-CUT)
- X.1.1 add-on: **+$200** priced separately; invoice only on UniMate PO sign-off post-launch

### Governance

- CLAUDE.md §11 approval gate satisfied
- Single-seat rule applies (supersedes dual-seat for P3 onwards per Sam 2026-04-17)
- No self-signoff by Koda — this approval is Sam's timestamped "yes" to Koda's summary
- If Gideon phase-verify (Wave G) returns FAIL → iterate code before commit to main; escalate to Sam after 3 rounds

---

## proceed 2026-04-20 01:45 AEST — Sam — approve P4.5 compliance-gate plan-then-ship + mid-session Wave 0 emergency scrub

**Verbal approval chain captured in CLI session 50:**

1. **01:45 AEST — plan-then-ship authorization:** Sam's instruction "continue plan both and ship before going to the next phase" — interpreted as timestamped approval to collapse `/gsd-discuss-phase 4.5 → /gsd-plan-phase 4.5 → /gsd-execute-phase 4.5` into a single-session flow.
2. **01:50 AEST — decision gate:** Sam chose defer-region (D2), TBC MARA # (D1 original), staging-only chat prompt (D3) via AskUserQuestion.
3. **02:02 AEST — emergency discovery:** Koda found `MARN 1798425` + `QEAC P538` hardcoded in 5 production render paths. Sam chose "verify via MARA register myself" option.
4. **02:03 AEST — verified fake:** Playwright check confirmed MARN 1798425 + business name UniMate both return "no records to display" on portal.mara.gov.au. Evidence in `.planning/research/p4.5-mara-registry-verify/`.
5. **02:05 AEST — Wave 0 authorization:** Sam's "Wave 0 scrub NOW + keep demo live (Recommended)" — approved scope expansion to scrub all 5 files + Footer + content.ts before continuing with original Waves 1-6.

### Scope of this approval

**✅ Plan-phase close (immediate commit):**
- `planning/atlas-ai/4.5-CONTEXT.md` — 10 locked decisions (D1-D10), revised D1 post-MARN discovery
- `planning/atlas-ai/4.5-PLAN.md` — 7 waves (0-6) + rollback + HITL gates
- `.planning/research/p4.5-mara-registry-verify/findings.md` + 2 screenshots (evidence of fake MARN)

**✅ P4.5 Wave 0 execution (emergency scrub, landed this session):**
- Scrub `MARN 1798425` → `MARN [PENDING_FROM_UNIMATE]` (5 files)
- Scrub `QEAC P538` → `QEAC [PENDING_FROM_UNIMATE]` (3 files)
- Scrub `ABN 12 345 678 901` → `ABN [PENDING_FROM_UNIMATE]` (3 files)
- Normalize `MARN {PENDING}` (content.ts:79) → `MARN [PENDING_FROM_UNIMATE]`
- Square-bracket convention: JSX-safe (curly `{}` fails typecheck as undefined expression)

**✅ P4.5 Waves 1-6 authorization (to execute this session):**
- Wave 1 — `chat-system-prompt.ts` staging + `mara-disclaimer.ts` v2 (registration-authority URL)
- Wave 2 — `006_rls_policies.sql` authored (not applied)
- Wave 3 — 006 applied to live Supabase `szuqcptsmmgycvagteza` [HITL pause before `supabase db push`]
- Wave 4 — Footer wired site-wide in `app/layout.tsx`
- Wave 5 — `.github/workflows/mara-grep-gate.yml` + `docs/compliance-attestation-v1.md`
- Wave 6 — Gideon phase-verify single-seat gpt-5.4 + PHASE.md/STATE.md sign-off + push to main

### Scope boundaries

- ⛔ Not touching `mobile/**` (P7)
- ⛔ Not touching `/api/chat/route.ts` (P5)
- ⛔ Not touching SOP / react-pdf (P6)
- ⛔ Not migrating region to ap-southeast-2 (D2 deferred to P8)
- ⛔ Not backfilling 43 unis or cricos_code (D5 defers to P8)

### Open items carried to P8 final audit

1. MARA registration number replacement (CI gate deadline 2026-04-27 23:59 AEST)
2. Supabase region decision (ap-southeast-1 vs ap-southeast-2)
3. QS WUR licensing agreement
4. Service-role key rotation runbook

### Review protocol (P4.5)

- **Single-seat:** Gideon `codex exec -m gpt-5.4-mini --full-auto` for plan-check + phase-verify (per `feedback_agent-model-calibration.md`)
- **Neo / Specter / Atlas:** not involved (per D10)
- **Iteration cap:** 3 rounds; escalate to Sam after

### Governance

- CLAUDE.md §11 approval gate satisfied
- No self-signoff by Koda — Sam's multi-step approvals across 4 AskUserQuestion gates this session
- Wave 0 scope expansion ratified AT the decision point, not retroactively
- Push-back discipline honoured: surface the risk, options, and recommendation BEFORE executing
