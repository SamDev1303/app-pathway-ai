# P5 — AI Advisor Chat + basic RAG

See session transcript for full plan. Summary:

## Waves shipped

- **Wave 0** (commit `0e0c26b`) — migrations 007 (course_embeddings + RPC), 008 (mara_deflections, chat_dataset_gaps), 009 (chat_sessions, chat_messages + FK backfill). All service-role RLS.
- **Wave 1** (commit `c44c621`) — `web/scripts/backfill-course-embeddings.ts` (Gemini 3072-dim, batch 10 × 2s sleep). Local run deferred pending keys.
- **Wave 2** (commit `88508e0`) — `/api/chat` RAG: embed last user msg → RPC → inject `<retrieved_courses>`/`<no_hits/>` system context. Model swap → `qwen/qwen3-next-80b-a3b-instruct:free`. `CHAT_PROVIDER` env gate. Inline prompt dupe deleted; imports from `chat-system-prompt.ts`.
- **Wave 3** (commit `2507bb1`) — belt-and-braces deflection. Pre-check short-circuits user input via `scanForDeflection`. Post-filter `experimental_transform` swaps offending assistant `text-delta`s + calls `stopStream()`. `mara_deflections` audit insert. `chat_dataset_gaps` fire-and-forget when zero hits.
- **Wave 4** (commit `2fccc41`) — `chat-session.ts` issues `atlas_chat_session` httpOnly cookie, creates/refreshes `chat_sessions`, links `lead_id` if `atlas_lead` cookie present. `chat_messages` user + assistant persistence with `retrieved_course_ids` + `deflected` flag.
- **Wave 5** (commit `01a1d82`) — `@upstash/ratelimit` sliding window 10/min IP + 50/hr session + 200/day global. Fail-open when env not wired. 429 streams Calendly CTA without model call.
- **Wave 6** (this commit range) — shared `ChatClient` component, `SourcesPill` expandable citations, `/chat` page (Suspense-wrapped for PPR), `ChatDrawer` delegates to `ChatClient`, Hero CTA now links `/chat`.
- **Wave 7** (this commit) — MARA gate patterns verified locally (zero hits), `pnpm build` passes, STATE.md sign-off.

## Verification status

- `pnpm build` — PASS (Next.js 16.2.3 Turbopack, 13 routes including `/chat`).
- MARA gate patterns locally clean (fake-identifier + affirmative-advice).
- Backfill + Upstash env provisioning require Sam's paid-key unlock (post-meeting).
- Gideon single-seat phase-verify — deferred to Sam's dispatch (Rule 11 mandatory).

## Env required before production launch

- `GOOGLE_AI_KEY` — Gemini embeddings (`gemini-embedding-001`, 3072-dim).
- `OPENROUTER_API_KEY` — Qwen3 Next 80B free (or swap `CHAT_PROVIDER=anthropic-gateway`/`openai-gateway`).
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — rate-limit (fail-open without).
- `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` — RAG RPC + chat persistence + audit.

## Manual smoke (post-env)

1. Apply 007/008/009 via `supabase db push`.
2. Run `pnpm tsx scripts/backfill-course-embeddings.ts --apply` → verify `select count(*) from course_embeddings` matches courses count.
3. `/chat` loads, drawer still works on `/`.
4. "what MBA courses are at Sydney?" → grounded answer + Sources (N) pill.
5. "what visa do I need for 485?" → deflection (pre-check), `mara_deflections` row inserted.
6. Unknown uni → no-hit fallback + `chat_dataset_gaps` row.
7. 11 rapid requests → 429 + Calendly CTA.

