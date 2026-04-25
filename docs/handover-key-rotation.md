# Handover Key Rotation Tracker

**Purpose:** Every secret currently in production was provisioned from Sam/ClaudeKing personal accounts. On client handover, each must be rotated to a key the client owns and pays for, or transferred via account ownership.

**Last updated:** 2026-04-25 (during pre-meeting demo fix)

---

## Vercel Production Env Vars

| Env Var | Source today | Owner today | Action on handover | Failure mode if not rotated |
|---|---|---|---|---|
| `CHAT_MODEL` | label `openrouter/openai-mini` | n/a (not a secret) | Keep | None |
| `GOOGLE_AI_KEY` | `GEMINI_EMBEDDING_API_KEY` from `~/Desktop/api/KEYS.md` (Sam's Google AI Studio) | Sam | Client provisions own Gemini key in Google AI Studio under their workspace | RAG retrieval silently degrades to no-hits; chat still works |
| `OPENROUTER_API_KEY` | `~/Desktop/api/KEYS.md` (Sam's OpenRouter account) | Sam | Client opens OpenRouter account, generates key, swap | Chat returns SSE error frame "Provider returned error" — user-visible failure |
| `RESEND_API_KEY` | `~/Desktop/api/KEYS.md` (Sam's Resend account, claudeking.org domain) | Sam | Client opens Resend account, verifies their domain, generates key | Lead notification emails fail; admin gets nothing on new lead |
| `RESEND_FROM_EMAIL` | `noreply@claudeking.org` (likely) | Sam | Replace with client's verified sending address (e.g. `noreply@<client>.com.au`) | Emails sent with sender mismatch — Resend may bounce or send via shared pool |
| `ADMIN_NOTIFICATION_EMAIL` | likely Sam's address | Sam | Swap to client's intake address | Sam keeps receiving client's leads after handover |
| `SUPABASE_SERVICE_KEY` | atlas-ai project (Sam's Supabase org) | Sam | Either transfer Supabase project ownership OR provision a fresh project for client and re-run all migrations | Auth bypass to Sam's project — privacy + billing violation |
| `SUPABASE_SECRET_KEY` | same | Sam | same | same |
| `SUPABASE_PUBLISHABLE_KEY` | same | Sam | same | same |
| `SUPABASE_SERVICE_ROLE_KEY` | same | Sam | same | same |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | Sam | same | Public key — leak risk lower, but still tied to Sam's project URL |
| `NEXT_PUBLIC_SUPABASE_URL` | same | Sam | Update to client's Supabase project URL | All client data lives in Sam's project; client has no visibility |

---

## Recommended Handover Sequence

1. **Stand up client Supabase project.** Run all migrations. Backfill any production data via `pg_dump`/`pg_restore`. Repoint `NEXT_PUBLIC_SUPABASE_URL` + all SUPABASE_* keys.
2. **Switch OpenRouter to client account.** Client signs up, adds payment method, generates key. Swap `OPENROUTER_API_KEY`. Verify with `/api/chat` smoke test.
3. **Switch Gemini to client Google AI Studio.** Same pattern — verify by checking `/api/chat` response includes `noHits:false` for at least one query that should match RAG.
4. **Switch Resend to client domain.** Client verifies domain ownership in Resend (DNS TXT records). Generate key. Update `RESEND_API_KEY` + `RESEND_FROM_EMAIL`. Send a test lead and verify delivery.
5. **Swap admin email.** Update `ADMIN_NOTIFICATION_EMAIL`. Send a final test lead.
6. **Rotate all old keys** in Sam's accounts to revoke access. Document the date in this file.

---

## Rotation Log

_Add an entry every time a key is swapped:_

| Date | Env var | From owner | To owner | Verified by |
|---|---|---|---|---|
| 2026-04-25 | `CHAT_MODEL` (added) | n/a | n/a | curl /api/chat returns 200 SSE |
| 2026-04-25 | `GOOGLE_AI_KEY` (added — Sam's `GEMINI_EMBEDDING_API_KEY`) | Sam | Sam (pre-handover) | (pending) |
