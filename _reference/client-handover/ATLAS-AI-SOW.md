# Statement of Work — Atlas AI v1

**Between:** Koda Labs (supplier) and **UniMate Pty Ltd** (client)
**Date prepared:** 2026-04-16 · **Revised:** 2026-04-18 (v1.2 after peer review)
**SOW version:** 1.2 draft
**Prepared by:** Sam (Koda Labs) — sam@claudeking.org

### Changelog

**v1.2 (2026-04-18, after Gideon peer review):**

- **§2:** Fixed stale reference to "Google Sheet via Make.com" — v1 uses Supabase `leads` table + Resend email; n8n → Sheet is optional add-on (§1 line 2).
- **§3:** Clarified "Day N" = business day. Production cut-over only happens once the P4.5 compliance gate passes, never by calendar deadline alone.
- **§7:** Fixed Supabase region — correct region is `ap-southeast-1` (Singapore), not Sydney. APP 8 cross-border disclosure is already wired into the lead-capture UI per Phase 3.
- **§5a GST:** Added — fees are exclusive of GST.
- **§12 Confidentiality:** Added.
- **§13 Limitation of liability:** Added — liability capped at fees paid.
- **§14 Change control:** Added — scope changes require written change order or new PO.
- **§15 Warranty:** Added — 30-day conformance warranty with repair/replace remedy.
- **§16 Force majeure:** Added.
- **§17 Governing law:** Added — NSW, Australia.

**v1.1 (2026-04-18):**

- **§1:** Added optional $200 one-time n8n lead-sync activation line item (UniMate-hosted Hostinger VPS).
- **§3:** Timeline condensed from "3 weeks" to **7-day build (P4-P9) + 7-day UAT window**. Phases 0-3 are already complete (scaffold, governance, Supabase seed, lead-capture UI).
- **§4:** Total price remains $3,000 AUD for v1 scope. Optional n8n add-on brings total to $3,200 AUD if UniMate elects.
- **§5:** Payment schedule gates tightened — **50% clears before Phase 4 build starts** (not "before Phase 0.5"). **50% due day-7 of UAT OR on written acceptance, whichever first**.

---

## 1. What you're getting (v1)

Four conversion-critical modules, production-ready for Australia:

| # | Module | What it does | Price |
|---|---|---|---|
| 1 | **AI Advisor Chat** | MARA-safe AI chat grounded in 43 Australian universities. Helps prospective international students explore course options. Deflects any visa / PR / migration question to a registered MARA agent. | Included in v1 |
| 1 | **5-Step Lead Capture** | Progressive form that captures student intent, scores the lead, and emails UniMate + Koda on submission. Privacy Act 1988 compliant with explicit service + marketing consent split. | Included in v1 |
| 1 | **UniMatch Engine** | Ranks Australian universities against student profile using CRICOS + QS WUR data. Returns top matches with reasoning. | Included in v1 |
| 1 | **SOP Generator** | Drafts a Statement of Purpose from the student's profile. Edit + regenerate loop. Downloads as PDF in-browser. | Included in v1 |
| **v1 fixed scope** | — | Web (Next.js) + Expo mobile (iOS + Android), deployed, seeded, MARA-compliant | **$3,000 AUD** |
| 2 | **n8n lead-sync activation** (optional one-time add-on) | Koda installs n8n on UniMate's Hostinger VPS, configures Google Workspace credential against UniMate's Google account, registers Supabase webhook, imports the pre-built workflow JSON, and runs smoke test. Every captured lead then mirrors to UniMate's Google Sheet in real time. **Hosting ($5–20/mo) + Google Workspace are UniMate's cost** — this is Koda's labour only. | **+$200 AUD one-time** |
| **Total if UniMate elects n8n** | — | — | **$3,200 AUD** |

Web-primary with companion Expo mobile app (iOS + Android).

---

## 2. What we're not building in v1

These six modules are explicitly deferred to v2 and quoted separately. Do not expect them in v1:

| # | Deferred module | Why deferred |
|---|---|---|
| 1 | Admin Dashboard (roles-based CRM) | In v1, leads land in the Supabase `leads` table (source of truth, fully queryable via Supabase Studio SQL) and arrive in UniMate's ops inbox via Resend email within 60s. This proves the lead engine and surfaces triage patterns BEFORE investing in custom dashboard UI — v2 then builds roles, assignment, status management, and audit trail against real workflow data. |
| 2 | Provider Dashboard (university partner view) | No university partners are signed yet; building now is speculative |
| 3 | Course Management Scraper | Automated university scraping is a legal grey area; 43 manually seeded CRICOS institutions covers the majority of student demand |
| 4 | Analytics Dashboard | Vercel Analytics + Supabase logs are sufficient for v1 traffic |
| 5 | Advanced Auth (Better Auth) | Supabase Auth magic link covers the v1 UX at zero integration cost |
| 6 | `internal_user_id` abstraction layer | Only relevant if you migrate off Supabase later |

---

## 3. Timeline

Phases 0–3 (scaffold + governance + Supabase seed + lead-capture UI) are already complete on Koda's side. The clock below starts when the signed SOW + deposit clear. **"Day N" means Nth business day (Monday–Friday, AEST/AEDT)** — weekends and AU public holidays do not count toward the build or UAT window.

| Day | Milestone |
|---|---|
| 0 | Signed SOW + 50% deposit cleared. Phase 4 build starts same business day. |
| 1–3 | UniMate delivers MARN, QEAC, ABN, legal entity, APP 8 acknowledgement (per `CLIENT-INTAKE.md` §A). These inputs are on the critical path — late delivery slips the production cut-over, not the build. |
| 1–7 | Phases 4–9: UniMatch engine, AI Advisor chat, P4.5 compliance gate, SOP generator, landing polish, mobile rebrand, production deploy |
| 7 | **Feature-complete on staging.** Atlas AI fully built and running on staging URL. UAT window opens. Production cut-over happens only after P4.5 compliance gate PASSES and all UniMate compliance inputs (MARN, QEAC, APP 8 acknowledgement) are received. |
| 7–14 | UniMate runs UAT against the 7-point criteria (see §6). Bug fixes included. |
| 14 | UAT complete OR written acceptance received (whichever first). Final payment due. Ownership of Vercel + Supabase + n8n (if elected) transferred to UniMate. |

Total: **7 business days build + 7 business days UAT ≈ 3 calendar weeks from deposit to acceptance.**

If n8n activation is elected, it's scheduled during the UAT window (day 8–10) and billed with the final payment.

**Critical path note:** if UniMate compliance inputs (MARN, QEAC, APP 8 acknowledgement) arrive after day 3, production cut-over slips day-for-day regardless of Koda's build progress — the compliance gate cannot pass without them.

---

## 4. Price

**v1 scope: $3,000 AUD (total, fixed).**

Includes: build, deploy, domain setup (`atlas-ai.vercel.app` or `atlasai.com.au` if UniMate registers and points DNS), 30-day post-launch bug fixes, compliance attestation doc.

**Optional one-time add-on:**

- **n8n lead-sync activation: +$200 AUD** (Koda's labour; UniMate-owned Hostinger VPS + Google Workspace are UniMate's cost). Default is **SKIP** — DB + Resend email already capture every lead. See §1 line 2.

**Total if UniMate elects n8n: $3,200 AUD.**

Excludes: new features post-UAT, v2 modules (see §9), ongoing monthly hosting costs (Supabase, Vercel, Hostinger VPS if elected — estimate ~$50–150 AUD/month, billed directly to UniMate on UniMate-owned accounts).

---

## 5. Payment terms

Fifty-fifty, two-gate.

| Milestone | Amount (v1) | Amount (v1 + n8n) | Due |
|---|---|---|---|
| **Deposit — 50%** | $1,500 AUD | $1,700 AUD | **Must clear before Phase 4 build starts.** Koda does not touch client-funded code until the deposit clears. |
| **Final — 50%** | $1,500 AUD | $1,500 AUD | **Due day-7 of the UAT window OR on written acceptance, whichever first.** |

Invoices from **Koda Labs** (sam@claudeking.org). Payment terms NET 7 from invoice date on each milestone.

**If n8n activation is elected:** the $200 line is rolled into the deposit (so deposit = $1,700). n8n install happens during UAT (day 8–10). Final payment stays $1,500.

**If UAT reveals UAT-criteria bugs (§6):** Koda fixes them without additional charge; UAT clock pauses while fixes are in flight and resumes when the fix is verified. Final payment is due only after all 7 UAT criteria PASS.

**Late payment:** Payment terms are NET 7. No interest applied on first overdue cycle; persistent non-payment >30 days past due pauses the 30-day post-launch support window until the invoice clears.

**IP transfer:** All code, Supabase project ownership, Vercel project ownership, and n8n workflow ownership transfer to UniMate on clearance of final payment. Before that, IP remains with Koda Labs — UniMate has a build-phase licence to operate the staging/production URL but no transferability rights.

**Deposit non-refundable after work commences:** Once Phase 4 build starts (i.e., the deposit clears and Koda writes the first P4 commit), the deposit is non-refundable. Standard industry practice for fixed-price delivery. If UniMate cancels between SOW signing and deposit clearance, no money has changed hands and there's nothing to refund.

---

## 5a. GST treatment

Fees are **exclusive of GST** unless expressly stated otherwise. If GST applies, UniMate must pay GST in addition to the Fees on receipt of a valid tax invoice. Koda Labs will issue tax invoices compliant with the A New Tax System (Goods and Services Tax) Act 1999 (Cth) where GST applies.

---

## 6. Acceptance criteria (UAT)

UniMate sign-off requires all seven rows to PASS in a live walk-through. Each row is binary — all seven must PASS for final payment to trigger. See `CLIENT-INTAKE.md` §G for the intake-side view.

| # | Criterion | How it's tested |
|---|---|---|
| 1 | Lead captured end-to-end | Submit seeded test lead → row in Supabase `leads` + email at UniMate ops inbox within 60s, with consent timestamp + wording version visible |
| 2 | MARA-safe chat | 10 test queries including explicit visa/PR/subclass-500/MLTSSL questions → zero migration-advice strings in responses. MARA disclaimer appears on every turn + in page footer. |
| 3 | UniMatch returns ≥3 results | Sample student profile returns 3+ CRICOS-registered matches with reason strings under 500ms |
| 4 | SOP generator outputs valid PDF | Draft → edit → regenerate → download. PDF opens in Chrome + Safari + Acrobat. |
| 5 | Mobile app opens with Atlas AI branding | Expo build installs on test Android/iOS, launches, shows Atlas AI name + logo |
| 6 | Production URL live | `atlas-ai.vercel.app` (or custom domain) returns 200 on `/`, `/api/match`, `/api/chat` |
| 7 | Compliance attestation signed | Attestation document signed by Koda Labs' two independent reviewers delivered at handover |

---

## 7. Compliance

Built to Australian standards:

- **MARA Code of Conduct** — no migration advice in chat, footer disclaimer, UniMate's MARA number displayed in page footer
- **Privacy Act 1988 + Australian Privacy Principles (APPs)** — explicit consent before any PII stored; service + marketing consent split; consent wording + version + timestamp stored per lead
- **QEAC** — only CRICOS-registered courses surfaced; no misleading ranking claims beyond QS WUR public data
- **APP 8 cross-border disclosure** — Supabase is hosted in Singapore (`ap-southeast-1`). The lead-capture UI explicitly discloses Singapore hosting in the Phase 3 collection notice. UniMate's written acknowledgement of this cross-border disclosure is a precondition of the Phase 4.5 compliance gate (see `CLIENT-INTAKE.md` §A8 + §D3).
- **No unauthorised scraping** — 43 AU universities seeded manually from CRICOS open data + public university pages

Compliance attestation doc provided at handover, signed by Koda Labs' two independent reviewers (code review + AU compliance review).

---

## 8. Support

- **30 days post-launch** — bug fixes included at no extra cost
- **Feature additions** — quoted separately per ticket
- **Emergency outages** — best-effort response within 4 business hours

---

## 9. v2 roadmap (indicative pricing)

Not part of v1. Separate quote required. Pricing is indicative and anchors the v2 conversation:

| v2 module | Indicative price |
|---|---|
| Admin Dashboard (roles-based CRM) | $2,000–3,000 AUD |
| Provider Dashboard | $3,000–4,000 AUD |
| Course Management Scraper (pending legal review) | $2,000 AUD |
| Analytics Dashboard | $1,000–2,000 AUD |
| Advanced Auth (Better Auth migration) | $1,000 AUD |
| `internal_user_id` abstraction layer | $1,000 AUD |

**v2 envelope:** ~$10,000–13,000 AUD depending on scope.

---

## 10. Assumptions (UniMate to provide)

These are on UniMate's side of the line. Missing any of them delays the timeline proportionally.

1. UniMate's MARA registration number + QEAC credentials
2. Domain: either approval of `atlas-ai.vercel.app` as primary OR `atlasai.com.au` registered and pointed to us
3. Brand assets: logo + colour tokens within 3 business days of PO
4. University shortlist: UniMate's top 10 preferred institutions for seed curation (remaining 33 sourced from public CRICOS data)
5. Named contact for compliance sign-off (MARA-registered agent on the UniMate team)

---

## 11. Governance (how the work is audited)

Koda Labs' internal governance is transparent and auditable:
- Every code change is committed with a phase reference and files touched
- Every phase requires dual-agent sign-off (code review + compliance review) before closing
- All plan-check + phase-verify artifacts are archived and available on request
- No scope creep — any request outside v1 is flagged and quoted

---

## 12. Confidentiality

Each party must keep confidential the other party's non-public business, technical, financial, and customer information, including (without limitation) source code, architecture, lead data, commercial terms of this SOW, and any information marked or reasonably identifiable as confidential. Each party will use such information only for performance of this SOW. Confidentiality survives termination of this SOW indefinitely. Permitted disclosures are limited to: (a) legally compelled disclosure; (b) disclosure to professional advisers under equivalent confidentiality obligations; (c) disclosure with the other party's prior written consent.

---

## 13. Limitation of liability

To the maximum extent permitted by law, each party's aggregate liability arising out of or in connection with this SOW (whether in contract, tort, equity, statute, or otherwise) is **limited to the Fees paid or payable under this SOW**. Neither party is liable for indirect, consequential, special, punitive, or incidental loss or damage, including without limitation loss of profit, loss of revenue, loss of goodwill, loss of data, or business interruption, even if the party has been advised of the possibility of such loss. Nothing in this clause limits liability to the extent such limitation is prohibited by the Australian Consumer Law or other non-excludable statutory rights.

---

## 14. Change control

Any change to scope, integrations, acceptance criteria, timeline, or deliverables must be **agreed in writing** and may require a Change Order or a new Purchase Order before work begins. Process:

1. Either party raises a written change request (email to sam@claudeking.org is sufficient).
2. Koda Labs returns an impact assessment within 2 business days — price delta, timeline delta, affected phases, compliance review required (Y/N).
3. UniMate accepts in writing OR rejects in writing. No change is binding until written acceptance.
4. Accepted changes are appended to this SOW as numbered Change Orders and do not amend §4 (Price) or §3 (Timeline) retroactively — each Change Order has its own line item.

Requests that fall within the v2 backlog (§9) may be quoted as separate SOWs rather than Change Orders, at Koda Labs' election.

---

## 15. Warranty

Koda Labs warrants that the Deliverables will materially conform to the Acceptance Criteria (§6) for **30 days after final acceptance**. The Client's exclusive remedy for breach of this warranty is repair, replacement, or re-performance of the affected Deliverable at Koda Labs' election. This warranty does not apply to:

- Defects caused by UniMate's modifications to the code, infrastructure, or configuration
- Defects caused by third-party services outside Koda Labs' control (Supabase, Vercel, OpenAI, Resend, Hostinger, Google Workspace)
- Changes to Australian law, MARA Code of Conduct, or Privacy Act that take effect after handover
- Usage outside the documented acceptance criteria

Except as expressly set out in this SOW, all other warranties, representations, and conditions, whether express or implied, are excluded to the maximum extent permitted by law.

---

## 16. Force majeure

Neither party is liable for delay or failure to perform caused by events beyond its reasonable control, including (without limitation) acts of God, natural disasters, pandemics, governmental action, internet outages affecting more than one major tier-1 provider simultaneously, cyberattacks on third-party dependencies, or labour disruptions. The affected party must notify the other within 2 business days of the event and use reasonable efforts to mitigate. If the force majeure event continues for more than 30 days, either party may terminate this SOW with written notice; in such case, Fees paid for work already performed are non-refundable and Fees for work not yet started are not owed.

---

## 17. Governing law and jurisdiction

This SOW is governed by the laws of **New South Wales, Australia**. The parties submit to the exclusive jurisdiction of the courts of New South Wales. Before commencing litigation, the parties will in good faith attempt to resolve any dispute by direct negotiation for at least 14 days. This clause does not prevent either party from seeking urgent interlocutory relief.

---

## Signatures

**Koda Labs** — Sam Krishna
Signed: _______________________ Date: _______________________

**UniMate Pty Ltd** — _______________________
Signed: _______________________ Date: _______________________
