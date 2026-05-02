# Pathway-AI v1 — Research Summary

Distilled from the original v1 brief and intake research. This is the building-block input for Pathway-AI's v1+ roadmap. No client identity, no PII — just the product decisions and architectural facts worth carrying forward.

---

## Original ask (6 modules) → re-scoped delivery (4 modules)

The original brief specified six modules. Six were re-scoped or deferred to v2 with explicit reasoning. The four shipped modules are the conversion surface; the v2 deferrals are sequenced, not skipped — each unlocks against real usage data rather than guessed requirements.

### Shipped in v1

| # | Module | What it does |
|---|---|---|
| 1 | **AI Advisor Chat** | LLM chat grounded in 43 Australian universities. Deflects visa / PR / migration questions to a licensed migration agent. |
| 2 | **5-Step Lead Capture** | Progressive form that captures student intent, scores the lead, and emails on submission. Privacy Act 1988 (Cth) compliant with explicit service + marketing consent split. |
| 3 | **UniMatch Engine** | Ranks Australian universities against student profile using CRICOS + QS WUR data. Returns top matches with reasoning. |
| 4 | **SOP Generator** | Drafts a Statement of Purpose from the student's profile. Edit + regenerate loop. Downloads as PDF in-browser. |

### Deferred to v2 (reasoning preserved for sequencing)

| # | Deferred module | Why deferred |
|---|---|---|
| 1 | Admin Dashboard (roles-based CRM, assignment, audit trail) | Supabase Studio covers triage in v1 (list, filter, search, edit-in-place, CSV export). Custom UI earns its build cost only at >30 leads/week or >2 reps. |
| 2 | Provider Dashboard (university partner view) | No university partners signed → speculative build. v2 ships with real partner workflows in hand. |
| 3 | Course Management Scraper | AU university site scraping is legal grey area (T&Cs). 43 CRICOS-seeded institutions covers ~95% of international student volume legally. v2 revisits with proper legal sign-off. |
| 4 | Analytics Dashboard | Vercel Analytics + Supabase log queries cover v1 metrics for free. Custom dashboard UI is expensive for data already visible in two existing tools. |
| 5 | Better Auth (multi-session, passkeys) | Supabase Auth magic link has identical v1 UX at zero integration cost. Better Auth pays off at 10k+ users with complex session requirements. |
| 6 | `internal_user_id` abstraction layer | Pays off only on auth-vendor migration. Stack is Supabase end-to-end → no migration scoped → no value yet. |

---

## Architectural value layer (the compounding asset)

The UI modules are the conversion surface. The data layer is the architectural asset:

- **Supabase Postgres project** — `universities`, `courses`, `leads` (with explicit service + marketing consent + Privacy Act audit trail), `embeddings` (pgvector for RAG), row-level security policies. 43 AU institutions pre-seeded from CRICOS open government data.
- **n8n lead-sync workflow** — `ops/n8n/lead-sync-workflow.json`. Ships dormant. Activatable on a self-hosted VPS to mirror leads to a Google Sheet in real time, with dead-letter email fallback.
- **Supabase Studio as Day-1 admin** — native Postgres admin UI. List, filter, search, edit-in-place, CSV export. `leads.status` enum (`new`/`contacted`/`converted`) + auto-stamped `status_updated_at` via trigger. Migration `002_leads_status.sql` ships in v1.
- **Two compliance attestations** — code review + AU-compliance review.

---

## Stack (what was actually built)

- **Web:** Next.js 16 (App Router) · React 19 · Tailwind v4 · AI SDK v6
- **Mobile:** Expo SDK 54 · React Native · Expo Router (companion app, mock data only — not wired to live RPC in v1)
- **Backend:** Supabase (Postgres + Auth magic link + pgvector) · region `ap-southeast-1` (Singapore — APP 8 cross-border disclosure wired into lead-capture UI)
- **LLM:** OpenAI `gpt-4o-mini` (chat) + `text-embedding-3-small` (RAG)
- **Email:** Resend (transactional + lead notifications)
- **PDF:** react-pdf (client-side SOP export)
- **Hosting:** Vercel (web) · Expo OTA (mobile)

---

## Compliance constraints (carry forward)

- **Privacy Act 1988 (Cth)** — APP 5 collection notice on lead form, APP 8 cross-border disclosure for Singapore Supabase region.
- **Migration advice** — Pathway-AI is an educational matching service, not migration advice. All visa/PR/migration questions deflect to a licensed migration agent. Footer + chat disclaimers + per-turn deflection in `web/src/lib/chat-system-prompt.ts`.
- **Service vs marketing consent** — explicit split on lead form. Service consent required to respond; marketing consent optional.

---

## UAT pass criteria (proven binary tests, reusable for v1+ regression)

| # | Criterion | How it's tested |
|---|---|---|
| G1 | Lead captured end-to-end | Submit seeded lead → row in Supabase `leads` + email arrives within 60s |
| G2 | Compliance-safe chat | 10 visa/PR/subclass-500 test queries → zero migration-advice strings in responses |
| G3 | UniMatch returns ≥3 results | Sample profile (undergrad IT, $40k/yr budget, NSW preference) returns 3+ CRICOS-registered matches with reason strings |
| G4 | SOP generator outputs valid PDF | Draft → edit → regenerate → download. PDF opens in Chrome + Safari + Acrobat. |
| G5 | Mobile app launches with branding | Expo build installs on test Android/iOS, launches, shows correct name + logo |
| G6 | Production URL live | `pathway-ai.vercel.app` returns 200 on `/`, `/api/match`, `/api/chat` |
| G7 | Compliance attestation signed | Code review + AU-compliance review delivered |

---

## v1 known carry-forwards (open at handover)

- Mobile app uses `mockData.ts`, not live `match_unis_for_lead` RPC — wire-up planned post-handover.
- `mobile/tunnel-demo.sh` references stale path — needs update to current repo location.
- 48 course rows have NULL CRICOS codes — backfill from public CRICOS register.
- Chat system prompt has placeholder QEAC counsellor name — replace with actual on-staff counsellor when hired.
- Lockfile sync between `web/package.json` and `web/package-lock.json` was a known v1 build snag — regenerated 2026-05-02.

---

## What changed in the rebrand (2026-05-02)

- Project renamed `Atlas AI` (working title) → **Pathway-AI** (final brand).
- All client-identity, MARA-registered framing, and migration-consultancy positioning stripped. Pathway-AI is now positioned as an **educational information and matching service** — not a registered migration consultancy. Visa/migration questions explicitly deflect to a licensed migration agent.
- Fixed-price client engagement model retired. Pathway-AI is now operated as Koda Labs' own SaaS product.

---

## Where v2 should start

The deferred-modules table above is sequenced by unlock condition, not priority. v2 should pick modules off that table only when the unlock condition is met (real lead volume, signed partners, real legal sign-off, etc.) — not based on guessed importance.

The architectural compounding asset (Postgres schema + n8n + Supabase Studio) is the foundation. v2 builds branded UIs and automation **on top of the same data** — it does not replace what exists.
