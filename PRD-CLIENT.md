# Atlas AI v1 — Product Requirements (Client Edition)

**For:** UniMate Pty Ltd — Bilal & Rocco
**From:** Koda Labs — sam@claudeking.org
**Version:** 1.1 (supersedes original 22-page PRD dated 2026-04-11)
**Date:** 2026-04-18
**Related:** `ATLAS-AI-SOW.md` v1.1 (contract), `CLIENT-INTAKE.md` (your checklist)

---

## Purpose of this document

Your original PRD had six modules we've re-scoped so Atlas AI can ship on time and on budget. This doc explains **what changed and why** (§A), **what we're building** (§B), **what you'll be able to do at launch** (§C), and **what we've deliberately parked for v2** (§D).

The short version: **v1 prioritises validated acquisition and compliant lead capture.** Operational tooling (admin dashboards, provider portals, scraping, analytics) has real value, but those modules earn their build cost only once lead volume and partner relationships justify them — which is information that doesn't exist yet. v2 builds them against actual usage data rather than guessed requirements.

Every deferral in §A has a specific reason and an indicative v2 price tag. None of this is "we'll figure it out later" — it's sequenced, not skipped.

---

## §A. Changes from your original PRD — delta table

This is the most important section. Six things changed. All six are reversible via a v2 Purchase Order if the market proves the need.

| # | Original PRD module | v1 decision | Why | v2 cost to re-add | Why deferred in v1 (client impact) |
|---|---|---|---|---|---|
| 1 | **Admin Dashboard** (roles-based CRM, user management, lead triage UI) | **Deferred to v2. In v1, leads land in Supabase `leads` (fully queryable via Supabase Studio SQL, export-to-CSV in one click) AND arrive in UniMate's ops inbox via Resend email within 60s.** | Dashboard UI for triage, assignment, status management, and accountability is real value — but building it **before** you know how many leads arrive per week and what your team's actual triage workflow is, risks building the wrong dashboard. v1 gives UniMate 100% lead capture + 0-latency notification so the workflow surfaces before the UI is committed. Shopify, Stripe, and most SaaS lead systems start this way in month one and graduate to custom UI once the real process is known. | $2,000–3,000 AUD | UniMate triages in month 1–2 via Supabase Studio + inbox (SQL filters are more powerful than most CRM UIs for small volumes). When lead volume + team size justify custom UI (typically >30 leads/week or >2 reps), v2 builds it against the actual observed workflow — roles, assignment rules, and status taxonomy derived from real usage. Zero wasted build cost. |
| 2 | **Provider Dashboard** (university partner login) | **Removed.** | You don't have signed university partners yet. Building a dashboard for no users = code that rots before it ships. | $3,000–4,000 AUD | Saves ~60 hours. When UniMate signs the first 3 university partners, v2 ships the dashboard with their actual workflows in hand — not guessed requirements. |
| 3 | **Course Management Scraper** (automated AU uni site scraping) | **Replaced with 43 manually curated universities + CRICOS open data.** | AU university site scraping is a legal grey area — T&Cs on most uni sites explicitly prohibit it. CRICOS open data is government-published and legally safe. 43 universities covers ~95% of international student volume. | $2,000 AUD (pending legal review) | Zero legal risk for v1. When you outgrow 43 unis, v2 revisits with proper legal sign-off. |
| 4 | **Analytics Dashboard** (custom charts, funnel analysis, cohort views) | **Replaced with Vercel Analytics + Supabase log queries.** | Vercel Analytics is free, already wired, and covers page views + top pages + referrers. Supabase gives you SQL queries for lead conversion funnels. Custom dashboard UI is expensive for data you can already see in two existing tools. | $1,000–2,000 AUD | Saves ~20 hours. You get 100% of the metrics on Day 1 in two separate dashboards instead of one custom build. |
| 5 | **Better Auth** (magic link + multi-session + passkeys) | **Replaced with Supabase Auth magic link.** | Supabase Auth magic link has identical UX to Better Auth for v1 (passwordless login via email). No integration cost, no vendor-swap risk. Better Auth makes sense at 10k+ users with complex session requirements — not at launch. | $1,000 AUD | Zero integration cost + zero vendor lock-in. Supabase Auth is part of the DB you're already using. |
| 6 | **`internal_user_id` abstraction layer** (portable user IDs across auth vendors) | **Removed.** | This pattern pays off **only** if you migrate off Supabase later. You're Supabase end-to-end — DB, Auth, Storage. Adding an abstraction layer = adding a middle layer you don't need unless you switch, which hasn't been scoped. | $1,000 AUD | Saves ~8 hours of code + 100% of the maintenance cost of an unused indirection. If you ever move off Supabase, v2 adds this at that point. |

**Total v2 envelope** (if UniMate wants everything re-added later): **~$10,000–13,000 AUD**, modular. Each line item is standalone.

**The only net-new item** outside the original PRD is an optional **$200 one-time n8n activation** — if UniMate wants leads also mirrored to a Google Sheet in real-time via your own Hostinger VPS. This is priced separately in SOW §1 line 2. Default is **SKIP** — DB + email is enough for v1.

---

## §B. What v1 actually ships (four modules)

All four are production-ready, deployed, and signed off by two independent reviewers (one for code quality, one for AU compliance) before handover.

### 1. AI Advisor Chat
Students ask free-form questions about studying in Australia. The AI answers with streaming responses grounded in the 43 seeded universities + their CRICOS courses. **Every answer ends with a MARA disclaimer** — "This is not migration advice. Consult a registered MARA agent." — and any visa, PR, subclass-500, MLTSSL, or PR-points question is deflected to UniMate's MARA registration, never answered by the AI.

**Why this matters:** it's the only AI chat in the AU student space that won't get UniMate in trouble with MARA for giving unlicensed migration advice. That's the whole unlock.

### 2. Lead Capture
5-step progressive form. Steps 1–4 save to the student's browser only — no data hits your database until they tick the **service consent** checkbox on step 5. Service consent is required; marketing consent is optional and separate. Every captured lead stores the **consent timestamp + wording version**, so if you ever face a Privacy Act audit, you can show exactly what the student agreed to on the day they submitted.

The lead arrives in two places: the `leads` table in Supabase (source of truth) and an email to your ops inbox (notification). Each lead includes a lead score so you can prioritise.

### 3. UniMatch Engine
After step 3 of the lead form, the student sees their top-3 matched universities with a match % and a one-line reason each. Matching uses real CRICOS data only — no made-up courses, no unverified rankings. Results return in under 500ms.

### 4. SOP Generator
From the student's lead profile, Atlas generates a draft Statement of Purpose they can edit section-by-section, then download as a PDF — all in the browser, no server-side work. This becomes a lead magnet: students don't easily walk away from a system that just drafted their SOP.

---

## §C. What UniMate will be able to do on Day 1

1. **Receive a qualified lead by email** — name, contact, study preferences, budget, lead score, consent timestamp. Arrives within 60 seconds of submission.
2. **Query your `leads` table** — full SQL access in Supabase Studio. Export to CSV in one click.
3. **Display your MARA + QEAC credentials in the site footer** — visible on every page, linking back to your MARA registration.
4. **Show a student the top 3 matched Australian universities in under 30 seconds** — the headline conversion hook.
5. **Receive a draft SOP PDF from any student who completes the form** — attached to their lead automatically.
6. **Demo Atlas AI on the Expo mobile app** — iOS + Android — with UniMate branding, for walk-in clients at the Liverpool office.

---

## §D. What's out of scope for v1

Already covered in §A delta table. Summarising for quick reference:

1. Admin Dashboard UI → use Supabase Studio + email
2. Provider Dashboard → build when you sign universities
3. Course Scraper → CRICOS public data covers 43 unis
4. Analytics Dashboard → Vercel Analytics + Supabase logs
5. Advanced Auth → Supabase magic link covers v1 UX
6. `internal_user_id` layer → only needed if migrating off Supabase

**New requests that arrive during UAT** will be logged, quoted, and added as v2 line items — not squeezed into v1. This keeps the launch date firm and the scope legible.

---

## §E. Compliance (non-negotiable for AU launch)

Atlas AI is built for the Australian market with the following legal foundations:

| Requirement | How Atlas AI meets it |
|---|---|
| **MARA Code of Conduct** — no migration advice in chat | System-level hard rule + per-turn disclaimer footer + UniMate's MARN displayed in page footer. Visa questions redirect to a registered MARA agent. |
| **Privacy Act 1988 + APPs** — explicit consent on lead capture | No PII stored before consent. Service + marketing consent split. Consent timestamp + wording version stored per lead. |
| **APP 8 — cross-border disclosure** (Supabase is hosted in Singapore) | The lead-capture modal includes an explicit disclosure about Singapore hosting. UniMate must provide a written acknowledgement before launch (see intake item A8). |
| **QEAC standards** — no misleading course claims | Only CRICOS-registered courses surface. CRICOS badge visible. No ranking claims beyond QS WUR public data. |
| **No unauthorised scraping** | 43 universities seeded from CRICOS open data + public university pages only. Zero automated scraping in v1. |

A **compliance attestation document** signed by Koda Labs' two independent reviewers is delivered at handover.

---

## §F. Timeline

Four gates, fixed dates from PO signature:

| Day | Milestone |
|---|---|
| 0 | PO signed, deposit cleared. Phase 4 build starts. |
| 1–3 | UniMate provides MARN, QEAC, ABN, legal entity, APP 8 acknowledgement (see intake §A) |
| 3 | Brand assets sent (logo, colours) — defaults apply if skipped |
| 7 | Build complete. Atlas AI live on staging. UAT window opens. |
| 14 | UAT complete. Final payment due. Ownership of Vercel + Supabase transferred to UniMate. |

Full detail in SOW §3.

---

## §G. Support after launch

- **30 days post-launch** — bug fixes included at no extra cost
- **Feature additions** — quoted per ticket against v2 backlog
- **Emergency outages** — best-effort response within 4 business hours
- **Compliance changes** (e.g. new MARA Code revisions) — quoted as v2 line items

---

## §H. Questions UniMate should expect to be asked

Not blockers, but Sam will ask these before build start:

1. **Do you already have a privacy policy URL?** If no, Koda drafts a template based on APP 5 requirements.
2. **Do you want lead emails to CC both Bilal and Rocco, or one ops inbox?** Affects the Resend config.
3. **Is `noreply@resend.dev` OK as the sender, or do you want `noreply@unimate.com.au`?** The latter needs DNS changes on your side.
4. **Do you have a preferred mobile app icon?** If no, Koda uses the web logo at 1024×1024.

See `CLIENT-INTAKE.md` for the full checklist.

---

## Sign-off

This PRD is the specification UniMate accepts at PO signing. Any scope change after signing is a v2 line item, not a v1 change. If UniMate wants to amend this PRD **before** signing, Sam incorporates the change + republishes a v1.2 — no cost.

**Next step:** UniMate reviews this + `ATLAS-AI-SOW.md` v1.1 + the Square contract together, signs the contract, clears deposit. Phase 4 build starts the same day.
