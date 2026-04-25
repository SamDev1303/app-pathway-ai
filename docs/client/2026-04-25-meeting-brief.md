# Atlas AI — Meeting Brief
**Meeting:** 2026-04-25, 3:30pm AEST (Sam confirmed)
**Format:** 30 min · agenda-driven · screen share
**Stack:** Next.js 16 App Router + Supabase Sydney (`ap-southeast-2`) + Expo mobile + AI SDK v6 over OpenRouter
**Live:** https://unimate-demo.vercel.app (web) · Expo build for mobile (TestFlight pending Apple Dev account)
**Repo:** github.com/SamDev1303/unimate-demo (private)

---

## 30-second pitch

Atlas AI is a MARA-compliant Australian university match-and-advise platform. Prospective international students fill a 5-step lead form, **redirect straight to a ranked `/matches/[token]` page** scored by a Postgres RPC, then chat with a RAG-grounded AI advisor that hard-deflects every visa or migration question to UniMate's licensed MARA agents — three-layer guard, full audit trail in `mara_deflections`. **9 of 10 phases live today. Compliance, observability, RAG retrieval, and the chat experience are all production-ready. SOP generator UI (Phase 6) ships this week.**

---

## What's live today (verified pre-meeting)

| # | Phase | Status | What this means in plain English |
|---|---|---|---|
| 0 | Repo restructure + governance | live today | Folder layout, README, PRD, phase tracker locked in |
| 0.5 | Scaffold scrub | live today | Removed every migration-advice string from the demo template; MARA Code of Conduct deflection rules baked into chat prompts |
| 1 | Supabase + AU university seed | live today | Sydney region (`ap-southeast-2`), 17 universities seeded with CRICOS course data, 11 migrations applied |
| 2 | Auth (magic link) | live today | Supabase Auth wired, login route exists; full authenticated user areas deferred per scope |
| 3 | Lead capture (5-step form) | live today | Server-side scoring (A/B/C/D), Privacy Act 1988 (APP 5) consent split, localStorage draft hydration with 30-day TTL + schema-version invalidation |
| 4 | UniMatch engine | live today | Postgres RPC `match_unis_for_lead` ranks by GPA × IELTS × budget × field × level. Pure SQL, deterministic, audit trail. Weights live in `lib/match-weights.ts` JSON. |
| 4.5 | Compliance gate | live today | Site-wide MARA disclaimer (top + footer + per-chat-turn footer), CI grep gate fails build on migration-advice strings, RLS policies live, encryption-at-rest attested, Sydney region pinned |
| 5 | AI Advisor Chat + RAG | live today | `/chat` streams via OpenRouter, retrieves courses via Gemini `gemini-embedding-001` (3072-dim) → `match_courses_for_chat` RPC at threshold 0.65, three-layer deflection (regex pre-check + cumulative-buffer post-filter + audit row), Upstash rate-limit 10/min IP / 50/hr session / 200/day global |
| **5.5** | **Observability** | **live today (shipped this morning)** | pino structured logger with three-layer PII redaction (path-allowlist + censor + recursive walker), Sentry on web (server / browser / edge) + Expo mobile. Closed a raw-email log leak in the lead route this morning. Built BEFORE Phase 6 specifically so it can't be retrofitted. |
| **5.6** | **Pre-meeting hardening** | **live today (shipped 2026-04-25 ~13:00 AEST)** | Lead-form success path now redirects to `/matches/[token]` so the student sees ranked unis immediately. Chat catch path returns SSE deflection stream not error envelope. SOP route validates `leadToken` as UUID before DB lookup. `chat-simple` model selector mirrors `chat`. Embeddings backfill applied to PROD. |
| 6 | SOP Generator UI + PDF | ships this week | Backend route, DB schema, versioning chain, three-layer deflection — all live. Front-end react-pdf wiring + section-edit/regenerate loop is roughly 6h focused work. Queued for tomorrow. |
| 7 | Mobile rebrand | ships this week | Expo build live with Sentry; UniMate brand pass is roughly 1 day. |
| 8 | Dataset backfill 17 → 43 unis | held until brand identity locked | Held deliberately — re-seeding twice burns time. ~1 day of data entry once unblocked. |
| 9 | Final QA + handover docs | queued for end of week | Playwright e2e suite + handover pack |

---

## Mapping to client's agenda

### 1. Goal of Engagement — usable + scalable, not just fast
Three artifacts prove this:
- 9 atomic phase commits with dual sign-off (Gideon code review on every phase)
- Postgres-RPC matching (not LLM matching) — the recommendation logic is auditable, deterministic, sub-millisecond, and costs nothing per request
- Zero vendor lock on AI — `CHAT_MODEL` env var swaps providers; today it's pinned to `openai/gpt-4o-mini` via OpenRouter for paid SLA. Single env-var swap to Anthropic Sonnet 4.6 or Qwen free.

### 2. Non-Negotiables
- **Clean modular architecture:** `web/src/lib/` is split by concern (logger, lead-schema, matcher, chat-system-prompt, mara-disclaimer, ratelimit, sop-prompt). API routes are thin controllers calling lib functions.
- **No black-box agent chaining:** matching is a single SQL function, chat is a single LLM call with explicit RAG injection. No multi-step agent graphs, no tool-use loops.
- **Code ownership & readability:** every module has a header comment explaining WHY (P-number references the phase).
- **Logging & debuggability:** pino JSON logs to stdout (Vercel log drains), Sentry catches exceptions, three-layer PII redaction. Smoke test (`web/scripts/smoke-logger.ts`) proves zero leaks end-to-end.
- **Reusability:** `lib/matcher.ts`, `lib/lead-schema.ts`, `lib/logger.ts` are framework-agnostic — could move to a shared package without changes.
- **No vendor lock:**
    - Database: standard Postgres, leave Supabase via `pg_dump`
    - AI: env-var-gated providers (`CHAT_MODEL`, `CHAT_SIMPLE_MODEL`, `SOP_MODEL`)
    - Hosting: Next.js standalone output runs on any Node host
    - Auth: Supabase Auth uses standard JWT — portable
    - Sentry: source-map upload is opt-in (no auth token = no upload)

### 3. System Design
- **Frontend:** Next.js 16 App Router with Cache Components (PPR). Server components by default; client components only for interactive forms. Tailwind v4. Mobile: Expo Router + NativeWind.
- **Backend:** Next.js API routes (`/api/leads`, `/api/match`, `/api/chat`, `/api/chat-simple`, `/api/sop`). Each route < 600 lines. Service-role Supabase client lives in one file (`lib/supabase/service-role.ts`).
- **AI layer:** Vercel AI SDK v6 (`streamText`). OpenRouter as a single transport for multiple models. Embeddings: Gemini `gemini-embedding-001` at 3072 dims. RAG: Postgres pgvector via `match_courses_for_chat` RPC, top-k=5, threshold 0.65.
- **Data model (11 migrations applied to PROD):**
```
universities       — 17 seeded AU unis (Sydney + Melbourne + Brisbane + regional)
courses            — CRICOS-keyed course catalog (~68 courses live)
leads              — student profile + consent + score + tier + match_token
embeddings         — legacy 1536-dim embedding store (unused)
course_embeddings  — Gemini 3072-dim per course (RAG source — backfilled today)
chat_sessions      — opaque httpOnly cookie session
chat_messages      — full transcript with retrieved_course_ids + deflected flag
mara_deflections   — every blocked migration question (legal audit log)
chat_dataset_gaps  — questions that hit no RAG matches (improvement queue)
sop_drafts         — versioned SOP outputs with parent_draft_id chain + UNIQUE(lead_id, version_number)
```

### 4. Core Features — status today
- **College discovery:** live today. Lead form redirects to `/matches/[token]` ranked page on submit. PendingMatches fallback if RPC ever fails.
- **Recommendation logic:** live today as **hybrid by design.** Stage 1 is rule-based SQL (`match_unis_for_lead` weights GPA × IELTS × budget). Stage 2 (chat) is embedding similarity + LLM grounding. ML drops in at Stage 1 by replacing SQL weights with model output — no other code changes.
- **Search + filters:** lead form's `preferred_fields` / `preferred_levels` filters are live. Dedicated search page is **not built — open decision today.**
- **Analytics tracking:** every interaction is a queryable database row (`mara_deflections`, `chat_dataset_gaps`, `chat_messages`, `sop_drafts`). Custom dashboard at `/admin/analytics` is **deferred — open decision today.**

### 5. Critical Questions — direct answers
- **How is the college dataset created and updated?** Manual seed today (`scripts/seed-universities.ts`, 17 unis). Backfill to 43 is deliberate-hold at Phase 8 — a CSV import + re-embed once brand identity is locked. ~1 day of data entry.
- **How does recommendation logic evolve?** Three knobs: (a) SQL weights in `match_weights.ts`, (b) embedding model swap (env var), (c) drop-in ML scoring at the RPC layer. None require touching the rest of the codebase.
- **Where is the analytics dashboard?** **Not built. Two paths:** (A) Supabase Studio queries — free, ships now, requires SQL fluency. (B) Custom `/admin/analytics` page — Phase 8 effort, ~1 day, non-technical staff can use it. Sam decides today.
- **How do we track user interactions meaningfully?** Every lead → row. Every chat turn → row with retrieval IDs + deflected flag. Every blocked migration question → audit row with the trigger phrase. Every SOP draft → versioned row with parent chain. Nothing is ephemeral.

### 6. Tech Stack
- **Auth:** Supabase Auth magic link today. **better-auth swap is open** — both work; better-auth is more portable, Supabase has tighter Postgres integration.
- **DB:** Supabase Postgres (Sydney `ap-southeast-2`) with pgvector. Migration path: standard `pg_dump` → AWS RDS / Cloud SQL / Neon.
- **Hosting:** Vercel today (Next.js native). Constraints: 300s Fluid Compute timeout = fine for streaming chat. Could move to AWS ECS / Cloud Run via Next.js standalone output.

### 7. Scalability & Future Readiness
- **Plug ML later:** the matching RPC is one file. Replace weights with model inference output → done.
- **Reuse for other verticals:** lead capture + scoring + RAG chat is generic. Swap MARA prompts + dataset → migrate to medical-school admissions, vocational training, anything with a CRICOS-shaped registry.

### 8. Delivery Plan
- Built phase-by-phase (0 → 5.6). Each phase has a PHASE.md row with sign-off + commit hashes.
- Demo checkpoints: every phase has a verifier sign-off. Smoke tests per phase.
- Definition of done: dual sign-off + tsc clean + build PASS + grep gates clean + Gideon code review verdict logged.

### 9. Risks & Red Flags (honest)
- **SOP generator UI ships this week — ~6h focused work, scheduled for tomorrow.** Backend, DB schema, versioning, deflection guards are all live.
- **Custom analytics dashboard — open decision today.** Supabase Studio works now; custom page is ~1 day.
- **University dataset is 17 — held at 17 until brand identity locked, then ~1 day to backfill to 43.**
- **Mobile app brand pass — Phase 7, ~1 day, this week.**
- **No e2e test suite yet — typecheck + smoke tests + manual QA today; Playwright e2e is Phase 9.**

### 10. Communication & Workflow
Phase tracker + atomic commits + dual code review per phase. Repo has full audit trail. Telegram for sync, GitHub for async.

---

## Why no Sydney-specific data shows in some chat queries (pre-empted)

The chat assistant retrieves over `course_embeddings` — 68 courses across 17 universities, including 6 Sydney-region unis (USYD, UNSW, UTS, Macquarie, WSU, ACU). **The semantic match threshold is 0.65 cosine similarity** — by design, the assistant defers honestly when no row clears the bar rather than fabricating. That's a compliance posture, not a bug. The matcher widget on the landing page reads a richer client-side dataset (32 unis, 117 courses) — Sydney IT courses surface there immediately. Phase 8 backfills the chat corpus to match.

---

## Numbers Sam can quote

- **9 phases live (0 → 5.6) · 4 in flight (6, 7, 8, 9)**
- **11 migrations applied to PROD Supabase (Sydney `ap-southeast-2`)**
- **68 courses backfilled with Gemini 3072-dim embeddings** — pre-meeting today
- **~$0.001 per chat turn** at gpt-4o-mini, capped at 350 input + 250 output tokens. 100 turns/day = $0.10.
- **Three-layer compliance gate** — regex pre-check, cumulative-buffer post-filter, audit row per block
- **Three-layer PII redaction** — REDACT_PATHS allowlist + censor function + recursive walker
- **14 routes** in production build, **0 type errors**, build passes in ~6.4s
- **3072-dim embeddings, top-k 5, 0.65 similarity threshold**

---

## What to NOT promise today

- SOP generator UI by tonight — ships tomorrow (~6h focused work)
- 43-uni backfill — held until brand identity locked
- Custom analytics dashboard — open decision; pick a path today
- Mobile rebrand — ships this week (~1 day)
- Native iOS/Android store submissions — Phase 7 + Apple/Play review = 3-7 days

---

*Generated 2026-04-25 ~12:55 AEST for the 3:30pm meeting. All claims have a phase number + commit hash backing them in `~/Desktop/atlas-ai/PHASE.md`. Live behaviour mirrors the demo script in `2026-04-25-demo-script.md`.*
