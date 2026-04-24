# Atlas AI — Status vs Agenda

**Prepared for:** Product Architecture & Execution Alignment meeting
**Date:** 2026-04-24, 5:00pm IST
**Prepared by:** Sam (ClaudeKing)
**Repo:** `atlas-ai` · 11 migrations live on Supabase Sydney (`ap-southeast-2`) · Phases 0–5 shipped

---

## TL;DR

6 of 10 agenda items are shipped or in good shape. 4 are deliberate open decisions I want your call on, not blockers. No surprises below — everything is either ✅ done, ⚠ trade-off, or ❓ open for you to pick.

---

## 1. Goal of Engagement — ✅

Not just "build fast". Every phase has a plan-check review before code and a phase-verify review after. Two reviewer seats (Gideon = code, Neo/Specter = compliance) sign off before a phase moves to `done`. This is why P0–P5 shipped with only one rollback (Wave 6 MARA grep widening) across ~40 commits.

## 2. Non-Negotiables — ✅ mostly, 1 honest gap

| Must-have | Status | Evidence |
|---|---|---|
| Clean, modular architecture | ✅ | `web/src/lib/` — 19 single-purpose files. No agent chaining. One deterministic `/api/chat` streaming route + one deterministic `match-weights.ts`. |
| Code ownership & readability | ✅ | Typed (zod on every API route), `SOURCECODE.md` route-table with accuracy-rule enforcement. |
| Proper logging & debuggability | ⚠ | Server-side audit tables exist (`mara_deflections`, `chat_dataset_gaps`). **App-level logger (pino/winston) not installed yet** — deliberately deferred, ~1h fix. |
| Reusability for future phases | ✅ | `lib/` files are domain-functions, not coupled to Next.js. Portable to React Native / other verticals. |
| No vendor lock-in | ✅ | Supabase = standard Postgres + pgvector (exportable). Supabase Auth = standard JWT (swappable). Vercel = Next.js standard (swappable to any Node host). |

## 3. System Design — ✅

```
[Next.js App Router on Vercel]
        │
        ├─ /matches (discovery UI)
        ├─ /chat    (advisor UI)
        ├─ /sop     (SOP generator UI)
        │
        ▼
[/api/* route handlers — zod-validated, typed responses]
        │
        ├─ /api/match   → rule-based scoring + pgvector recall
        ├─ /api/chat    → streaming LLM + MARA deflection + audit write
        ├─ /api/leads   → progressive save + consent versioning
        └─ /api/sop     → LLM draft + PDF export (P6, not yet built)
        │
        ▼
[Supabase Postgres ap-southeast-2 Sydney]
  • 11 migrations
  • RLS live (anon = read-only on public tables, service role writes)
  • pgvector for course embeddings
```

**Data model (`supabase/migrations/001_initial_schema.sql`):** `universities` (43 AU unis, 12 seeded so far) · `courses` · `students` · `leads` · `chat_sessions` · `chat_messages` · `mara_deflections` · `chat_dataset_gaps` · `course_embeddings` · `sop_drafts`.

**API structure:** extensible. Every route is `export async function POST(req)` with a zod schema at the top, business logic in a `lib/` file, Supabase client scoped per-request. New routes slot in without touching existing ones.

## 4. Core Features — Phase 1 — ✅ shipped in P4/P5

| Feature | Status | Where |
|---|---|---|
| College discovery flow | ✅ | `/matches` page + `/api/match` |
| Recommendation logic | ✅ **hybrid** | `match-weights.ts` (rule-based) + `007_course_embeddings.sql` (pgvector). Starts rule-based, embeddings kick in on free-text intent. |
| Search + filters | ✅ | City / state / ranking / Group-of-Eight / regional / industry-placement flags |
| Analytics tracking | ⚠ raw data yes, **dashboard no** | `chat_dataset_gaps` + `mara_deflections` + `chat_sessions` all written server-side. No analytics UI yet — see §5. |

## 5. Critical Questions — 2 answered, 2 need your call

| Question | Answer |
|---|---|
| How is the college dataset created and updated? | Seeded from CRICOS open data + public uni pages into `supabase/migrations/001_initial_schema.sql`. Updates = new migration file. **Open:** 12/43 unis seeded; backfill scheduled for P8. CRICOS codes missing on a subset of seeded rows — same P8 backlog. |
| How does recommendation logic evolve? | Rule weights are a single file (`match-weights.ts`) — tunable. Embeddings are regenerable per-course. No retraining pipeline yet; not needed at current data volume. |
| **Where is analytics dashboard coming from?** | **Open decision.** Three paths: (A) Supabase Studio as admin dashboard — free, production-grade, available today; (B) `/admin/analytics` custom Next.js page reading the audit tables — ~3h build; (C) Metabase/Grafana bolted on — 1 day. Recommend (A) for v1, (B) in P8. |
| How do we track user interactions meaningfully? | Already happening at table level: `chat_sessions` (every session + user_id), `chat_messages` (every turn), `mara_deflections` (every compliance abort), `chat_dataset_gaps` (every "I don't know" fallback → product signal). What's missing is the *visualization*, not the *tracking*. |

## 6. Tech Stack Decisions — 1 open

| Area | Current | Notes |
|---|---|---|
| **Auth** | Supabase Auth magic link (P2 shipped) | You mentioned better-auth. I shipped Supabase Auth to unblock P3–P5. **Swap cost:** 1–2 days, isolated to one `packages/auth` swap — no migration of user data because Supabase Auth stores standard JWTs. **Your call:** swap now or defer to P8? |
| DB | Supabase Postgres (Sydney) + pgvector | Migration path out: `pg_dump` + `psql restore` to any Postgres. Zero lock-in on the data. |
| Hosting | Vercel serverless (Next.js App Router) | Serverless constraints respected: 300s fn timeout max, streaming OK, no long-lived sockets. Portable to any Node host. |

## 7. Scalability & Future Readiness — ✅

| Concern | Answer |
|---|---|
| Plug ML models later? | pgvector is already in. Swap embedding model = one env var + one migration. Swap scoring = one file. |
| Reuse for other verticals? | Schema is domain-parameterized: replace "university" with "clinic"/"provider", `courses` with `services`, keep RLS + match fn intact. ~3 days to re-skin for a new vertical. |

## 8. Delivery Plan — ✅

`PHASE.md` is the source of truth. 10 phases. Every commit maps to a phase row. Every phase has plan-check → build → phase-verify → dual sign-off.

| Phase | Status |
|---|---|
| P0 Repo restructure + governance | ✅ done |
| P0.5 Scaffold scrub (MARA) | ✅ done |
| P1 Supabase schema + 12-uni seed | ✅ done |
| P2 Auth (magic link) | ✅ done |
| P3 Lead capture + scoring | ✅ done |
| P4 UniMatch engine | ✅ done |
| P4.5 Compliance gate | ✅ done |
| P5 AI Advisor Chat + RAG | ✅ done |
| P6 SOP generator + PDF | next |
| P7 Mobile rebrand (Expo) | can parallelize with P6 |
| P8 Final audit + handover | + 43-uni backfill + better-auth if chosen |
| P9 QA + deploy | final |

**Demo checkpoints:** P4 demo = match engine live · P5 demo = chat live · P6 demo = SOP generator · P9 = final handover.

## 9. Risks & Red Flags — addressed, 1 open

| Risk | Mitigation |
|---|---|
| Over-reliance on AI agents | Explicit architecture rule: one `/api/chat` route, deterministic deflection, no LangChain-style chains. No agent calls another agent anywhere in the codebase. |
| Lack of structure in codebase | `SOURCECODE.md` + CLAUDE.md §3a route-table accuracy rule: every new route updates the doc in the same commit. Enforced by review. |
| Missing analytics layer | See §5 — raw data is captured, dashboard is an open decision. |

## 10. Communication & Workflow — ✅

- Phase-gated: no work starts without plan-check.
- Atomic commits, each mapped to a phase row.
- Dual-seat review (two independent reviewers sign off).
- Compliance gate is its own phase, not a checkbox.

---

## What I want your call on (in priority order)

1. **Analytics dashboard path:** Supabase Studio (today, free) → custom UI in P8? Or custom now?
2. **better-auth swap:** 1–2 days now, or P8?
3. **P6 vs P7 ordering:** SOP generator first (sequential) or mobile rebrand in parallel (Play/App Store review adds 3–7 day latency so starting P7 soon protects the timeline)?

## What I'll ship this week regardless

- `pino` structured logging on `/api/chat`, `/api/leads`, `/api/match` (~1h)
- Sentry on web + mobile (~20min)
- 43-uni backfill + CRICOS code completion (P8 item)

---

*This document is generated from `PHASE.md` + `SOURCECODE.md` + live migration files. Every claim above is grep-able in the repo.*
