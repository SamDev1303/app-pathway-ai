# DEVIATIONS.md — Atlas AI

Audit trail of explicit deviations from PRD/PHASE plans, captured at decision time.

---

## DEV-001: Supabase region deviation from PRD §6

**Date:** 2026-04-17 12:45 AEDT → RESOLVED 2026-04-20 02:15 AEST
**Phase:** P1 (Supabase project + seed) → resolved in P4.5 (compliance gate)
**Decided by:** Sam (override) · **Flagged by:** Koda (security hat)
**Status:** ✅ **RESOLVED via region migration** — old Singapore project deleted, new Sydney project `fprqcugrmjvgrtbtohbf` (ap-southeast-2) provisioned 2026-04-20. PRD §6 is now SATISFIED, not deviated. Consent wording bumped to v3 (no APP 8 cross-border paragraph needed). Compliance attestation `docs/compliance-attestation-v1.md` removes the data-residency open item.

### Resolution (P4.5)

1. Sam provisioned new Supabase project `fprqcugrmjvgrtbtohbf` in ap-southeast-2 (Sydney) at 2026-04-20 ~02:10 AEST.
2. Koda migrated migrations 001-006 + seed data to new project.
3. `.env.local` + Vercel production + preview env vars updated.
4. `Step5Contact.tsx` "Where we store it" paragraph rewritten as onshore-storage notice; `CONSENT_WORDING_VERSION` bumped to `2026-04-20.v3`.
5. Old Singapore project `szuqcptsmmgycvagteza` → Sam is deleting post-migration verification.

All downstream obligations below are now **N/A** (no cross-border disclosure occurs). Historical record preserved for audit trail.

---

### (Historical — pre-resolution record below)

### What was planned

PRD §6 "Data residency (AU preference)" + §4 "Architecture stack" both specify:
> Supabase Postgres + pgvector (region `ap-southeast-2` — Sydney)

### What Sam provisioned

Project `szuqcptsmmgycvagteza` was created 2026-04-16 20:29 UTC in:
- **Actual region:** `ap-southeast-1` (Singapore)
- **PRD target:** `ap-southeast-2` (Sydney)

### How Koda flagged it

On verifying the project via the Supabase Management API, Koda detected the region mismatch BEFORE applying any schema or seeding any data (project was 9.3 hours old, zero data).

Koda pushed back with three options:
1. Delete the 9-hour-old empty project + recreate in `ap-southeast-2` (recommended)
2. Amend PRD §6 to accept Singapore (requires UniMate / client sign-off)
3. Proceed to Singapore with documented compliance obligation

### Sam's decision

Sam explicitly said "continue" after reading the push-back. Interpreted as option 3 — proceed with Singapore.

### Downstream obligations (MUST be addressed before production launch)

1. **APP 8 (cross-border disclosure) — Collection Notice update REQUIRED**
   - Current `web/src/components/LeadModal.tsx` APP 5 notice does NOT mention Singapore hosting.
   - Before any real lead lands, the notice MUST include a line along these lines: *"Your information is stored on Supabase servers hosted in Singapore (ap-southeast-1). This is a cross-border disclosure under APP 8 of the Privacy Act 1988 (Cth). Supabase is contractually bound to Australian privacy standards, and UniMate ensures reasonable steps are taken to comply with APPs in relation to overseas disclosures."*
   - **Owner:** P3 (Lead capture — Neo + Sam) — MUST lift notice wording before consent goes live.
   - **Gate:** P4.5 compliance gate re-reviews this BEFORE any real user traffic.

2. **UniMate client disclosure** (business-level)
   - UniMate's MARA/QEAC-facing privacy representations may need update if they previously told students data stayed in Australia.
   - **Owner:** Sam (client conversation, not Koda).

3. **MARA Code of Conduct interpretation**
   - MARA Code does not explicitly prohibit overseas hosting but does require registered agents to "act professionally and with diligence." Failure to disclose cross-border hosting could be seen as non-disclosure.
   - **Owner:** Sam / UniMate legal sign-off before launch.

4. **Right-of-correction / deletion requests** (APP 13)
   - The `privacy@unimate.com.au` contact in the LeadModal APP 5 notice is the process entry point. UniMate needs a documented SOP for handling these across the Supabase-Singapore boundary.
   - **Owner:** Sam / UniMate operations — before launch.

### What Koda will NOT do

- Will NOT silently skip these obligations to move fast
- Will NOT ship real user traffic (P5+) without P4.5 compliance re-gate confirming APP 8 disclosure in the collection notice
- Will NOT modify the PRD §6 requirement to pretend Singapore was the target — deviation stays visible in the PRD for audit

### Backout plan (if Sam reverses)

If Sam / UniMate later decide Singapore is unacceptable:
1. Stop any real-lead traffic
2. Export current Supabase data via `pg_dump` (service_role)
3. Create new project in `ap-southeast-2`
4. Restore schema + seed + any real data
5. Cut over DNS + env
6. Document in DEV-00N as follow-up

Cost to back out increases with every real lead landed. The sooner P3 goes live, the more expensive this reversal becomes.

---
