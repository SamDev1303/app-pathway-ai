# Atlas AI — Build Status Update
**For:** UniMate (client + partner)
**From:** Sam · ClaudeKing
**Date:** 25 April 2026

---

Hi both,

Sending this ahead of our 3:30 catch-up so you can read at your own pace and come in with questions ready.

## Where we are

The build is structured as 10 sequenced phases. **9 are shipped. 1 core feature remains, plus mobile rebrand and final QA.** Brief plain-English version below.

### What's live and working

1. **Foundation, governance, schema**
   Project structure, the AU university dataset, the database (Sydney region — no cross-border data leaving Australia), and the access-control rules that lock down who can read/write what.

2. **Lead capture (5-step form)**
   Prospective student fills in the form, system server-side scores them into A/B/C/D tiers based on their academic profile, fit-for-Australian-study, and budget. Privacy Act 1988 (APP 5) collection notice and consent split (service vs marketing) are live. Email notifications fire to UniMate on each new lead.

3. **University matching engine**
   Once a student submits, the system ranks Australian universities for them. The ranking logic is a database function (not an AI guess) — it weighs GPA, English score, preferred fields, budget fit, and intake. Reproducible, explainable, and easy to tune.

4. **MARA compliance gate**
   Before the AI advisor was switched on, we hard-shipped: site-wide MARA disclaimer footer, the per-page registration-number reference, the privacy/consent split, encryption-at-rest verification, and a CI safety check that fails the build if any "migration advice" wording leaks back into the codebase.

5. **AI advisor chat (with course retrieval)**
   The student can chat with an advisor on the site. It pulls relevant matched courses from the database and grounds the answer on those — not freelancing university names. Every visa/migration/PR question is hard-deflected to UniMate's licensed MARA agents, with a belt-and-braces design (pre-check on the input + post-filter on the output stream + audit trail of every block). Rate-limited so a bad actor can't hammer it.

6. **Observability + error tracking** *(shipped today, Saturday 25th)*
   Structured JSON logs with PII automatically scrubbed before they hit any log destination. Sentry wired for crash tracking on web (server, browser, edge) and on the mobile app. We specifically built this before the next feature so it can't be retrofitted later. This was your "proper logging & debuggability" non-negotiable from the agenda — that's why it shipped today.

### Mobile

The Expo app is built with the same Sentry layer wired in. Branding still reads as the demo template — rebrand pass is queued.

### What's still on the bench

| Phase | What | Roughly how much work |
|---|---|---|
| 6 | SOP generator + PDF export — the AI-assisted Statement of Purpose feature | ~1 day |
| 7 | Mobile rebrand from demo branding to UniMate | ~1 day |
| 8 | Final compliance audit + university dataset backfill (target: 43 unis, currently 17 seeded) | ~1-2 days |
| 9 | QA pass + handover documentation + production deploy | ~1-2 days |

---

## Mapping to your agenda

Quick map so you can see we read each line and built around it:

- **§2 Non-negotiables** — clean modular architecture: yes, separated by concern; no black-box agent chaining: confirmed (matching is pure SQL, the AI is only in the chat layer); proper logging: shipped today; reusability: the lead/match/log layers are framework-agnostic; no vendor lock: AI provider is one env var, database is standard Postgres, hosting is standard Next.js.
- **§3 System design** — frontend, backend, AI layer are split. The AI layer can be swapped to any provider without touching the rest. Data model is 10 versioned migrations.
- **§4 Core features** — discovery flow live, recommendation logic is rule-based today (with a documented hook for ML later), filters live via the lead form, **analytics tracking is captured at the data layer — see open question below.**
- **§5 Critical questions** — happy to walk through these live. The dataset update path is well-defined; recommendation logic evolves by tuning weights or swapping the scorer module; user interactions are all persisted (every chat turn, every deflection, every dataset gap is a database row, never ephemeral).
- **§6 Tech stack** — Auth: Supabase magic link is in place; better-auth swap is on the table. DB: Supabase Postgres (Sydney). Hosting: Vercel native; standard Next.js standalone output portable elsewhere if needed.
- **§7 Scalability** — ML drop-in path is one module; the lead/match/chat scaffold is reusable for adjacent verticals.
- **§8 Delivery** — we work phase-by-phase with sign-off per phase. Demo checkpoints exist after each phase.
- **§9 Risks** — flagging openly: SOP generator not yet built (queued, sized), university dataset is 17 of target 43, no end-to-end automated test suite yet (Phase 9). All known and tracked.

---

## What we need from your side

A few small unlocks that move things forward:

1. **Decision: analytics surface** — every interaction is already captured. Question is what you want to *see* it through.
   - **Option A:** Use Supabase Studio (the database admin UI) for queries and CSV exports. Free, available today. Requires someone comfortable with simple SQL.
   - **Option B:** I build a dedicated dashboard inside Atlas AI (`/admin/analytics`) with charts and filters that any non-technical UniMate staff can use. ~1 day of work, slots into Phase 8.
   - **What I need:** a yes/no on this, ideally in our call.

2. **MARA registration number + ABN** — placeholders are live in the footer and will fail a CI check after 27 April unless you provide the real values. Just paste them in the call.

3. **Production AI provider preference** — currently running on a free model that's MARA-safe but not the highest quality available. Confirming the production model (and the budget cap) is your call. I can move from free → paid in one config change.

4. **Auth choice** — Supabase Auth magic link works today. If you'd like better-auth instead (slightly more portable, slightly more setup), say so and I'll swap.

5. **University dataset backfill source** — we need the 26 additional universities (with CRICOS course codes). If you have a CSV or list, send it; otherwise I'll source from the public registry as a Phase 8 task.

6. **Domain decision** — staying on `atlas-ai.vercel.app` or moving to a UniMate-controlled domain for the production launch?

7. **Launch target date** — once decided, I'll lock the remaining phase sequence to land before then.

---

## Honest framing for the call

The biggest thing not yet built is the **SOP generator**. The plumbing is in place (the API route, the database with versioning, the deflection guards). What's missing is the PDF render layer and the section-edit-and-regenerate UX. About a day of focused work. I'd rather flag it now than have you find it on a click-through.

Everything else either ships, or is a small final polish (mobile rebrand, dataset backfill, QA).

See you at 3:30. Bring questions.

Sam
