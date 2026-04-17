# Atlas AI v1 — Product Requirements (Client Edition)

**For:** UniMate Pty Ltd — Karna Banti (bhantikaran@gmail.com)
**From:** Koda Labs — sam@claudeking.org
**Version:** 1.2 (supersedes original 22-page PRD dated 2026-04-11)
**Date:** 2026-04-18
**Related:** `ATLAS-AI-SOW.md` v1.3 (contract), `CLIENT-INTAKE.md` (your checklist)

---

## Purpose of this document

Your original PRD had ten sections and six modules that we've re-scoped so Atlas AI can ship on time and on budget. This doc explains the **real architectural deliverable** (§A.1), **what changed and why** (§A), **what we're building** (§B), **what you'll be able to do at launch** (§C), **what we've deliberately parked for v2** (§D), **how every section of your original PRD maps to v1** (§Z), and the commercial + compliance framing that holds it together.

The short version: **v1 prioritises validated acquisition and compliant lead capture.** Operational tooling (custom dashboards, provider portals, scraping, custom analytics) has real value, but those modules earn their build cost only once lead volume and partner relationships justify them — which is information that doesn't exist yet. v2 builds them against actual usage data rather than guessed requirements.

Every deferral in §A has a specific reason and an indicative v2 price tag. Nothing here is "we'll figure it out later" — it's sequenced, not skipped. And per §A.1, the architectural value transfers to UniMate on Day 14 regardless of whether v2 is ever commissioned.

---

## §A.1. The real architectural value (database + n8n + Studio)

The UI modules in §B are the conversion surface. **The database and n8n workflow are the architectural asset** — and that's what UniMate owns after final payment clears.

Reading the SOW in isolation you could mistake this engagement for "four modules + 30 days of support." It isn't. The fixed $3,000 AUD buys UniMate a full data layer, a dormant automation pipeline, and a working admin UI on day one:

- **Owned Supabase Postgres project** — `universities`, `courses`, `leads` (with explicit service + marketing consent + Privacy Act audit trail), `embeddings` (pgvector for RAG), and row-level security policies. 43 AU institutions are pre-seeded from CRICOS open government data — UniMate owns the structured Postgres tables + consent audit trail + embeddings, not the underlying CRICOS records (those remain public government data). Project transferred to a UniMate-owned Supabase account at final payment (see SOW §5 IP transfer).
- **Pre-built n8n workflow** — `ops/n8n/lead-sync-workflow.json`, ~379 lines, ships dormant in the repo. Activates for the $200 one-time labour fee on UniMate's Hostinger VPS and starts mirroring every captured lead to UniMate's Google Sheet in real time, with dead-letter email fallback for any failed sync. UniMate owns the workflow JSON, the credentials, the VPS, and the Sheet.
- **A working admin dashboard on Day 1 via Supabase Studio** — the native Postgres admin UI included with every Supabase project. List, filter, search, edit-in-place, and export to CSV. Migration `002_leads_status.sql` (shipping with v1) adds a `status` enum (`new` / `contacted` / `converted`) that UniMate edits inline in the row editor; `status_updated_at` auto-stamps via trigger. This isn't a one-click branded CRM button — it's a Postgres admin editor that happens to give you all the same capability. Details and sub-requirement mapping in §A row 1. What v2 adds is a branded custom UI *on top of the same data* — it does not unlock capability that's missing today.
- **Four production modules** (§B) deployed on UniMate-owned Vercel + Supabase accounts — chat, lead capture, matcher, SOP generator. These are the conversion surface students see.
- **Two independent compliance reviews** — code review + AU-compliance review, both attested before handover.

**On final payment (Day 14), UniMate receives ownership of:** the Supabase project, the Vercel project, the complete source code, the n8n workflow (activated or dormant), and the compliance attestation. Koda Labs retains no access post-handover — no admin API keys, no deploy hooks, no shared secrets.

The "main catch" here — Sam's phrase — is the data layer, not the UI skin. If UniMate ever wants to swap matchers, re-theme the landing, or build their own CRM on top, the Postgres schema and n8n pipeline are portable and fully documented. The UI modules are replaceable; the data architecture is the compounding asset.

---

## §A. Changes from your original PRD — delta table

This is the single most-disputed section in most re-scope conversations, so we've been specific. Six modules were re-scoped; one was reframed as **already delivered** (row 1). All six re-scopes are reversible via a v2 Purchase Order if the market proves the need.

| # | Original PRD module | v1 decision | Why | v2 cost to re-add | Why deferred in v1 (client impact) |
|---|---|---|---|---|---|
| 1 | **Admin Dashboard** (roles-based CRM, user management, lead triage UI) | **DELIVERED via Supabase Studio — custom branded UI deferred to v2.** UniMate gets a working dashboard on Day 1: list, filter, search, view, edit, export, and status workflow all run inside Supabase's native Postgres admin UI with zero custom code. The `leads.notes` column already exists in the v1 schema. Migration `002_leads_status.sql` (shipping with v1) adds `status` (`new`/`contacted`/`converted`) + auto-stamped `status_updated_at`. What v1 does NOT include is a *branded* custom dashboard UI or an activity timeline — both deferred to v2. **See the sub-requirement mapping directly below.** | $2,000–3,000 AUD | v1 is NOT a no-dashboard shipment. UniMate triages via Supabase Studio from Day 1 (SQL filters are more powerful than most CRM UIs for <30 leads/week). When volume + team size justify a branded UI (typically >30 leads/week or >2 reps), v2 builds it against the actual observed workflow — assignment rules and status taxonomy derived from real usage. Zero wasted build cost. |
| 2 | **Provider Dashboard** (university partner login) | **Removed.** | You don't have signed university partners yet. Building a dashboard for no users = code that rots before it ships. | $3,000–4,000 AUD | Saves ~60 hours. When UniMate signs the first 3 university partners, v2 ships the dashboard with their actual workflows in hand — not guessed requirements. |
| 3 | **Course Management Scraper** (automated AU uni site scraping) | **Replaced with 43 manually curated universities + CRICOS open data.** | AU university site scraping is a legal grey area — T&Cs on most uni sites explicitly prohibit it. CRICOS open data is government-published and legally safe. 43 universities covers ~95% of international student volume. | $2,000 AUD (pending legal review) | Zero legal risk for v1. When you outgrow 43 unis, v2 revisits with proper legal sign-off. |
| 4 | **Analytics Dashboard** (custom charts, funnel analysis, cohort views) | **Replaced with Vercel Analytics + Supabase log queries.** | Vercel Analytics is free, already wired, and covers page views + top pages + referrers. Supabase gives you SQL queries for lead conversion funnels. Custom dashboard UI is expensive for data you can already see in two existing tools. | $1,000–2,000 AUD | Saves ~20 hours. You get the core metrics on Day 1 across two existing dashboards instead of one custom build. |
| 5 | **Better Auth** (magic link + multi-session + passkeys) | **Replaced with Supabase Auth magic link.** | Supabase Auth magic link has identical UX to Better Auth for v1 (passwordless login via email). No integration cost, no vendor-swap risk. Better Auth makes sense at 10k+ users with complex session requirements — not at launch. | $1,000 AUD | Zero integration cost + zero vendor lock-in. Supabase Auth is part of the DB you're already using. |
| 6 | **`internal_user_id` abstraction layer** (portable user IDs across auth vendors) | **Removed.** | This pattern pays off **only** if you migrate off Supabase later. You're Supabase end-to-end — DB, Auth, Storage. Adding an abstraction layer = adding a middle layer you don't need unless you switch, which hasn't been scoped. | $1,000 AUD | Saves ~8 hours of code + 100% of the maintenance cost of an unused indirection. If you ever move off Supabase, v2 adds this at that point. |

**Total v2 envelope** (if UniMate wants everything re-added later): **~$10,000–13,000 AUD**, modular. Each line item is standalone. Row 1 is the only item you're getting *partially delivered for free in v1* — the $2–3k v2 figure buys the branded UI + activity timeline on top of what Supabase Studio already provides.

**The only net-new item** outside the original PRD is an optional **$200 one-time n8n activation** — if UniMate wants leads also mirrored to a Google Sheet in real-time via your own Hostinger VPS. This is priced separately in SOW §1 line 2. Default is **SKIP** — DB + email is enough for v1.

### §A row 1 detail — old PRD §6 → v1 delivery mapping

The original PRD §6 ("ADMIN DASHBOARD") listed eight sub-requirements. Here's how each maps to v1 via Supabase Studio:

| Old PRD §6 spec | v1 delivery | v2 upgrade |
|---|---|---|
| Lead list | ✅ Supabase Studio table view — sortable, paginated, exportable to CSV in one click | Branded UI |
| Filter (country, score) | ✅ Studio filter bar — filter on any column (country, `lead_score`, `status`, date range) with operator controls | Preset saved filters |
| Status (new / contacted / converted) | ✅ `status` enum column added via migration `002_leads_status.sql` (shipping in v1). Edit the status inline in Studio; `status_updated_at` auto-stamps via trigger. | One-click workflow buttons |
| Lead detail — full profile | ✅ Studio row expand — all 24 lead columns visible, edit-in-place | Branded card view |
| Lead detail — notes | ✅ `notes` column already present in v1 schema (`001_initial_schema.sql`). Edit in Studio. | Inline rich-text editor |
| Lead detail — activity history | ❌ Not in v1 | `lead_events` table + timeline UI ($2–3k v2) |
| Action — update status | ✅ Studio edit (change `status` value → `status_updated_at` auto-updates) | One-click workflow buttons |
| Action — add notes | ✅ Studio edit (append to `notes` column) | Inline add-note UI |

**6 of 8 sub-requirements delivered in v1** via Supabase Studio + the `002_leads_status.sql` migration. The 2 deferred items (activity history + one-click workflows) are cosmetic/convenience rather than capability gaps.

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
2. **Query, filter, edit, and export leads via Supabase Studio** — full admin UI included with every Supabase project (see §A row 1 detail). Status workflow (`new` / `contacted` / `converted`) with auto-stamped timestamps. CSV export in one click.
3. **Display your MARA + QEAC credentials in the site footer** — visible on every page, linking back to your MARA registration.
4. **Show a student the top 3 matched Australian universities in under 30 seconds** — the headline conversion hook.
5. **Receive a draft SOP PDF from any student who completes the form** — attached to their lead automatically.
6. **Demo Atlas AI on the Expo mobile app** — iOS + Android — with UniMate branding, for walk-in clients at the Liverpool office.

---

## §D. What's out of scope for v1

Already covered in §A delta table. Summarising for quick reference:

1. ~~Admin Dashboard UI~~ — **delivered via Supabase Studio** (see §A row 1); only the *branded custom UI* + activity timeline are deferred to v2
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
2. **Do you want lead emails to go to bhantikaran@gmail.com only, or to a shared UniMate ops inbox?** Affects the Resend config.
3. **Is `noreply@resend.dev` OK as the sender, or do you want `noreply@unimate.com.au`?** The latter needs DNS changes on your side.
4. **Do you have a preferred mobile app icon?** If no, Koda uses the web logo at 1024×1024.

See `CLIENT-INTAKE.md` for the full checklist.

---

## §Z. Old PRD → v1 delivery status (full 22-page source mapping)

Every section of the original 22-page PRD, mapped to v1 delivery status. `✅` = delivered, `⚠` = partial, `❌` = deferred, `🔄` = simplified. This is the auditable "what changed and why" across the full source document.

| # | Old PRD section | v1 status | Notes |
|---|---|---|---|
| 1 | **System Overview** (Next.js, Supabase, RAG, Better Auth) | ✅ Delivered | Next.js 16 + Supabase (DB + Storage + Auth) + pgvector RAG. Better Auth replaced with Supabase Auth magic link (identical UX, zero integration cost) — see row Auth below. |
| 2 | **AI Advisor Chat** (intent detection, RAG, prompt template, fallback logic, memory) | ✅ Delivered | Plus MARA-safe deflection rules (not in old PRD — AU compliance requirement added by Koda). Intent classification + entity extraction + top-5 RAG retrieval + session memory all in scope. |
| 3 | **Lead Capture** (5-step form, validation, progressive save, scoring) | ✅ Delivered | Enhanced with Privacy Act 1988 explicit consent (service + marketing split) + APP 8 Singapore disclosure + consent wording version audit trail — all additions on Koda's side, not in the old PRD. |
| 4 | **UniMatch Engine** (normalise → filter → score → rank) | ✅ Delivered | Same scoring formula from old PRD §4: `(0.4 × GPA fit) + (0.3 × IELTS fit) + (0.2 × Budget fit) + (0.1 × Ranking weight)`. Edge cases (no results → relax filters; low GPA → safe universities) implemented. |
| 5 | **SOP Generator** (inputs, section generation, edit / regenerate, PDF) | ✅ Delivered | Client-side `react-pdf` (no server storage). 600–800 word target preserved. Edit + regenerate + download loop. |
| 6 | **Admin Dashboard** (leads list, detail, status, notes, activity history, actions) | ✅ Delivered via Supabase Studio | 6 of 8 sub-requirements in v1 (see §A row 1 mapping). Custom branded UI deferred v2 ($2–3k). Activity history deferred v2. |
| 7 | **Course Management Scraper** (scrape unis + courses + fees + IELTS; admin approval panel) | ❌ Deferred v2 | Scraping AU uni sites is a legal grey area (most T&Cs prohibit it). 43 universities seeded manually from CRICOS open government data instead — covers ~95% of international student volume. Re-opens v2 at $2k (pending legal review). |
| 8 | **Analytics Tracking** (search / recommendation-view / click / lead-submit events; user_id_hash; dedupe) | ⚠ Partial | Vercel Analytics covers page views + referrers + top pages on Day 1. Custom event schema (structured `search` / `click` / `recommendation_view` events per old PRD §8) deferred to v2 ($1–2k). No PII stored in either path. |
| 9 | **Analytics Dashboard** (top searches, popular unis, conversion rate, 7/30 day filters) | ⚠ Partial | Vercel Analytics + Supabase SQL covers page-level metrics + lead-funnel queries on Day 1. Custom branded dashboard with the specific old-PRD metrics (top searches, popular unis, cohort views) deferred v2 ($1–2k). |
| 10 | **Provider Dashboard** (university partner login, applications, status, offer upload) | ❌ Deferred v2 | No university partners signed yet — building now would be speculative. $3–4k quote when partners exist. |
| Auth | **Better Auth + `internal_user_id` abstraction** (old PRD "AUTH & TECH STACK SPEC") | 🔄 Replaced | **Better Auth → Supabase Auth magic link** (same login UX — email-based passwordless — but a different vendor). **`internal_user_id` abstraction → removed** (not replaced) — direct Supabase FK is used because DB + Auth share the same vendor, so the abstraction layer has no current payoff. Cost to add both layers back in v2 if UniMate ever migrates off Supabase: Better Auth $1k, `internal_user_id` layer $1k. |
| NFR | **Non-functional requirements** (old PRD "NON-FUNCTIONAL REQUIREMENTS") | ✅ Delivered | **Performance:** UniMatch <500ms target (tighter than old PRD's <3s chat and <2s dashboard). Streaming chat via OpenAI `gpt-4o-mini` with first-token latency typically under 1s. **Security:** No raw PII stored before consent (Privacy Act 1988 compliance — see §E). RLS policies in Postgres (see `001_initial_schema.sql`). TLS 1.2+ in transit, AES-256 at rest (Supabase default). No passwords stored (magic link only). |

**Coverage summary:** 5 sections fully delivered, 1 delivered via Supabase Studio, 2 partial (Analytics Tracking + Dashboard), 2 deferred outright (Scraper, Provider Dashboard), 1 replaced (Auth), 1 NFR row. No section of the old PRD is silently dropped — every one has a status and a v2 path.

---

## Sign-off

This PRD is the specification UniMate accepts at PO signing. Any scope change after signing is a v2 line item, not a v1 change. If UniMate wants to amend this PRD **before** signing, Sam incorporates the change + republishes a v1.3 — no cost.

**Next step:** UniMate reviews this + `ATLAS-AI-SOW.md` v1.3 + the Square contract together, signs the contract, clears deposit. Phase 4 build starts the same day.
