# Phase 5 — AI Advisor Chat + basic RAG

**Created:** 2026-04-21 · Koda session 51 (discuss-phase, all gray areas)
**Domain:** Ship a -safe AI advisor chat surface on pathway-ai. Users ask questions about the 12 (→43 post-P4.5) seeded AU universities and their courses; a free OpenRouter model answers grounded in pgvector-retrieved course metadata, with hard deflection on anything visa/PR/migration/points-test. Chat surface is a dedicated `/chat` route, anonymous-first. No real/paid API keys used until after the client meeting today confirms scope.

**Not in scope:** SOP generation (P6), mobile rebrand (P7), audit/QA (P8/P9), multi-turn memory beyond single session, lead re-auth to resume history, paid-tier model swap (deferred post-meeting), multimodal (image/voice) input, web-search augmentation, tool-calling beyond RAG retrieve.

---

## <prior_decisions>

Locked in earlier phases or PRD — downstream agents must not re-ask.

### From PRD + CLAUDE.md
- **Tech stack:** Next.js 16 App Router hand-coded, Supabase (ap-southeast-1 Singapore, DEV-001), Vercel Fluid Compute, AI SDK v6.
- ** Code compliance:** zero visa / PR / migration / points-test / 485 / 189 / 190 / MLTSSL / LMIA strings anywhere in output. Regression-checked P0.5 + P4.5 + P9.
- **43 AU unis from CRICOS manual seed** is the production target (currently 12 loaded — P4.5 backfill).
- **Anonymous-first** — no login wall for chat surface (per P2 infra decision).

### From P4.5 (Compliance gate, closed 2026-04-20)
- `web/src/lib/chat-system-prompt.ts` already ships `CHAT_SYSTEM_PROMPT_V1` + `CHAT_PER_TURN_FOOTER` + 12 deflection triggers as P5 staging. **Re-use, do not rewrite.**
- Per-turn disclaimer footer is a hard contract — every assistant message MUST end with it (DOM-verified in P5 UAT, not P4.5).
- `consent_wording_version` schema supports versioning — chat consent (logging opt-in) follows same pattern if added.
- RLS policies migration `006_rls_policies.sql` is authored; chat tables inherit the same pattern.
- Local-pending `.github/workflows/mara-grep-gate.yml` must land before P5 ships (needs Sam `gh auth refresh -h github.com -s workflow`). **Blocker for production push, not for development.**

### From P4 + P3
- Lead form already captures `preferred_fields[]`, `preferred_levels[]`, `industry_placement`, etc. — available for RAG personalisation if user has an active `lead_id` cookie.
- Top-3 match results from UniMatch are stored as JSONB on `leads.matches`. Chat can use these as prior context when a lead-token is present (post-match re-engagement).
- Supabase `courses` schema has the retrievable fields: `field`, `level`, `indicative_fee`, `ielts_overall`, `intake_months`, `duration_months`, `industry_placement`, `cricos_code` (nullable, backfill P4.5).

### From CLAUDE.md runtime rules
- Single-seat Gideon on `gpt-5.4` full for plan-check + phase-verify.
- Commit protocol: atomic per wave, commit message format `feat(phase-5): wave-N — {what}`.
- Source-of-truth keys: `~/Desktop/api/KEYS.md` → generate `.env` entries, never hardcode.

---

## <decisions>

9 decisions locked this session (all gray areas accepted with Context7 verification on the model pick).

### D1 — Model: free OpenRouter `qwen/qwen3-next-80b-a3b-instruct:free`
**Context7 verified** 2026-04-21 via `/websites/openrouter_ai` (High reputation, 3860 snippets) + WebSearch of openrouter.ai/collections/free-models. Model is currently live in `org/config/free-models.json` (refreshed 2026-04-19 via `/v1/models` probe) as `neo-fallback`-assigned; P5 consumption does not block Neo since Neo runs via OpenCode's zero-auth wrapper, not direct OpenRouter.

- **Provider:** OpenRouter (`base_url: https://openrouter.ai/api/v1`, auth via `OPENROUTER_API_KEY`).
- **Model ID:** `qwen/qwen3-next-80b-a3b-instruct:free`.
- **Context:** 262,144 tokens (plenty for system prompt + RAG chunks + 20-turn conversation).
- **Rate limits:** 20 rpm, 200 rpd (free tier, hard ceiling — see D5 for rate-limit UX).
- **Rejected:** `openrouter/free` meta-router — non-deterministic model selection breaks compliance audit trail (same prompt must produce same deflection path).
- **Rejected:** Anthropic Claude via Gateway / OpenAI gpt-5-mini — require real keys. Sam: "no real keys unless I do a meeting today." Swap path pre-wired in D1b.
- **D1b (swap path):** Store provider choice in `CHAT_PROVIDER` env var (`openrouter-free` | `anthropic-gateway` | `openai-gateway`). All three paths handled by AI SDK v6's unified provider interface — swap is a 1-line env change post-meeting. Document the swap in `docs/chat-provider-swap.md`.

### D2 — Surface: dedicated `/chat` route
- New page: `web/src/app/chat/page.tsx`.
- Entry points: hero CTA on `/` ("Ask the AI advisor"), post-lead-capture thank-you screen link, footer link.
- Anonymous-first — no login gate. If a `lead_id` cookie is present, chat MAY personalise using stored preferences (see D6 for history linkage).
- **Rejected:** persistent widget on every page (maintenance tax on mobile nav, 2026 performance cost vs $3k budget).
- **Rejected:** modal-only post-lead-capture (hides chat from top-of-funnel discovery).

### D3 — RAG: per-course chunking via pgvector
- **Unit of retrieval:** one row per course (48 today → 172+ post P4.5 43-uni backfill).
- **Embedding model:** `gemini-embedding-001` (3072-dim) via Google AI key already in `shared.env` — reuses koda-memory infra, zero new API surface, proven in production.
- **Storage:** new Supabase migration `007_course_embeddings.sql` — adds `course_embeddings(course_id uuid FK, embedding vector(3072), updated_at timestamptz)` + HNSW index on `embedding vector_cosine_ops`.
- **Embedding input text:** concatenation of `{university.name} · {course.name} · level={course.level} · field={course.field} · fee={course.indicative_fee} · IELTS={course.ielts_overall} · intake={course.intake_months} · placement={course.industry_placement}`.
- **Retrieval:** `top_k=5`, cosine similarity threshold `0.65`. Below threshold → no-hit fallback (D8).
- **Backfill:** script `web/scripts/backfill-course-embeddings.ts` runs via `service_role`, incremental on `updated_at`.
- **Rejected:** per-university chunking (loses course granularity — user asks "MBA at Sydney" needs the course row).
- **Rejected:** OpenAI `text-embedding-3-small` (PRD spec) — conflicts with D1 "no real keys." Revisit post-meeting if we swap to paid.

### D4 — Citations: expandable "Sources (N)" pill
- Under each assistant message, render pill: `Sources (3) ▾`.
- Expanded: list of retrieved course rows — `{university.name} — {course.name} (CRICOS: {cricos_code || '—'})`.
- Click a source → inline detail card (no navigation, keeps chat context).
- **Rejected:** inline footnotes (noisy on 375px mobile per personality rules).
- **Rejected:** no citations (breaks trust on a -sensitive surface).

### D5 — Rate-limit: Upstash Redis via Vercel Marketplace
- Sliding window: 10 req/min per IP, 50 req/session-id cookie, 200 req/day global (matches OR free-tier ceiling so we fail gracefully before hitting OR's 429).
- Storage: Upstash Redis (free tier: 10k commands/day, shared across Fluid Compute instances). Install via `vercel integrations install upstash`.
- **429 response UX:** on limit hit, assistant message: "I'm getting a lot of questions right now. Try again in a minute, or book a call with Sam." + Calendly link.
- **Rejected:** in-memory Map (leaks across Fluid instance warm-ups, breaks at even 2 concurrent users).
- **Rejected:** Vercel Runtime Cache (great for reads, not quota counters — no atomic INCR).

### D6 — History: anonymous session cookie + optional lead link
- New `chat_sessions(id uuid, session_token text unique, lead_id uuid nullable FK, created_at, last_active_at)`.
- New `chat_messages(id uuid, session_id uuid FK, role text check (role in ('user','assistant')), content text, retrieved_course_ids uuid[], created_at)`.
- Cookie: `atlas_chat_session` (httpOnly, secure, 30-day TTL).
- If `atlas_lead` cookie present at chat start → link `chat_sessions.lead_id`. Enables post-capture chat to reference stored match results.
- **RLS:** chat tables readable ONLY by service role — no client exposure (chat UI hits `/api/chat` server-side).
- **Retention:** 30-day purge cron on `pg_cron` — matches consent wording.
- **Rejected:** no persistence (breaks reload UX, blocks analytics Sam needs).
- **Rejected:** localStorage only (not queryable for Sam's ops dashboards).

### D7 — Deflection: belt-and-braces (prompt + post-filter)
- **Layer 1:** `CHAT_SYSTEM_PROMPT_V1` (already staged P4.5 Wave 1) enforces deflection at model level.
- **Layer 2:** Post-filter regex scan on streamed model output. Triggers on: `/\b(visa|PR|permanent residen|migration|485|189|190|491|494|MLTSSL|STSOL|ROL|skilled occupation|points test|LMIA|green card|citizenship)\b/i`. On hit:
 - Abort stream.
 - Replace full response with `CHAT_PER_TURN_FOOTER`-prefixed canned deflection: "For visa, PR, or migration questions, please consult a registered advisor. [ register](https://www.mara.gov.au/). I can help with course and university information."
 - Log to new `mara_deflections(id, session_id, user_message, triggered_phrase, created_at)` table for Sam's compliance audit.
- **Rejected:** prompt-only enforcement — known bypasses exist in prod tools (jailbreaks, token-smuggling). Regex is structural, auditable, cheap.

### D8 — No-hit fallback: honest deflection, never fabricate
- When RAG retrieval returns <1 course above 0.65 threshold:
- Response template: "I don't have information on that in my current dataset (12 universities, 48 courses today — growing soon). For personalised advice on options I don't cover yet, please [book a call with Sam](#calendly-link). I can help with what's in my dataset — ask about a specific university or study level."
- Log to `chat_dataset_gaps(session_id, user_message, created_at)` — drives Sam's roadmap on what to add next.
- **Rejected:** general AU-education training-data fallback — model hallucination risk, breach risk.

### D9 — Abort/backpressure: AI SDK v6 `useChat` built-ins
- Client: `useChat({ api: '/api/chat', onFinish, onError })` with standard stop button + AbortController on unmount.
- Server: `streamText` from `ai` v6 with built-in cancellation propagation. `onFinish` callback writes assistant message + retrieved course IDs to DB.
- Fluid Compute graceful shutdown already handles mid-stream process kill — no custom logic needed.
- Per-IP concurrent stream cap: 1 (enforced in Upstash via session lock). Second stream attempt → 429 until first finishes/aborts.
- **Rejected:** custom AbortController plumbing (AI SDK v6 ships this; reinventing costs ~30 LoC for zero gain).

---

## <open_questions>

- **Q1 (post-meeting):** Swap `qwen3-next-80b-a3b-instruct:free` → paid model? Decision gated on today's meeting outcome. Pre-wired via D1b env flip.
- **Q2 (P4.5 dependency):** Does mara-grep-gate.yml need to include chat-prompt source files? **Answer: yes** — add `web/src/lib/chat-system-prompt.ts` + `web/src/app/api/chat/route.ts` to the grep paths list before P5 production push.
- **Q3 (Calendly link):** Sam's Calendly URL for D5 + D8 fallbacks — needs a stable link. Placeholder `#calendly-link` in prompts; replaced at wire-time.

## <deferred_ideas>

Captured but explicitly out of P5 scope:

- Multimodal input (image upload of uni brochure for parsing) — v2 feature.
- Proactive notifications ("A new course at UTS matches your preferences") — requires email infra + consent v4.
- Chat-driven lead capture ("Tell me about you" flow inside chat) — blurs line with lead form, defer to UX testing post-launch.
- Tool-calling beyond RAG (e.g. fee calculator, IELTS score estimator) — P8 scope if UAT demands.
- Multi-language (Mandarin, Hindi) — target market skew but +$$ translation cost, v2.

## <downstream_signals>

For `gsd-phase-researcher`:
- Research **OpenRouter + AI SDK v6 integration** — there's a community provider (`@openrouter/ai-sdk-provider`) but confirm maintenance status + streaming behaviour with Qwen3 Next 80B.
- Research **pgvector HNSW index tuning** for 3072-dim Gemini embeddings at ~200-row scale (likely M=16, ef_construction=64 default is fine, verify).
- Research **Upstash Redis sliding-window rate limit** code pattern compatible with Vercel Marketplace auto-provisioned env vars.
- Research **AI SDK v6 `streamText` + post-stream regex interception** — is there a clean middleware hook, or do we wrap the stream manually?
- Verify `gemini-embedding-001` batch embedding pricing + rate limits vs 200-row backfill (should be well under free tier).

For `gsd-planner`:
- Wave structure: (0) schema migrations + embedding backfill, (1) `/api/chat` route + streaming + RAG retrieval, (2) deflection post-filter + audit tables, (3) `/chat` UI with useChat + citations pill, (4) rate limit + Upstash wiring, (5) integration tests + regression scan, (6) mara-grep-gate.yml update + commit.
- Review protocol: single-seat Gideon on `gpt-5.4` full per CLAUDE.md.
- Commit cadence: one per wave, message prefix `feat(phase-5):`.

## <approval>

- **Sam verbal approval** 2026-04-21 via chat: "for the ai model use a free openrouter model no real keys used unless i do a meeting today so continue building all the rest is good" — captured as P5 proceed signal (substitutes for Telegram APPROVAL.md per CLAUDE.md HARD RULE step 4 since session is in-channel with Sam direct).
- Hard block on production push: mara-grep-gate.yml + Upstash Redis provisioning + post-meeting model decision.

---

*Next: `/gsd-plan-phase 5` to turn this into an executable PLAN.md with wave breakdown + Gideon plan-check.*
