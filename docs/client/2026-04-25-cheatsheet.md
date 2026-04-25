# Client Cheatsheet — 2026-04-25

**Keep this on second monitor during the call.** One-page answers to the three likely meta-questions.

---

## 1. "Where's the actual app build?"

**You are looking at it.** This is production, not a prototype.

| Layer | What's live |
|---|---|
| **Frontend** | Next.js 16 (App Router) on Vercel, Sydney edge |
| **Backend** | Supabase Postgres in `ap-southeast-2` (Sydney — data sovereignty under Privacy Act 1988) |
| **Auth** | Supabase magic-link |
| **AI** | Gemini embeddings (3072-dim) + chat with 3-layer MARA compliance gate |
| **Observability** | pino structured logs + Sentry + 3-layer PII redaction |
| **Rate limiting** | Upstash Redis on chat + lead capture |

**Live features:** lead capture (5-step + scoring) · uni matcher (Postgres RPC) · AI advisor chat with course citations · lead notification email · 17 unis, 68 courses indexed.

**Say:** *"What you're seeing today is the production build — web app on Vercel, Supabase backend in Sydney for data sovereignty. Lead capture, matcher, AI advisor with citations — all live."*

---

## 2. "What ships next?"

| Phase | Scope | ETA |
|---|---|---|
| **P6 — SOP Generator UI** | react-pdf SOP doc generation (backend route + DB schema already live) | This week (~6h focused work) |
| **P7 — Mobile rebrand** | React Native UI re-skin over existing shell, reuses backend 1:1 | Next week (~1 day) |
| **P8 — Dataset backfill** | 17 → 43 unis + CRICOS codes | Held until brand identity locked (~1 day) |
| **P9 — Playwright e2e + handover** | Full e2e suite + client handover docs | End of week after P8 |

**Say:** *"SOP generator UI ships this week. Mobile rebrand the week after. Dataset backfill to all 43 Aussie unis after brand identity is locked."*

---

## 3. "Will mobile use the same?"

**Yes — shared backend, second surface. Not a rebuild.**

```
                ┌─────────────────────────────┐
                │  Supabase (Sydney)          │
                │  • Auth · Leads · Matches   │
                │  • Course embeddings (RAG)  │
                │  • Match RPC · RLS · Audit  │
                └──────────────┬──────────────┘
                               │
                ┌──────────────┴──────────────┐
                │      Shared API layer       │
                │   (chat · matcher · SOP)    │
                └──────┬───────────────┬──────┘
                       │               │
              ┌────────▼─────┐  ┌──────▼──────┐
              │  Web (live)  │  │ Mobile (P7) │
              │  Next.js 16  │  │ React Native│
              └──────────────┘  └─────────────┘
```

**Why it matters:** add a new uni or update a course → shows up on web AND mobile simultaneously. No duplicate data, no sync drift, no parallel codebase rot.

**Say:** *"The backend — Supabase, matcher RPC, embeddings, chat API — is shared. Mobile reuses all of it; only the UI is React Native. New uni or course update propagates to both surfaces simultaneously."*

---

## Likely client probes — short answers

| Probe | Answer |
|---|---|
| *"How does it scale to 43 unis / 1000 leads/day?"* | Postgres scales with the DB. Pgvector linear scan is sub-ms at current size; we'll add IVFFlat at ~5000 rows. Upstash rate-limits chat + leads. |
| *"What model do you use?"* | Gemini for embeddings (3072-dim). Chat answers route through a MARA-compliance deflection layer first — that's the more important part than the model. |
| *"What about hallucinations on visa/migration questions?"* | 3-layer deflection gate. Layer 1 keyword block, layer 2 semantic similarity, layer 3 system-prompt MARA disclaimer. We don't promise visa outcomes — ever. |
| *"What's the per-conversation cost?"* | ~$0.001/turn at current 350+250 token cap. Negligible at 1000 leads/day scale. |
| *"Where's the data stored?"* | Supabase Sydney region (`ap-southeast-2`). All lead PII is RLS-protected, redacted in logs, never sent to third-party LLMs without redaction. |
| *"Can we white-label this?"* | Yes — frontend is themeable, backend is multi-tenant ready (single-tenant today). P10 if you want it formally scoped. |
| *"What if Supabase goes down?"* | Status page link, Sentry alerts, Sydney region has 99.9% SLA. We've got Postgres backups daily. |
| *"Who owns the IP / code?"* | Per the SOW — covered. (Defer specifics to written agreement.) |

---

## Things to NEVER say
- ❌ "It's a demo" — it's prod
- ❌ "We're rebuilding for mobile" — you're not, it's a rebrand
- ❌ "I think it should work" — say "it does work" or "I'll verify and follow up"
- ❌ Specific completion dates without buffer — always week-of, not day-of
- ❌ "We use ChatGPT" — say "Gemini for embeddings, the chat layer is provider-agnostic"

---

## If something breaks live
- Step away from the broken surface, **don't debug on screen**
- Pivot to: *"Let me show you [other working feature] while I make a note to fix this"*
- Send `2026-04-25-status-message.md` style follow-up within 2 hours with the fix shipped
- The client trusts an operator who recovers gracefully more than one whose demo never breaks
