# SOURCECODE.md — Pathway-AI Living Architecture

**Last updated:** 2026-04-25 · phases 0 → 5.5 done; P6 SOP partial; P7 mobile rebrand pending; P8 dataset backfill pending; P9 handover pending.

**Read this file first** if you are a new developer (human or LLM) opening this repo. It is the contract between code and docs. Every commit that adds, removes, renames a file or bumps a stack version updates this file in the same commit (CLAUDE.md §3).

**TL;DR for an LLM agent:** Pathway-AI is a Next.js 16 + Supabase + AI-SDK student-matching app for Australian universities, scoped under Pathway-AI's registration. Matching is **deterministic SQL** (Postgres RPC). The LLM is **advisor-only** with belt-and-braces deflection on regulated migration topics. Logs are 3-layer redacted. Mobile (Expo SDK 54) exists but is not yet wired to the production API — see §Mobile.

---

## 0. Quick start

```bash
# clone & install
git clone https://github.com/SamDev1303/unimate-demo.git pathway-ai
cd pathway-ai/web && npm install

# env (copy + fill from your provider keys)
cp .env.example .env.local
# required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
# CHAT_MODEL (e.g. "openai/gpt-4o-mini" or "anthropic/claude-sonnet-4-6"),
# OPENAI_API_KEY or OPENROUTER_API_KEY (depending on CHAT_MODEL provider),
# RESEND_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
# optional: SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN

# run
npm run dev # http://localhost:3000

# typecheck + build
npx tsc --noEmit
npm run build

# database migrations
cd ../supabase && supabase db push # applies 001..011 in order
```

Mobile dev (when needed):
```bash
cd mobile && npm install && npx expo start
```

---

## 1. Stack versions (pinned)

### Web (`/web`)
| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.3 | App Router, Server Components, PPR |
| `react` / `react-dom` | 19.2.4 | UI runtime |
| `ai` | ^6.0.158 | Vercel AI SDK v6 (chat streaming, tools) |
| `@ai-sdk/react` | ^3.0.160 | `useChat` / streaming hooks |
| `@ai-sdk/openai` | ^3.0.52 | OpenAI provider (default; swappable via `CHAT_MODEL` env) |
| `@supabase/supabase-js` | ^2.103.0 | DB client |
| `@supabase/ssr` | ^0.10.2 | Server-side Supabase client (App Router) |
| `@upstash/ratelimit` + `@upstash/redis` | ^2.0.8 / ^1.37.0 | Edge rate-limit (chat + leads) |
| `pino` + `pino-pretty` | ^9.14.0 / ^11.3.0 | Structured JSON logger (3-layer redacted) |
| `@sentry/nextjs` | ^10.50.0 | Error tracking |
| `@react-pdf/renderer` | ^4.5.1 | SOP PDF export (P6) |
| `resend` | ^6.10.0 | Transactional email (lead notifications) |
| `framer-motion` | ^12.38.0 | Landing animations |
| `lucide-react` | ^1.8.0 | Icons |
| `tailwindcss` (v4 via `@tailwindcss/postcss`) | ^4 | Utility CSS |
| `zod` | ^4.3.6 | Runtime validation (lead schema, match schema) |
| `class-variance-authority` + `clsx` + `tailwind-merge` | * | UI primitives |
| `typescript` | ^5 | Strict mode |

### Mobile (`/mobile`)
| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54.0.33 | SDK 54 |
| `expo-router` | ~6.0.12 | File-based routing (tabs) |
| `react` / `react-native` | 19.1.0 / 0.81.5 | RN 0.81 + React 19 |
| `nativewind` | ^4.1.23 | Tailwind for RN (with `tailwindcss` ^3.4.17) |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local persistence |
| `@sentry/react-native` | ^8.9.1 | Error tracking |
| `@expo-google-fonts/instrument-serif` + `plus-jakarta-sans` | ^0.4.0 | Typography |
| `expo-haptics` / `expo-blur` / `expo-linear-gradient` / `expo-image` / `expo-symbols` | * | UX primitives |

Node engine: 20 LTS recommended. macOS Bash 3.2 — scripts must be POSIX-portable.

---

## 2. Repo tree (top-level)

```
pathway-ai/
├── README.md Product pitch + quick run/deploy
├── SOURCECODE.md ← this file (read first)
├── PRD.md Hard-cut v1 product spec
├── PRD-CLIENT.md Client-facing PRD (delta vs original 22-page)
├── CLIENT-INTAKE.md Client intake doc
├── CLIENT-STATUS.md Status snapshot for client
├── PHASE.md Phase tracker — dual sign-off, rows = ground truth
├── CLAUDE.md Governance rules for AI agents working here
├── RESUME.md How to continue the build next session (older — STATE.md+HANDOFF.json supersede day-to-day)
├── STATE.md Active session pause/resume state
├── HANDOFF.json Machine-readable session handoff
├── vercel.json Vercel project config (security headers, rewrites)
├── .vercel/project.json Linked project ID (pathway-ai)
├── .gitignore
├── .github/ CI workflows (mara-grep-gate)
├── .planning/ GSD planning artifacts (research, plan-checks, deviations)
│ ├── PROJECT.md, STATE.md, config.json
│ └── research/ Per-phase plan-check + verify outputs (Gideon/Neo/Specter)
├── planning/pathway-ai/ Active phase work (CONTEXT, PLAN, APPROVAL, DEVIATIONS)
├── docs/ Long-lived docs
│ ├── compliance-attestation-v1.md + APP attestation
│ └── client/ Pre-meeting briefs, status messages, screenshare notes
├── ops/n8n/ Optional: lead-sync n8n workflow JSON + README
├── org/reviews/ Cross-agent review artifacts (e.g. uni-data-verify-expand)
├── supabase/migrations/ 001..011 SQL — schema, match RPC, RLS, embeddings, chat audit, SOP drafts
├── web/ Next.js 16 app (production surface)
└── mobile/ Expo SDK 54 app (NOT wired to prod API yet — P7 rebrand pending)
└── _reference/
 ├── archive/ Pre-rename artifacts (old PRD, scaffold snapshot, demo QR)
 ├── client-handover/ SOW + meeting notes
 └── au-imagery-sources.md AU university imagery reference
```

---

## 3. Web source tree (`/web/src`)

```
src/
├── app/ App Router (Next.js 16)
│ ├── layout.tsx Root layout + Pathway-AI metadata + Sentry boot
│ ├── page.tsx Landing page (Hero + MatcherSection + TrustStrip + Footer)
│ ├── globals.css Tailwind v4 base + CSS custom properties (colors)
│ ├── consult/page.tsx ★ consultation landing (target of all chat/SOP deflection links)
│ ├── chat/page.tsx Advisor chat surface (RAG + deflection)
│ ├── login/page.tsx Magic-link sign-in (Supabase Auth)
│ ├── matches/[token]/page.tsx Server Component — renders ranked matches for match_token
│ ├── sop/[leadToken]/ SOP generator (P6 partial)
│ │ ├── page.tsx Server-side draft loader
│ │ └── SopEditor.tsx Client-side section editor + react-pdf export
│ ├── auth/
│ │ ├── callback/route.ts Supabase Auth code-exchange callback
│ │ └── auth-code-error/page.tsx Error UI for failed callback
│ └── api/
│ ├── chat/route.ts Streaming advisor chat (AI SDK v6) — RAG + 3-layer deflection
│ ├── chat-simple/route.ts Non-streaming fallback chat
│ ├── leads/route.ts 5-step lead capture POST → invokes match_unis_for_lead RPC → returns match_token + email via Resend
│ └── sop/route.ts SOP draft generator (LLM → react-pdf)
│
├── components/ UI components
│ ├── Hero.tsx Landing hero
│ ├── MatcherSection.tsx "Three questions" CTA section
│ ├── MatcherForm.tsx Inline matcher (legacy demo — Step3 still uses stub)
│ ├── UniCard.tsx University card (used on landing TrustStrip preview)
│ ├── TrustStrip.tsx / QEAC / CRICOS trust row
│ ├── LeadModal.tsx Modal wrapper for the 5-step lead form
│ ├── Footer.tsx Site footer ( card → portal.mara.gov.au public register link)
│ ├── ChatDrawer.tsx Chat slide-out launcher
│ ├── chat/
│ │ ├── ChatClient.tsx useChat() client — streams, renders deflection CTA chips → /consult
│ │ └── SourcesPill.tsx Citation pill for RAG hits
│ ├── lead/ 5-step lead form (Step1Personal..Step5Contact + Field)
│ │ ├── Step1Personal.tsx Name/email + APP 5 collection notice
│ │ ├── Step2Academic.tsx GPA + IELTS
│ │ ├── Step3Preferences.tsx Field + region + outcomes (uses stubTopMatches preview)
│ │ ├── Step4Budget.tsx Tuition budget + start year
│ │ ├── Step5Contact.tsx Phone + consent_service + consent_marketing (split)
│ │ └── Field.tsx Form field primitive
│ ├── matches/ Renders /matches/[token]
│ │ ├── MatchesHero.tsx, MatchList.tsx, MatchCard.tsx
│ │ ├── StretchSection.tsx, StretchCard.tsx
│ │ ├── ConsultCTA.tsx, MaraBanner.tsx
│ │ ├── PendingMatches.tsx, NotFoundFallback.tsx, ExpiredTokenFallback.tsx
│ └── sop/
│ └── SopPdfDoc.tsx @react-pdf/renderer document
│
└── lib/ Pure logic + integrations (no UI)
 ├── content.ts All landing copy + brand strings — single edit point for non-eng to tweak
 ├── types.ts Shared types (Student, Course, LeadInput, MatchRow)
 ├── utils.ts cn() etc.
 ├── matcher.ts Legacy in-memory matcher (kept for Step3 preview)
 ├── match-weights.ts Weights for the SQL RPC (so backend + preview agree)
 ├── match-reason.ts Human-readable match reason builder
 ├── match-schema.ts Zod schema for match RPC return shape
 ├── match-stub.ts stubTopMatches() preview (client-side teaser only)
 ├── universities.ts Helper accessors
 ├── universities-seed.ts 17 seeded AU universities × 68 courses (P8 expands to 43)
 ├── lead-schema.ts Zod LeadInput schema (incl. consent_service / consent_marketing / wording_version)
 ├── lead-score.ts Lead scoring used in /api/leads
 ├── ratelimit.ts Upstash Redis sliding-window limiters (chat, leads)
 ├── chat-system-prompt.ts -safe system prompt (NEVER clauses + per-turn footer)
 ├── chat-deflection.ts Pre-check + post-filter regex/classifier deflection
 ├── chat-session.ts Chat session persistence (Supabase chat_sessions + chat_messages)
 ├── sop-prompt.ts SOP generator system prompt
 ├── mara-disclaimer.ts wording version + portal.mara.gov.au public register URL constant
 ├── logger.ts pino logger entrypoint (browser + edge + node aware)
 ├── logger-redact.ts 3-layer redaction: path-list + censor + recursive walker
 └── supabase/
 ├── client.ts Browser client (anon key, RLS-bound)
 ├── server.ts RSC server client (cookie-aware)
 ├── service-role.ts Server-only service-role client (RLS-bypass, admin ops)
 └── middleware.ts Auth middleware (refresh sessions on every request)

middleware.ts (root of /web) Next.js middleware — invokes supabase/middleware.ts
instrumentation.ts (root of /web) Sentry instrumentation hook (P5.5)
sentry.{client,server,edge}.config.ts Sentry configs per runtime
```

---

## 4. HTTP endpoints

| Method | Path | Auth | Purpose | Key files |
|---|---|---|---|---|
| GET | `/` | public | Landing page | `app/page.tsx` |
| GET | `/consult` | public | consultation CTA (deflection target) | `app/consult/page.tsx` |
| GET | `/chat` | public | Advisor chat surface | `app/chat/page.tsx`, `components/chat/*` |
| GET | `/login` | public | Magic-link sign-in | `app/login/page.tsx` |
| GET | `/matches/[token]` | public (token-scoped) | Server Component — ranked matches | `app/matches/[token]/page.tsx`, `components/matches/*` |
| GET | `/sop/[leadToken]` | public (token-scoped) | SOP editor + export | `app/sop/[leadToken]/page.tsx` + `SopEditor.tsx` |
| GET | `/auth/callback` | public | Supabase magic-link exchange | `app/auth/callback/route.ts` |
| GET | `/auth/auth-code-error` | public | Auth failure UI | `app/auth/auth-code-error/page.tsx` |
| POST | `/api/chat` | rate-limited | Streaming RAG chat — pre-check → model → post-filter → audit row | `app/api/chat/route.ts`, `lib/chat-*.ts` |
| POST | `/api/chat-simple` | rate-limited | Non-streaming fallback chat | `app/api/chat-simple/route.ts` |
| POST | `/api/leads` | rate-limited | Lead capture → match RPC → match_token + email | `app/api/leads/route.ts`, `lib/lead-*.ts` |
| POST | `/api/sop` | rate-limited | SOP generator | `app/api/sop/route.ts`, `lib/sop-prompt.ts` |

**Accuracy rule (CLAUDE.md §3a):** the count of `app/api/*/route.ts` files must equal the POST row count above. Currently 4 = 4 ✅.

---

## 5. Database (Supabase, region `ap-southeast-2`)

Migrations under `supabase/migrations/` — apply in order (`supabase db push`):

| # | File | What it adds |
|---|---|---|
| 001 | `001_initial_schema.sql` | `universities`, `courses`, `leads`, base indexes, pgvector extension |
| 002 | `002_leads_status.sql` | `leads.status` enum + auto-stamp trigger (`new`/`contacted`/`closed`) |
| 003 | `003_match_prep.sql` | Helper views + match scaffolding |
| 004 | `004_match_function.sql` | `match_unis_for_lead(lead_id)` RPC — deterministic SQL ranking |
| 005 | `005_match_function_stretch_fix.sql` | Stretch-match scoring fix |
| 006 | `006_rls_policies.sql` | RLS on all tables — anon can insert leads only; service-role bypasses |
| 007 | `007_course_embeddings.sql` | `course_embeddings` (pgvector, 1536-dim) + RAG match RPC |
| 008 | `008_chat_audit.sql` | `chat_audit` table — every deflection writes a row |
| 009 | `009_chat_sessions.sql` | `chat_sessions` + `chat_messages` for session persistence |
| 010 | `010_sop_drafts.sql` | `sop_drafts` table (versioned) |
| 011 | `011_sop_drafts_unique.sql` | Unique constraint on (lead_id, version) |

Key RPCs:
- `match_unis_for_lead(lead_id uuid)` — returns ranked strong + stretch matches, weights from `match-weights.ts` mirrored in SQL.
- RAG embedding match — invoked by `/api/chat` for course retrieval before model call.

---

## 6. Architectural patterns (read these before changing anything)

### 6.1 Hybrid SQL + LLM
- **Recommendation = SQL** (`match_unis_for_lead`). Auditable, deterministic, costs $0, -defensible.
- **LLM = advisor only** (`/api/chat`, `/api/sop`). Never the primary decision-maker for regulated outputs.

### 6.2 Belt-and-braces deflection
1. **Pre-check** (`lib/chat-deflection.ts`) — input classifier rejects regulated-advice prompts.
2. **System prompt** (`lib/chat-system-prompt.ts`) — explicit NEVER clause + per-turn disclaimer footer.
3. **Post-filter** — regex/classifier on streamed output; replace + log violations.
4. **Audit log** (`chat_audit` table, mig 008) — every block writes a row.
5. **CI grep gate** (`.github/workflows/mara-grep-gate.yml`) — rejects PRs that re-introduce migration-advice strings.

### 6.3 3-layer log redaction
- Layer 1: pino `redact` path list (e.g. `req.body.email`, `lead.phone`).
- Layer 2: `censor` function — regex pass for emails / phones / passport-shaped strings.
- Layer 3: recursive walker pre-serialization for nested/dynamic shapes.
- Smoke test: `web/scripts/smoke-logger.ts` (run with `LOG_LEVEL=debug npx tsx web/scripts/smoke-logger.ts`) — emits PII fixtures, asserts zero leaks.

### 6.4 Vendor-lock avoidance
- **AI provider gated by env:** `CHAT_MODEL` env var swaps OpenAI / Anthropic / OpenRouter / Vercel AI Gateway. Default = AI Gateway with `"provider/model"` strings.
- **DB:** plain Postgres (`pg_dump` portable).
- **Auth:** JWT via Supabase, replaceable with better-auth.
- **Hosting:** Vercel (Next.js standalone output runs anywhere).

### 6.5 Phase tracker discipline
- PHASE.md is ground truth. Every commit mapping to a phase updates that phase's row in the **same commit**.
- Governance commit before code (row → `in_progress`).
- Atomic `feat(phase-N): <what>` commits.
- Final feat of a phase flips row → `done` in the same commit.
- Dual sign-off: Gideon (code) + Neo (ops/copy) — Specter (NIM Nemotron) is fallback.

---

## 7. Web environment variables

See `web/.env.example`. Minimum to run locally:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CHAT_MODEL` (e.g. `openai/gpt-4o-mini`)
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY` (must match `CHAT_MODEL` provider)
- `RESEND_API_KEY` (lead notification email)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate-limit)

Optional: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `LOG_LEVEL`.

Production: managed via `vercel env`. Never commit `.env.local`.

---

## 8. Mobile (`/mobile`) — current status

**Built:** Expo SDK 54, expo-router tabs (5 tabs: index, match, profile, chat, sop), Sentry wired, theme + haptics + icons primitives.

**NOT yet wired:**
- Bundle ID still `cloud.claudeking.unimate` and display name `Pathway-AI Australia` (P7 rebrand pending).
- `mobile/lib/api.ts` hardcodes `https://unimate-demo.vercel.app` — needs to point at `pathway-ai.vercel.app` (or env-gated).
- Mobile uses `mockData.ts`, not the live `match_unis_for_lead` RPC.
- Chat tab placeholder still mentions "visas" — needs -safe rewrite to match web side.
- `mobile/tunnel-demo.sh` references stale path `~/Desktop/Unimate-demo/mobile`.

**Planned in P7 (mobile rebrand) + parallelizable with P6:**
1. Rename bundle / app.json / package name → pathway-ai.
2. Point `lib/api.ts` at the real `/api/leads` + `/api/chat` endpoints (env-gated).
3. Apply same -safe deflection on chat tab.
4. Apply same APP 5 collection notice on lead capture.
5. Sentry DSN swap.

---

## 9. Phase status snapshot (mirrors PHASE.md)

| # | Phase | Status |
|---|---|---|
| 0 | Repo restructure + governance | ✅ done |
| 0.5 | Scaffold scrub ( copy audit) | ✅ done |
| 1 | Supabase + AU universities seed | ✅ done |
| 2 | Supabase Auth (magic-link) | ✅ done |
| 3 | 5-step lead capture + APP 5 consent | ✅ done |
| 4 | UniMatch engine via SQL RPC | ✅ done |
| 4.5 | compliance gate | ✅ done |
| 5 | AI Advisor Chat + RAG + deflection | ✅ done |
| 5.5 | Observability (pino + Sentry + redaction) | ✅ done |
| 6 | SOP Generator | 🟡 partial (route + UI + migrations 010/011 + react-pdf shipped; tracker row stale) |
| 7 | Mobile rebrand | ⬜ not started |
| 8 | University dataset backfill (17 → 43) + analytics dashboard | ⬜ not started |
| 9 | Final compliance audit + handover pack | ⬜ not started |

---

## 10. Where to look for what

| If you want to … | Read / edit |
|---|---|
| Change landing copy | `web/src/lib/content.ts` |
| Change matching logic | `supabase/migrations/004_match_function.sql` + `web/src/lib/match-weights.ts` |
| Change chat behavior or deflection | `web/src/lib/chat-system-prompt.ts` + `chat-deflection.ts` |
| Change lead form fields/consent | `web/src/lib/lead-schema.ts` + `web/src/components/lead/Step*.tsx` |
| Change wording | `web/src/lib/mara-disclaimer.ts` |
| Add a new university | INSERT into `universities` + `courses`, run `scripts/backfill-course-embeddings.ts` |
| Swap AI provider | Set `CHAT_MODEL` env var; no code change |
| Add a new API route | `web/src/app/api/<name>/route.ts` + add row to §4 of this file (CLAUDE.md §3a will fail CI otherwise) |
| Add a new DB migration | `supabase/migrations/0NN_<name>.sql` + add row to §5 of this file |
| Add a phase | `PHASE.md` (with dual sign-off plan) |
| Continue work next session | Read `STATE.md` + `HANDOFF.json` + this file |

---

## 11. Out of scope for v1 (re-adding requires new PO)

Tracked in `PRD.md` §3. Includes: ML matching, multi-tenant, payments, native mobile parity, in-product analytics dashboard (open client decision — may move to P8).
