# Statement of Work — Atlas AI v1

**Between:** Koda Labs (supplier) and **UniMate Pty Ltd** (client)
**Date prepared:** 2026-04-16
**SOW version:** 1.0 draft
**Prepared by:** Sam (Koda Labs) — sam@claudeking.org

---

## 1. What you're getting (v1)

Four conversion-critical modules, production-ready for Australia:

| Module | What it does |
|---|---|
| **AI Advisor Chat** | MARA-safe AI chat grounded in 43 Australian universities. Helps prospective international students explore course options. Deflects any visa / PR / migration question to a registered MARA agent. |
| **5-Step Lead Capture** | Progressive form that captures student intent, scores the lead, and emails UniMate + Koda on submission. Privacy Act 1988 compliant with explicit service + marketing consent split. |
| **UniMatch Engine** | Ranks Australian universities against student profile using CRICOS + QS WUR data. Returns top matches with reasoning. |
| **SOP Generator** | Drafts a Statement of Purpose from the student's profile. Edit + regenerate loop. Downloads as PDF in-browser. |

Web-primary with companion Expo mobile app (iOS + Android).

---

## 2. What we're not building in v1

These six modules are explicitly deferred to v2 and quoted separately. Do not expect them in v1:

| # | Deferred module | Why deferred |
|---|---|---|
| 1 | Admin Dashboard (roles-based CRM) | Leads go to a Google Sheet via Make.com in v1 — proves the lead engine before investing in dashboard UI |
| 2 | Provider Dashboard (university partner view) | No university partners are signed yet; building now is speculative |
| 3 | Course Management Scraper | Automated university scraping is a legal grey area; 43 manually seeded CRICOS institutions covers the majority of student demand |
| 4 | Analytics Dashboard | Vercel Analytics + Supabase logs are sufficient for v1 traffic |
| 5 | Advanced Auth (Better Auth) | Supabase Auth magic link covers the v1 UX at zero integration cost |
| 6 | `internal_user_id` abstraction layer | Only relevant if you migrate off Supabase later |

---

## 3. Timeline

- **Week 0:** Signed SOW + 50% deposit received
- **Week 1:** Supabase setup, 43 universities seeded, lead capture live
- **Week 2:** UniMatch API, AI Advisor Chat with MARA-safe rails, compliance gate
- **Week 3:** SOP Generator + PDF export, mobile rebrand, QA, handover

Total: **3 weeks from deposit to client acceptance.**

---

## 4. Price

**$3,000 AUD (total, fixed).**

Includes: build, deploy, domain setup (atlas-ai.vercel.app or atlasai.com.au if provided), 30-day post-launch bug fixes.

Excludes: new features post-launch, v2 modules, ongoing monthly hosting costs (~$50–150 AUD/month, covered by UniMate).

---

## 5. Payment terms

| Milestone | Amount | Due |
|---|---|---|
| PO signing (50% deposit) | $1,500 AUD | Before Phase 0.5 execution starts |
| Client acceptance sign-off | $1,500 AUD | On written acceptance of deliverables |

Invoices from **Koda Labs** (sam@claudeking.org). Payment terms NET 7.

---

## 6. Acceptance criteria

UniMate sign-off requires all of the following to be demonstrable in a live walk-through:

1. Four v1 modules work end-to-end against a seeded Supabase project
2. MARA disclaimer appears on every chat turn + in page footer with UniMate's registration link
3. A test lead is captured in the database AND arrives by email at both Sam + UniMate, with consent timestamp visible
4. A Statement of Purpose downloads as PDF from the drafted state
5. Mobile app opens with Atlas AI branding
6. Production site live at `atlas-ai.vercel.app` (or `atlasai.com.au` if registered)

---

## 7. Compliance

Built to Australian standards:

- **MARA Code of Conduct** — no migration advice in chat, footer disclaimer, UniMate's MARA number displayed
- **Privacy Act 1988** — explicit consent before any PII stored; service + marketing consent split; consent wording + version stored per lead
- **QEAC** — only CRICOS-registered courses surfaced; no misleading ranking claims
- **Data residency** — Supabase hosted in Sydney (`ap-southeast-2`)

Compliance attestation doc provided at handover, signed by Koda Labs' reviewers.

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

## Signatures

**Koda Labs** — Sam Krishna
Signed: _______________________ Date: _______________________

**UniMate Pty Ltd** — _______________________
Signed: _______________________ Date: _______________________
