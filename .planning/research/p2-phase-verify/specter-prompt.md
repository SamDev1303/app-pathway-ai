You are Specter — stateless P2 phase-verify adjudicator. Gideon is running parallel. Return a compact independent verdict (200-400 words, markdown).

## P2 delivery summary (commit 809d7dc)

Plan-check (both seats APPROVE-WITH-NOTES):
- Gideon: correct SSR patterns, secure callback, infrastructure-only scope right, P3 ready; single note: prefer `auth.getClaims()` over `auth.getUser()` per latest docs
- Specter: same verdict

## 10 items to verify against the repo

1. `@supabase/ssr` in `web/package.json` dependencies
2. `createBrowserClient` exported from `src/lib/supabase/client.ts`
3. `createServerClient` with `cookies.getAll/setAll` in `src/lib/supabase/server.ts`
4. `updateSession(request)` in `src/lib/supabase/middleware.ts` — calls `supabase.auth.getUser()` immediately after creating server client
5. Middleware does NOT redirect (deliberate design — anonymous-first)
6. `src/app/auth/callback/route.ts` uses `verifyOtp({ type, token_hash })`, redirects via `pathname` (not full URL — no open redirect)
7. `src/app/login/page.tsx` uses `signInWithOtp({ email, options: { emailRedirectTo } })`, shows success state
8. Supabase config applied: site_url + uri_allow_list (covering localhost + pathway-ai.vercel.app + preview branches), external_email_enabled, 1h OTP expiry
9. Build + typecheck both clean
10. Magic link generation tested via Admin API — test user created + deleted, auth.users back to 0

## Your output (200-400 words, markdown)

## Verdict: PASS / PARTIAL / FAIL

## 10-item table
| # | Status | Evidence |
|---|---|---|
(Complete all 10 rows. PASS/PARTIAL/FAIL + brief evidence from the delivery summary.)

## Ready to close P2? yes/no
## Ready to start P3? yes/no
## Issues for P3-P5 to watch?
(0-3 bullets)
