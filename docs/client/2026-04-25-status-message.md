# Atlas AI — Build Status Update
**For:** UniMate (client + partner)
**From:** Sam · ClaudeKing
**Date:** 25 April 2026 (sent before our 3:30pm AEST catch-up)

---

Hi both,

Sending this ahead of our 3:30 catch-up so you can read at your own pace and come in with questions ready.

## Where we are

The build is structured as 10 sequenced phases. **9 are live in production. 1 core feature ships this week, plus mobile rebrand and final QA.** Plain-English version below.

### What's live and working today

1. **Foundation, governance, schema** — project structure, AU university dataset, the database (Sydney `ap-southeast-2` — no cross-border data leaving Australia), 11 migrations applied, RLS policies live.

2. **Lead capture (5-step form)** — prospective student fills the form, server-side scoring tiers them A/B/C/D based on academic profile, fit-for-Australian-study, and budget. Privacy Act 1988 (APP 5) collection notice + consent split (service mandatory, marketing optional) live. Email notifications fire to UniMate on each new lead. **Form now redirects straight to the ranked university page on submit (shipped this morning) so the student sees their matches immediately.**

3. **University matching engine** — once a student submits, the system ranks Australian universities for them. Ranking is a Postgres function (`match_unis_for_lead` RPC) — it weighs GPA × IELTS × preferred fields × budget fit × level via the `MATCH_WEIGHTS_JSON` defaults exposed in `lib/match-weights.ts`. Pure SQL, deterministic, audit-trailed. Tunable without code changes.

4. **MARA compliance gate** — site-wide MARA disclaimer (top banner + footer + per-chat-turn footer), MARA registration line, Privacy Act consent split, encryption-at-rest verification, CI grep gate that fails the build if any "migration advice" wording leaks back into the codebase.

5. **AI advisor chat (with course retrieval)** — student chats with an advisor at `/chat`. RAG retrieval over the CRICOS course corpus (Gemini 3072-dim embeddings, top-k 5 at 0.65 similarity threshold) — answers are grounded on retrieved courses, not freelance university names. Every visa/migration/PR question is hard-deflected to UniMate's licensed MARA agents via a three-layer guard (regex pre-check on input + cumulative-buffer post-filter on stream + `mara_deflections` audit row). Rate-limited so a bad actor can't hammer it.

6. **Observability + error tracking** *(shipped this morning, Saturday 25th)* — structured JSON logs with PII automatically scrubbed before they hit any log destination (3-layer redaction: REDACT_PATHS allowlist + censor function + recursive walker). Sentry wired for crash tracking on web (server, browser, edge) and on the mobile app. Built before the next feature so it can't be retrofitted later. This was your "proper logging & debuggability" non-negotiable from the agenda — that's why it shipped today.

7. **Pre-meeting hardening** *(shipped 2026-04-25 ~13:00 AEST)* — lead-form success path redirects to `/matches/[token]`, chat catch path returns SSE deflection stream (graceful fallback rather than error envelope), SOP route validates `leadToken` as UUID before DB lookup, mobile `chat-simple` model selector mirrors `/api/chat`, **embeddings backfill applied to PROD (68 courses across 17 unis embedded with Gemini 3072-dim).**

### Mobile

The Expo app is built with the same Sentry layer wired in. Branding still reads as the demo template — rebrand pass is queued for this week.

### What's still on the bench

| Phase | What | Roughly how much work |
|---|---|---|
| 6 | SOP generator **UI** + PDF export — backend, DB schema, versioning chain, deflection guards all live; what's missing is the react-pdf wiring + section-edit/regenerate loop | ~6h focused work · scheduled tomorrow |
| 7 | Mobile rebrand from demo branding to UniMate | ~1 day · this week |
| 8 | Dataset backfill from 17 to 43 universities + final compliance audit | ~1-2 days · held until brand identity locked |
| 9 | Playwright e2e suite + handover documentation + production deploy | ~1-2 days · end of week |

---

## Mapping to your agenda

Quick map so you can see we read each line and built around it:

- **§2 Non-negotiables** — clean modular architecture: yes, separated by concern (`lib/logger`, `lib/lead-schema`, `lib/matcher`, `lib/chat-system-prompt`, `lib/mara-disclaimer`, `lib/ratelimit`, `lib/sop-prompt`); no black-box agent chaining: confirmed (matching is pure SQL, the AI is only in the chat layer); proper logging: shipped this morning; reusability: lead/match/log layers are framework-agnostic; no vendor lock: AI provider is one env var, database is standard Postgres, hosting is standard Next.js standalone.
- **§3 System design** — frontend, backend, AI layer are split. AI layer can be swapped to any provider without touching the rest. Data model is 11 versioned migrations, all applied.
- **§4 Core features** — discovery flow live (form → ranked /matches page), recommendation logic is rule-based today (with a documented hook for ML at the RPC layer), filters live via the lead form, **analytics tracking captured at the data layer — see open question below.**
- **§5 Critical questions** — happy to walk through these live. Dataset update path is well-defined; recommendation logic evolves by tuning weights or swapping the scorer module; user interactions are all persisted (every chat turn, every deflection, every dataset gap, every SOP draft is a database row).
- **§6 Tech stack** — Auth: Supabase magic link in place; better-auth swap on the table. DB: Supabase Postgres (Sydney). Hosting: Vercel native; Next.js standalone output portable elsewhere.
- **§7 Scalability** — ML drop-in path is one module; the lead/match/chat scaffold is reusable for adjacent verticals.
- **§8 Delivery** — phase-by-phase with sign-off per phase. Demo checkpoints exist after each phase.
- **§9 Risks** — flagging openly: SOP UI ships this week (sized + scheduled), university dataset is 17 of target 43 (held), no e2e suite yet (Phase 9). All known and tracked in `PHASE.md`.

---

## What we need from your side

A few small unlocks that move things forward:

1. **Decision: analytics surface** — every interaction is already captured. Question is what you want to *see* it through.
   - **Option A:** Use Supabase Studio (database admin UI) for queries and CSV exports. Free, available today. Requires someone comfortable with simple SQL.
   - **Option B:** Custom `/admin/analytics` page in Atlas AI with charts and filters that any non-technical UniMate staff can use. ~1 day of work, slots into Phase 8.
   - **What I need:** a yes/no on this, ideally in our call.

2. **MARA registration number + ABN** — placeholders are live in the footer. Just paste the real values in the call and I'll commit them after.

3. **Production AI provider preference** — currently pinned to `openai/gpt-4o-mini` via OpenRouter (paid SLA, ~$0.001 per chat turn). Confirm this stays for production, or move to Sonnet 4.6 for higher quality. Either way, single env-var change.

4. **Auth choice** — Supabase Auth magic link works today. If you'd like better-auth instead (slightly more portable, slightly more setup), say so and I'll swap.

5. **University dataset backfill source** — we need the 26 additional universities (with CRICOS course codes). If you have a CSV or list, send it; otherwise I'll source from the public CRICOS registry as a Phase 8 task.

6. **Domain decision** — staying on `unimate-demo.vercel.app` or moving to a UniMate-controlled domain for production launch?

7. **Launch target date** — once decided, I'll lock the remaining phase sequence to land before then.

---

## Honest framing for the call

The biggest thing not yet shipped is the **SOP generator UI**. The plumbing is in place — the API route, the DB with versioning, the deflection guards, the rate-limit. What's missing is the PDF render layer and the section-edit-and-regenerate UX. About 6 hours of focused work, scheduled for tomorrow.

Everything else either ships today, or is a small final polish (mobile rebrand, dataset backfill, QA + handover).

See you at 3:30. Bring questions.

Sam
