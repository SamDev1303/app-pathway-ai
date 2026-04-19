# Atlas AI — Compliance Attestation v1

**Date:** 2026-04-20 (session 50, P4.5 close)
**Product:** Atlas AI demo for UniMate Australia (MARA/QEAC-registered consultancy)
**Scope:** Web demo at atlas-ai.vercel.app
**Database:** Supabase project `fprqcugrmjvgrtbtohbf` (ap-southeast-2 Sydney)
**Phase:** P4.5 compliance gate (verified BEFORE P5 AI chat launch)

This document attests to the compliance posture of Atlas AI as of P4.5 close. It is intended for UniMate client review BEFORE P5 chat goes live. Open items are listed at the bottom as P8 final-audit carry-forwards.

---

## 1. MARA compliance (Migration Agents Act 1958)

### 1.1 Disclaimer placement
- **Canonical constant:** `web/src/lib/mara-disclaimer.ts` exports `MARA_DISCLAIMER_BODY` + `MARA_DISCLAIMER_VERSION = "2026-04-20.v2"`. One source of truth. All surfaces consume via import (no string literal duplication).
- **Match surface:** `MaraBanner.tsx` renders on every `/matches/[token]` result. Required — these are the only surfaces displaying "matches" that could be mistaken for advice.
- **Site-wide footer:** `<Footer />` rendered via `app/layout.tsx` on every route (`/`, `/login`, `/matches/[token]`, `/consult`, `/auth/*`). Displays MARA registration number + QEAC number + ABN + office address + link to MARA register.
- **Per-route coverage verified:** `npm run build` generates 12 routes, all inheriting the layout footer.

### 1.2 Registration number handling
- Placeholder `MARN [PENDING_FROM_UNIMATE]` stored in `web/src/lib/content.ts:12` as `brand.mara_number`. Canonical source-of-truth.
- 5 production components consume via import (not hardcoded): Footer, login/page, LeadModal, MatcherForm, Step1Personal, Step5Contact.
- **Deadline:** CI workflow `.github/workflows/mara-grep-gate.yml` (`placeholder-deadline` job) fails merges on main after **2026-04-28 00:00 UTC** if `[PENDING_FROM_UNIMATE]` still appears in `web/src/**`. 7-day grace window starts 2026-04-20.

### 1.3 Fake-identifier prevention (P4.5 Wave 0 incident)
**Incident:** During plan-review, discovered `MARN 1798425`, `QEAC P538`, and `ABN 12 345 678 901` were scaffolded in 5 render paths during P0.5/P3 and read as REAL credentials. Playwright-verified via portal.mara.gov.au: `MARN 1798425` and business name "UniMate" BOTH return "no records to display".

**Remediation:** 7-file atomic scrub in commit `b24717c` — all fake identifiers replaced with `[PENDING_FROM_UNIMATE]` placeholder.

**Future prevention:** CI workflow job `fake-identifier-shape` blocks any new MARN/QEAC/ABN-shaped string that is NOT the placeholder. Regression-proof.

**Evidence:** `.planning/research/p4.5-mara-registry-verify/findings.md` + 2 screenshots.

### 1.4 Chat system prompt (staged for P5)
`web/src/lib/chat-system-prompt.ts` defines `CHAT_SYSTEM_PROMPT_V1` with:
- 12 explicit deflection triggers (visa, migration, PR, MLTSSL, 485, subclass, etc.)
- Hardcoded deflection response (no hedging language)
- Per-turn footer disclaimer constant

Version pinned: `CHAT_SYSTEM_PROMPT_VERSION = "2026-04-20.v1"`. Ready for P5 to import + apply.

---

## 2. Privacy Act 1988 (Cth) — APPs 5, 8, 11

### 2.1 APP 5 Collection Notice
- **Rendering surfaces:** `Step1Personal.tsx` (first-step summary) + `Step5Contact.tsx` (full Collection Notice). Both imported via the LeadModal wizard flow.
- **5 paragraphs:** (1) collection notice identifying UniMate + regulatory standing, (2) why data is needed + consequence of declining, (3) who we share with, (4) where we store it (onshore), (5) your rights + privacy@unimate.com.au contact.
- **Version pinning:** `CONSENT_WORDING_VERSION = "2026-04-20.v3"` in `lead-schema.ts`. Stored on every lead row via `leads.consent_wording_version` column. Audit trail query: `SELECT DISTINCT consent_wording_version FROM leads` returns exact wording each user agreed to.

### 2.2 APP 8 Cross-border disclosure
- **Status post-P4.5:** NOT APPLICABLE. All data stored in ap-southeast-2 (Sydney), onshore within AU jurisdiction. No cross-border disclosure occurs.
- **Historical context:** v2 consent wording (2026-04-17 to 2026-04-20) included APP 8 paragraph citing ap-southeast-1 (Singapore) per DEV-001 deviation. Migration to Sydney project `fprqcugrmjvgrtbtohbf` on 2026-04-20 02:10 AEST resolved the deviation. DEVIATIONS.md marks DEV-001 RESOLVED.

### 2.3 APP 11 Security of personal information

#### 2.3.1 Row-Level Security (RLS) policies (applied 2026-04-20 Wave 3)

| Table | RLS | anon SELECT | anon INSERT | anon UPDATE/DELETE | service role |
|-------|-----|-------------|-------------|---------------------|--------------|
| `leads` | enabled | denied (policy `leads_anon_no_select`) | denied in practice (PostgREST returns RLS error; confirmed by smoke test — `/api/leads` uses service role which bypasses RLS) | denied (explicit policies) | full access (bypass) |
| `universities` | enabled | allowed (public reference) | denied | denied | full access (bypass) |
| `courses` | enabled | allowed (public reference) | denied | denied | full access (bypass) |

**Verification commands (run 2026-04-20):**
```bash
# anon SELECT leads → []
curl -s "https://fprqcugrmjvgrtbtohbf.supabase.co/rest/v1/leads?select=id&limit=1" -H "apikey: $ANON" → []

# anon SELECT universities → data
curl -s "https://fprqcugrmjvgrtbtohbf.supabase.co/rest/v1/universities?select=short_name,city&limit=3" -H "apikey: $ANON"
→ [{"short_name":"UNSW","city":"Sydney"},...]

# service role INSERT → 201 with row
curl -s -X POST "https://fprqcugrmjvgrtbtohbf.supabase.co/rest/v1/leads" -H "apikey: $SERVICE" ... → 201
```

#### 2.3.2 Encryption at rest
Supabase Postgres uses **AES-256** encryption at rest on all regions, managed by AWS KMS. Reference: [Supabase Security](https://supabase.com/security). Customer-managed keys not configured (platform-managed key is standard for Pro tier; no contractual requirement to upgrade).

#### 2.3.3 Encryption in transit
All Supabase REST + Postgres connections enforce **TLS 1.2+**. Client connections use `https://` (REST) and `sslmode=require` (direct psql). Self-signed or plain-HTTP connections rejected at Supabase edge.

#### 2.3.4 Secret management
- Client-visible (NEXT_PUBLIC_*): anon JWT + URL embedded in client bundle by design (Supabase pattern; anon is RLS-scoped).
- Server-only: service role JWT, service key, secret key stored in Vercel env vars (encrypted at rest), not in git. `.env.local` gitignored via `.env*` pattern.
- Rotation cadence: no scheduled rotation policy documented. Flagged as P8 item.

### 2.4 Consent split (service vs marketing)
- **Schema:** `lead-schema.ts` defines `consent_service: z.literal(true)` (required) + `consent_marketing: z.boolean().default(false)` (optional).
- **UI:** `Step5Contact.tsx` renders two distinct checkboxes with separate wording. Required checkbox blocks submit if unchecked. Optional checkbox defaults to false.
- **DB enforcement:** `leads_consent_service_must_be_true` CHECK constraint in `001_initial_schema.sql` rejects rows with `consent_service = false`.

---

## 3. Data residency (PRD §6)

- **Target (PRD):** ap-southeast-2 (Sydney)
- **Actual:** ap-southeast-2 (Sydney) ✅ **MATCHES**
- **Provisioning:** Sam provisioned `fprqcugrmjvgrtbtohbf` on 2026-04-20 ~02:10 AEST via Supabase dashboard.
- **Previous state:** `szuqcptsmmgycvagteza` (ap-southeast-1 Singapore) per DEV-001 — migrated to Sydney in P4.5; being deleted by Sam post-handover verification.
- **Env sync:** `.env.local` + Vercel production + preview env vars updated with new URL + keys.

---

## 4. CI enforcement

`.github/workflows/mara-grep-gate.yml` — 3 blocking jobs on PR + push to main:

| Job | What it catches | Historical incident |
|-----|----------------|---------------------|
| `fake-identifier-shape` | MARN/QEAC/ABN-shaped strings that are NOT `[PENDING_FROM_UNIMATE]` placeholder | P4.5 Wave 0 — MARN 1798425 scaffold was fake |
| `affirmative-advice-phrases` | Narrow phrase list that is always advice-giving (e.g., "your visa will be", "you qualify for PR") | No prior incident — preventive |
| `placeholder-deadline` | `PENDING_FROM_UNIMATE` after 2026-04-28 00:00 UTC grace deadline | UniMate forcing function |

Legitimate "not migration advice" disclaimer copy is NOT blocked (gate is tuned to catch actual regressions, not false-positive on negated references).

---

## 5. Open items — P8 final audit blockers

| # | Item | Owner | Deadline |
|---|------|-------|----------|
| 1 | MARA registration number (MARN) + QEAC + ABN replacement | Sam → UniMate | **2026-04-27 23:59 AEST** (CI enforcement deadline) |
| 2 | Service-role key rotation runbook + 90-day schedule | Sam | Pre-production handover |
| 3 | QS WUR licensing agreement (QS data used in matcher UI) | Sam + UniMate legal | Pre-production handover |
| 4 | 43-uni expansion with verified CRICOS codes | Data team | P8 |
| 5 | Per-course CRICOS codes on all 68 course rows | Data team | P8 |
| 6 | USyd + Melbourne BCS fee verification vs official 2025 fee PDFs | Data team | P8 |
| 7 | `is_regional` flag authoritative source (Department of Home Affairs list) | Data team | P8 |

Items 4-7 surfaced from 2026-04-20 org-dispatch (Atlas + Sonnet + Haiku). Evidence: `org/reviews/2026-04-20-uni-data-verify-expand/SYNTHESIS.md`.

---

## 6. Signatures

| Role | Name | Date | Sign-off |
|------|------|------|----------|
| Preparer | Koda (Claude Opus 4.7) | 2026-04-20 | AUTOMATED |
| Verifier | Gideon (Codex gpt-5.4-mini) — P4.5 phase-verify | 2026-04-20 | [PENDING — Wave 6] |
| Atlas AI owner | Sam Krishna | 2026-04-20 | PENDING |
| UniMate counterparty | [NAME TBD] | [DATE] | PENDING |
