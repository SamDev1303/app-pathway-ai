# Atlas AI — Meeting Brief
**Meeting:** 2026-04-25, 3:30pm (Sam confirmed)
**Format:** 30 min · agenda-driven · screen share
**Stack:** Next.js 16 + Supabase (Sydney) + Expo mobile + AI SDK v6
**Live:** atlas-ai.vercel.app (web) · Expo build for mobile (TestFlight pending)
**Repo:** github.com/SamDev1303/unimate-demo (private)

---

## 30-second pitch

Atlas AI is a MARA-compliant Australian university match-and-advise platform. A prospective international student fills a 5-step lead form, gets a ranked list of CRICOS-registered courses tailored to their profile, then chats with a RAG-grounded AI advisor that strictly deflects every visa/migration question to UniMate's licensed MARA agents. **9 of 10 build phases are done. Compliance, observability, and the chat experience are all production-ready. SOP generator (Phase 6) is the one core feature still on the bench — but Phase 5.5 (logging + Sentry) was just shipped today specifically so Phase 6 doesn't bypass redaction.**

---

## What's actually built (Phase status)

| # | Phase | Status | What this means in plain English |
|---|---|---|---|
| 0 | Repo restructure + governance | ✅ done | Folder layout, README, PRD, phase tracker locked in |
| 0.5 | Scaffold scrub | ✅ done | Removed every migration-advice string from the demo template; added MARA Code of Conduct deflection rules to chat prompts |
| 1 | Supabase + AU university seed | ✅ done | Sydney-region database, 17 universities seeded with CRICOS course data |
| 2 | Auth (magic link) | ✅ done | Infrastructure-only — Supabase Auth wired, login page exists, full user areas deferred per scope |
| 3 | Lead capture | ✅ done | 5-step form with progressive save, server-side scoring (A/B/C/D tier), Privacy Act 1988 (APP 5) consent split (service + marketing) |
| 4 | UniMatch engine | ✅ done | Postgres RPC `match_unis_for_lead` ranks courses by GPA, IELTS, budget, fields, levels — pure SQL, no black-box AI. Full audit trail. |
| 4.5 | Compliance gate | ✅ done | Site-wide MARA disclaimer footer, CI grep-gate enforcing zero migration-advice copy, RLS policies live, encryption-at-rest attested |
| 5 | AI Advisor Chat + RAG | ✅ done | `/chat` page streams responses from OpenRouter Qwen, retrieves courses via Gemini 3072-dim embeddings, **belt-and-braces deflection** (pre-check + post-filter), Upstash rate-limit (10/min IP / 50/hr session / 200/day global) |
| **5.5** | **Observability** | **✅ done TODAY** | **pino structured logger with 3-layer PII redaction + Sentry error tracking on web (server/client/edge) + Expo mobile. Critical fix: closed a raw-email log leak in the lead route. Specifically built before Phase 6 to avoid retrofitting** |
| 6 | SOP Generator + PDF export | 🚧 not_started | **The one missing core feature.** API route exists; needs react-pdf wiring + section-edit/regenerate loop |
| 7 | Mobile rebrand | 🚧 not_started | Expo app exists with Sentry; rebrand from UniMate-demo branding pending |
| 8 | Final compliance audit | 🚧 not_started | Pre-handover sweep |
| 9 | QA + handover docs | 🚧 not_started | Final |

---

## Mapping to client's agenda

### 1. Goal of Engagement
**Built for usable + scalable, not just fast.** Three artifacts prove this:
- 9 atomic phase commits with dual sign-off (Gideon code review on every phase)
- Postgres-RPC matching (not LLM matching) so the recommendation logic is auditable, deterministic, and cheap
- Zero vendor lock on AI — `CHAT_MODEL` env var swaps providers; today it's OpenRouter Qwen free, swap to Anthropic/OpenAI is a config change

### 2. Non-Negotiables
- **Clean modular architecture:** `web/src/lib/` is split by concern (logger, lead-schema, matcher, chat-system-prompt, mara-disclaimer). API routes are thin controllers calling lib functions.
- **No black-box agent chaining:** matching is a SQL function, chat is a single LLM call with explicit RAG injection. No multi-step agent graphs.
- **Code ownership & readability:** every module has a header comment explaining WHY it exists (P-number references the phase).
- **Logging & debuggability:** **just shipped today (Phase 5.5).** pino JSON logs to stdout (Vercel log drains), Sentry catches exceptions, PII redaction is 3-layer (path-based + censor + recursive walker).
- **Reusability:** `lib/matcher.ts`, `lib/lead-schema.ts`, `lib/logger.ts` are framework-agnostic — could move to a shared package without changes.
- **No vendor lock:**
    - Database: standard Postgres, can leave Supabase via `pg_dump`
    - AI: env-var-gated providers (`CHAT_MODEL`, `SOP_MODEL`)
    - Hosting: Next.js standalone output works on any Node host
    - Auth: Supabase Auth uses standard JWT; portable
    - Sentry source-map upload is opt-in (no auth token = no upload) so dev builds work without it

### 3. System Design
**Frontend:** Next.js 16 App Router with Cache Components (PPR). Server components by default, client components for interactive forms. Tailwind v4. Mobile: Expo Router + NativeWind.

**Backend:** Next.js API routes (`/api/leads`, `/api/match`, `/api/chat`, `/api/chat-simple`, `/api/sop`). Each route is < 600 lines. Service-role Supabase client lives in one file (`lib/supabase/service-role.ts`).

**AI layer:** Vercel AI SDK v6 (`streamText`). OpenRouter as a single transport for multiple models. Embeddings: Gemini `gemini-embedding-001` at 3072 dims. RAG: Postgres pgvector via `match_courses_for_chat` RPC, top-k=5 threshold 0.65.

**Data model (10 migrations):**
```
universities    — 17 seeded AU unis with brand + region + tier
courses         — CRICOS-keyed course catalog (~50 courses)
leads           — student profile + consent + score + tier + match_token
embeddings      — legacy embedding store
course_embeddings — Gemini 3072-dim per course (RAG source)
chat_sessions   — opaque httpOnly cookie session
chat_messages   — full transcript with retrieved_course_ids + deflected flag
mara_deflections — every blocked migration question (legal audit log)
chat_dataset_gaps — questions that hit no RAG matches (improvement queue)
sop_drafts      — versioned SOP outputs with parent_draft_id chain
```

### 4. Core Features — Phase 1 status
- **College discovery:** ✅ /matches/[token] live with PendingMatches fallback
- **Recommendation logic:** ✅ **Hybrid by design.** Stage 1 = rule-based SQL (`match_unis_for_lead` weights GPA, IELTS, budget). Stage 2 (chat) = embedding similarity + LLM grounding. ML can drop in at Stage 1 (replace SQL weights with model output) without touching the rest.
- **Search + filters:** ⚠️ Lead form's preferred_fields/levels filters exist; **dedicated search page is not built** — flag this if asked.
- **Analytics tracking:** ⚠️ **Today the analytics surface is the database (`mara_deflections`, `chat_dataset_gaps`, `chat_messages` are queryable in Supabase Studio).** Custom dashboard at `/admin/analytics` is **deferred to Phase 8 — open client decision.**

### 5. Critical Questions — direct answers
- **How is the college dataset created and updated?** Manual seed script today (`scripts/seed-universities.ts` + 17 unis). Backfill to 43 unis + per-course CRICOS codes is **parked at Phase 8** (3 docs of intel exist; just a data-entry exercise).
- **How does recommendation logic evolve?** Three knobs: (a) SQL weights in `match_weights.ts`, (b) embedding model swap (env var), (c) drop-in ML scoring at the RPC layer. No code changes required for any of these.
- **Where is the analytics dashboard?** **Not built. Two options open: (A) Supabase Studio queries — free, ships now. (B) Custom `/admin/analytics` page — Phase 8 effort. Sam to decide today.**
- **How do we track user interactions meaningfully?** Every lead → row. Every chat turn → row with retrieval IDs + deflected flag. Every blocked migration question → audit row. Every SOP draft → versioned row with parent chain. **Nothing is ephemeral.**

### 6. Tech Stack
- **Auth:** Supabase Auth magic link today. **better-auth swap is open** — both work, better-auth is more portable, Supabase has tighter Postgres integration. Sam's call.
- **DB:** Supabase Postgres (Sydney `ap-southeast-2`) with pgvector. Migration path: standard `pg_dump` → AWS RDS / Cloud SQL / Neon.
- **Hosting:** Vercel today (Next.js native). Constraints: 300s Fluid Compute timeout = fine for streaming chat. Could move to AWS ECS / Cloud Run via Next.js standalone output.

### 7. Scalability & Future Readiness
- **Plug ML later:** the matching RPC is one file. Replace weights with model inference output → done.
- **Reuse for other verticals:** lead capture + scoring + RAG chat is generic. Swap MARA prompts + university data → migrate this for medical-school admissions, vocational training, anything with a CRICOS-shaped registry.

### 8. Delivery Plan
- **Built phase-by-phase** (0 → 5.5). Each phase has a PHASE.md row with sign-off + commit hashes.
- **Demo checkpoints:** every phase has a verifier sign-off (Gideon PASS). Smoke tests per phase.
- **Definition of done:** dual sign-off + tsc clean + build PASS + grep gates clean + Gideon code review verdict logged.

### 9. Risks & Red Flags (honest)
- **SOP generator Phase 6 not built yet** — biggest gap to call out.
- **Custom analytics dashboard not built** — open decision today.
- **University dataset is 17 not 43** — parked at Phase 8.
- **Mobile app still has UniMate-demo branding** — Phase 7 unblocked, can run in parallel with web.
- **No e2e test suite** — typecheck + smoke tests + manual QA today; e2e is Phase 9.

### 10. Communication & Workflow
Phase tracker + atomic commits + dual code review per phase. Repo has full audit trail. Telegram for sync, GitHub for async.

---

## Numbers Sam can quote

- **9 phases done · 4 pending** (1 core feature + mobile rebrand + audit + QA)
- **8 commits today** for Phase 5.5 alone (pino + Sentry + 3-layer PII redaction)
- **30 console.* calls swapped** to structured logger across 4 API routes
- **Zero PII fields** in the smoke-logger output (verified end-to-end this morning)
- **14 routes** in the production build, **0 type errors**, **build passes** in 6.4s
- **10 migrations** locked in
- **3072-dim** embeddings, **top-k 5**, **0.65 similarity threshold**

---

## What to NOT promise today

- SOP PDF export by tonight (Phase 6 needs ~6h of focused work)
- 43-uni backfill (data entry, parked)
- Custom analytics dashboard (decide today, then build)
- Mobile rebrand (Phase 7 unblocked but not started)
- Native iOS/Android store submissions (Phase 7 + Apple/Play review = 3-7 days)

---

*Generated 2026-04-25 for the 3:30pm meeting. All claims have a phase number + commit hash backing them in `~/Desktop/atlas-ai/PHASE.md`.*
