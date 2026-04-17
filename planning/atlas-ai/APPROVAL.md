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
