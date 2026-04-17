# P2 Plan-Check — Supabase Auth magic link infrastructure

**Repo:** `~/Desktop/atlas-ai`
**Commit:** `809d7dc feat(phase-2): Supabase Auth magic link infrastructure`
**Reviewer role:** NO CODE WRITING. REVIEW ONLY. ONE OUTPUT FILE.

## What P2 delivered

- Installed `@supabase/ssr` (current Next.js SSR helper; replaces deprecated auth-helpers-nextjs)
- `web/src/lib/supabase/client.ts` — browser client (createBrowserClient)
- `web/src/lib/supabase/server.ts` — server client (createServerClient with cookies/getAll/setAll)
- `web/src/lib/supabase/middleware.ts` — `updateSession(request)` helper; cookies getAll/setAll with immediate auth.getUser() to refresh access token
- `web/middleware.ts` — Next.js middleware entry calling updateSession on every matched request
- `web/src/app/auth/callback/route.ts` — GET handler using `verifyOtp({ type, token_hash })` per current Supabase docs
- `web/src/app/auth/auth-code-error/page.tsx` — error page with "Request a new link" CTA
- `web/src/app/login/page.tsx` — magic link request form calling `signInWithOtp({ email, options: { emailRedirectTo } })`
- Configured via Management API: site_url + uri_allow_list + 1-hour OTP expiry
- Build + typecheck PASS

## Design choice to review

**Anonymous-first, no middleware redirect:** Supabase official example redirects unauthed users to `/login`. We do NOT — Atlas AI is anonymous per PRD V1.1–V1.4. Middleware refreshes cookies when present, no-op otherwise.

## Questions for review

1. **Correctness** — Does our implementation match the current Supabase SSR patterns? Any deprecated APIs or cookie handling bugs?
2. **Security** — Cookie handling correct? Any CSRF/session fixation issues?
3. **Scope alignment** — Is "infrastructure only" the right read of P2? Or should there be an admin page now?
4. **PRD consistency** — §4 includes Supabase Auth magic link. Is what we shipped enough to satisfy §4?
5. **P3/P4/v2 readiness** — Will P3 (lead capture) be able to use this auth context cleanly if needed? Will v2 admin dashboard (X.1) drop in without refactor?
6. **Known gaps** — No admin page, no @me profile — intentional. Acceptable for P2 close?

## Output

Write ONE markdown file to `.planning/research/p2-plan-check/{AGENT_NAME}-v1.md`:

- **Verdict:** APPROVE / APPROVE-WITH-NOTES / BLOCK
- Answers to the 6 questions
- Ready to close P2? yes/no
- Ready to start P3? yes/no

## DO NOT

- Modify files
- Output more than ONE markdown file
- Take longer than 5 minutes
