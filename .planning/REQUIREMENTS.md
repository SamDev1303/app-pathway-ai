# Pathway-AI v2.0 — Requirements

**Milestone:** v2.0 First-Customer Activation
**Started:** 2026-05-02
**Goal:** Validate that v1 earns revenue before building more modules.

---

## v2.0 Requirements (active)

### MOBILE — Wire mobile app to live data
- [ ] **MOBILE-01**: Mobile chat tab calls live `/api/chat` (currently mockData) and renders streamed responses
- [ ] **MOBILE-02**: Mobile match tab calls live `match_unis_for_lead` RPC with student profile
- [ ] **MOBILE-03**: Mobile lead-capture tab posts to live `/api/leads` and persists `match_token` for deep-linking
- [ ] **MOBILE-04**: Mobile API base is env-driven (`EXPO_PUBLIC_API_BASE`), defaulting to production but overridable for local dev

### DATA — Backfill v1 data quality gaps
- [ ] **DATA-01**: Backfill 48 NULL CRICOS course codes from public CRICOS register
- [ ] **DATA-02**: Expand seeded universities from 17 to 43 (full GO8 + regional + selected private)
- [ ] **DATA-03**: Re-embed any course with rewritten content (gpt-text-embedding-3-small) so chat RAG stays grounded

### MARKETING — Build the lead-magnet surface
- [ ] **MKT-01**: Single-page landing at `pathway-ai.vercel.app` with clear value prop, 30-second matcher demo embed, and lead-capture CTA above the fold
- [ ] **MKT-02**: One downloadable artifact (e.g. "AU University Selection Checklist" PDF) gated behind email capture, drives leads into the same Supabase `leads` table
- [ ] **MKT-03**: SEO-baseline: `<title>`, meta description, OpenGraph image, sitemap.xml, robots.txt
- [ ] **MKT-04**: Public contact email rendered consistently (`hello@pathway-ai.com` — register or use Resend domain)

### ACQUISITION — First close
- [ ] **ACQ-01**: Outreach list of 30 prospects (AU education agents, study-abroad coaches, university partner coordinators), enriched via existing CRM pipeline
- [ ] **ACQ-02**: One cold-email + one LinkedIn-DM template per prospect persona, sent with personalized angle
- [ ] **ACQ-03**: Demo flow scripted (live UniMatch + chat against prospect's actual student profile) — 15 min
- [ ] **ACQ-04**: Pricing decided + billing wired (Stripe checkout for at least one tier — likely $99/mo per agent or $499/mo per agency)

---

## Future Requirements (deferred to v2.1+ when unlock conditions met)

From `_reference/v1-research-summary.md` deferred-modules table — pick when condition is met, NOT on guessed priority:

- **Admin Dashboard (CRM)** — unlock at >30 leads/wk OR >2 reps using Supabase Studio
- **Provider Dashboard** — unlock at first 3 signed university partners
- **Course Management Scraper** — unlock with legal sign-off on AU uni T&Cs
- **Analytics Dashboard** — unlock when Vercel Analytics + Supabase logs prove insufficient
- **Better Auth** — unlock at 10k+ users with multi-session/passkey requirements
- **`internal_user_id` abstraction** — unlock if migrating off Supabase

---

## Out of Scope for v2.0 (explicit)

- Re-engineering the core 4 modules (chat, lead-capture, matcher, SOP) — they shipped, leave them
- iOS native app build (Apple Dev account blocker — separate track)
- WhatsApp / Telegram channel integrations (no signal yet that prospects want this)
- AI provider migration to Claude or Gemini (gpt-4o-mini is fine until cost or quality forces it)
- Multi-language (English-AU is the v2 surface)
- Visa-pathway content of any kind (compliance line is firm: educational + matching only, deflect everything else)

---

## Traceability

(Filled by ROADMAP.md once phases are mapped)

| REQ-ID | Phase |
|---|---|
| MOBILE-01–04 | P7 |
| DATA-01–03 | P8 |
| MKT-01–04 | P9 |
| ACQ-01–04 | P10 |
