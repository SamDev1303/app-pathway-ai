# Screen-Share Notes — Atlas AI Meeting
**Today: Saturday 2026-04-25, 3:30pm AEST** · 30-min slot
**Live URL:** https://unimate-demo.vercel.app · **Repo:** github.com/SamDev1303/unimate-demo (private)

---

## OPEN WITH (60 sec)

> "Nine of ten phases live. Compliance gate, RAG chat, observability, lead-form-to-ranked-matches redirect — all production-ready. Phase 5.5 — structured logging + Sentry — landed this morning specifically because your agenda flagged debuggability as a non-negotiable. Phase 5.6 — pre-meeting hardening — landed an hour ago: lead form now redirects to the ranked matches page on submit, chat catch path is SSE-graceful, embeddings backfill is live. Want me to walk you through what's live, or jump straight to your questions?"

**Let them choose.** "Walk through" → demo script (`2026-04-25-demo-script.md`). "Questions" → Pre-empted Questions table below.

---

## TALKING POINTS (the big wins)

1. **Recommendation is SQL, not LLM.** Postgres RPC `match_unis_for_lead` ranks courses by GPA × IELTS × budget × field × level. Auditable, deterministic, sub-millisecond, costs nothing per request. ML drops in at one file when ready.
2. **Three-layer MARA deflection.** Regex pre-check on input + cumulative-buffer post-filter on the streamed output (catches "vi"+"sa" splits across token boundaries) + audit-row to `mara_deflections` per block. Not relying on the model to behave.
3. **Three-layer PII redaction in logs** (Phase 5.5). REDACT_PATHS allowlist + censor function + recursive walker. Smoke test (`web/scripts/smoke-logger.ts`) proves zero leaks end-to-end.
4. **No vendor lock by design.** `CHAT_MODEL`, `CHAT_SIMPLE_MODEL`, `SOP_MODEL` env vars. Database is plain Postgres. Auth is JWT.
5. **Every interaction is a database row.** Leads, chats, deflections, dataset gaps, SOP versions — nothing is ephemeral.

---

## DEMO FLOW (use the demo script as source of truth)

Use `docs/client/2026-04-25-demo-script.md` for the exact click-by-click. Quick summary:

| Step | URL | What they see |
|---|---|---|
| 1 | unimate-demo.vercel.app | Landing + MARA top + footer |
| 2 | Click "Find your match" | 5-step lead form modal opens |
| 3 | Fill demo lead + submit | **Auto-redirect to `/matches/[token]` with ranked Strong + Stretch matches** |
| 4 | unimate-demo.vercel.app/chat | "What IELTS for a Master of IT?" → streamed RAG answer |
| 5 | Same chat | "Can I get PR after this?" → instant deflection + audit row |
| 6 | /consult | Mailto + Liverpool office line |

If short on time: **steps 1, 3, 4, 5.** Compliance + UX + RAG + deflection in 4 minutes.

---

## PRE-EMPTED QUESTIONS (the secret weapon for smart-act clients)

> Smart clients try to look smart. Answer from concrete numbers, not vibes.

### "How many universities are in the dataset?"
**17 in production today** (CRICOS-keyed, full course catalog), **32 in the matcher widget dataset** (broader landing-page exploration), **target 43 by Phase 8**. Backfill from 17 → 43 is roughly 1 day of CSV import + re-embed — held deliberately until brand identity is locked so we don't re-seed twice.

### "Why OpenRouter Qwen — isn't that a free tier?"
**It's not Qwen — we pinned to `openai/gpt-4o-mini` via OpenRouter pre-meeting** for paid SLA reliability. `CHAT_MODEL=openrouter/openai-mini` env var. Single-line swap to Sonnet 4.6 (`openrouter/anthropic-sonnet`) or Qwen free (`openrouter/qwen-free`) — already implemented as a switch in the code (`pickModel()`).

### "What stops the AI giving migration advice?"
**Three layers, defense in depth:**
1. **Layer 1 — system prompt + regex pre-check.** Last user message scanned by `scanForDeflection()` before the model is called. Migration phrases short-circuit straight to the canned MARA-safe response — no model tokens spent.
2. **Layer 2 — cumulative-buffer post-filter on the stream.** The transform stream accumulates the model output and re-scans on every chunk so a forbidden token split across chunks ("vi"+"sa") still gets caught.
3. **Layer 3 — audit row.** Every block writes a `mara_deflections` row with the user message + the trigger phrase + session_id. Full legal audit trail in Supabase Studio.

### "Where's PII redaction in logs?"
**Phase 5.5, shipped this morning. Three layers in `lib/logger.ts` + `lib/logger-redact.ts`:**
- Layer A — `REDACT_PATHS` allowlist of known PII keys (email, phone, full_name, etc.)
- Layer B — `censor` function replaces values with `[Redacted]`
- Layer C — recursive walker (`redactWalk`) catches keys the path list doesn't enumerate (e.g. `emailAddress` instead of `email`)
- Sentry `beforeSend` hook scrubs the same paths from issue payloads
- Smoke test (`web/scripts/smoke-logger.ts`) verifies end-to-end

### "What's the cost per chat turn?"
**~$0.001 per turn** at gpt-4o-mini, capped at 350 input tokens + 250 output tokens. **100 turns/day = $0.10.** Embedding cache means repeat queries skip the Gemini call after the first hit. Free path stays available via env-var swap if you want to pin to $0 for staging.

### "What if the chat goes down mid-demo?"
**Vercel SLA + Sentry alerts.** The `/api/chat` catch path returns a MARA-safe SSE deflection stream — the user sees a graceful fallback ("That's a migration question and I'm not licensed to answer it…"), not an error envelope. We swap from a JSON-503 to an SSE stream specifically so the client UI keeps rendering normally.

### "How do you handle empty database, dropped connection, AI hallucination?"
- **Empty database:** RPC returns no rows → `noHits:true` flag in messageMetadata → system prompt tells the model to defer to `/consult` rather than fabricate.
- **Dropped connection:** stream is async; client reader handles partial reads, banner offers retry.
- **AI hallucination on uni names:** the system prompt ONLY contains retrieved course names; if the model mentions an uni not in the retrieved set, post-filter doesn't catch that today — that's why every chat turn writes `retrieved_course_ids` to `chat_messages`. Human review queue, not a runtime block.

### "Mobile?"
**Expo build is live with Sentry wired.** Branding still reads as `UniMate-demo` template. **Phase 7 brand pass is roughly 1 day, scheduled this week.** Native iOS/Android store submission needs Apple Dev account + Play Console — separate 3-7 day clock.

### "Is the matcher actually MARA-safe? What about the recommendation itself?"
**Recommendation is pure SQL, not AI.** It cannot generate migration advice because it cannot generate text — it ranks rows from the `universities` + `courses` tables by score. Whatever it returns is a database row, not a model output. This is the cleanest MARA posture available — the regulated activity (advice generation) and the recommendation activity are separated by a SQL function, not a prompt.

### "Tests?"
**Today:** typecheck (`npx tsc --noEmit`) clean, smoke tests per phase, manual QA per phase, Gideon code review verdict per phase. **Phase 9:** Playwright e2e (lead form → matches → chat → deflection). Happy to bring Phase 9 forward if priority.

### "Vendor lock?"
- **Postgres** = `pg_dump` to AWS RDS / Cloud SQL / Neon
- **Sentry** = optional, opt-in via `SENTRY_DSN`
- **AI** = env-gated providers (`CHAT_MODEL`, `SOP_MODEL`, `CHAT_SIMPLE_MODEL`)
- **Auth** = standard JWT
- **Hosting** = Next.js standalone output runs on any Node host
- The only honest bind is the matcher RPC's pgvector dependency — but pgvector runs on RDS, Cloud SQL, and Neon natively.

### "Why Next.js 16 and not stable 15?"
**16 has Cache Components (PPR)** which is critical for the lead form's progressive draft persistence + the matches page's Suspense streaming pattern. Sentry SDK 10.50+ supports 16 — checked peer-deps before we started.

### "Why no Sydney IT result on the chat for some queries?"
**Threshold 0.65 cosine similarity** — by design, the chat defers honestly when no row clears the bar rather than fabricate. The matcher widget on the landing page uses a richer client-side dataset (32 unis incl. 6 Sydney unis with IT) — Sydney IT surfaces there immediately. Chat corpus expands as Phase 8 backfills 17 → 43 unis. **The compliance posture (defer rather than fabricate) is a feature, not a bug.**

### "Privacy Act / MARA compliance?"
- APP 5 collection notice live on lead form (`web/src/components/lead/Step5Contact.tsx`)
- MARA disclaimer in site top-banner + footer + per-chat-turn footer
- CI grep gate enforces zero migration-advice strings in source
- Encryption at rest attested via Supabase
- Sydney region (`ap-southeast-2`) — no cross-border data leaving Australia
- `mara_deflections` audit log, `chat_messages` transcript, `chat_dataset_gaps` improvement queue — all queryable

### "Source code ownership?"
**Your repo from day one.** Standard handover. Phase 9 includes README + architecture doc + handover pack + ops runbook.

### "How do we add a new university post-launch?"
**INSERT into `universities` + INSERT N rows into `courses`** + run `web/scripts/backfill-course-embeddings.ts --apply`. ~2 minutes per university. CSV importer is queued for Phase 8.

---

## QUESTIONS TO ASK CLIENT

1. **Analytics:** Supabase Studio queries (ships now, free, requires SQL fluency) **or** custom `/admin/analytics` page (~1 day, non-technical staff can use it)? **← The one decision needed today.**
2. **Auth:** Stick with Supabase magic link or swap to better-auth before launch?
3. **Phase 6 priority:** SOP generator UI vs mobile rebrand — which ships first?
4. **University dataset:** Are you providing the 26-uni backfill data (CSV with CRICOS codes), or do you want us to source from the public registry?
5. **Production AI model:** stay on gpt-4o-mini (current paid pin), or move to Sonnet 4.6 for higher quality?
6. **Domain + branding:** Atlas AI as final name, or rebrand?
7. **Launch deadline:** what date are we targeting handover?
8. **Maintenance:** post-launch support model — retainer, ad-hoc, or full handover?

---

## RED FLAGS (be honest if asked)

- SOP generator UI ships this week (~6h focused work, scheduled tomorrow). Backend, schema, versioning, deflection guards all live.
- 17 universities seeded — backfill to 43 held until brand identity locked.
- Mobile app brand pass still pending (Phase 7, ~1 day this week).
- No e2e suite (Phase 9 — Playwright).
- Analytics dashboard not built — open decision today.

---

## IF YOU FORGET ONE THING

**The recommendation engine is SQL, not AI.** That single line answers half their concerns about black-box agents, scalability, ML readiness, and code ownership. Lead with it.

---

## LOGISTICS

- **Meeting link:** https://meet.google.com/ocv-rmvt-dgt
- **Time check before joining:** `TZ=Australia/Sydney date`
- **Pre-flight (do at 3:25pm):** open unimate-demo.vercel.app + /chat, run a sample query, confirm both load
- **Last commit:** see `git log --oneline -5` in `~/Desktop/atlas-ai/` (Phase 5.6 hardening commits pushed pre-meeting)

---

*Pin this tab in your browser during screen share. Glance, don't read. Lean on the demo script for the click-by-click.*
