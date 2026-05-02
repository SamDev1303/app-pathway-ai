You are Specter — stateless P2 plan-check adjudicator for Pathway-AI. Gideon (Codex gpt-5.4-mini) is running parallel review. Return compact independent verdict (150-300 words, markdown).

## P2 context

Pathway-AI phase 2 scope: "Supabase Auth magic link" per PRD §4 architecture stack. V1.1–V1.4 modules don't require user login — app is anonymous by design. P2 was debated for scope (admin dashboard cut to v2), Koda pushed back, Sam directed: build as INFRASTRUCTURE ONLY (no admin page yet, just wire the auth plumbing).

## Commit 809d7dc delivered

### Files added (web/ workspace, Next.js 16 App Router)
- `src/lib/supabase/client.ts` — `createBrowserClient(URL, ANON_KEY)` for client components
- `src/lib/supabase/server.ts` — `createServerClient(URL, ANON_KEY, { cookies: { getAll, setAll } })` using next/headers
- `src/lib/supabase/middleware.ts` — `updateSession(request)` helper: refreshes session cookies, calls `supabase.auth.getUser()` to force token refresh, returns supabaseResponse unchanged (matches current Supabase SSR doc exactly)
- `middleware.ts` at web/ root — invokes updateSession, matcher excludes static/image/favicon
- `src/app/auth/callback/route.ts` — GET handler: extracts `token_hash` + `type` from URL, calls `supabase.auth.verifyOtp({ type, token_hash })`, redirects to `next` param or `/` on success; `/auth/auth-code-error` on failure
- `src/app/auth/auth-code-error/page.tsx` — friendly error page with "Request a new link" CTA
- `src/app/login/page.tsx` — client component with email input, calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } })`, displays "check your email" confirmation state

### Supabase config applied via Management API
- site_url: `https://pathway-ai.vercel.app`
- uri_allow_list: `http://localhost:3000/**,https://pathway-ai.vercel.app/**,https://pathway-ai-*.vercel.app/**` (dev + prod + preview)
- External email enabled, 1-hour OTP expiry

### Design choice (KEY POINT for review)

**Anonymous-first, NO redirect in middleware.** Supabase official SSR example redirects unauthed users to /login. We do NOT. Rationale: PRD V1.1–V1.4 specify anonymous UX (students chat + match + SOP + lead-capture without login). Middleware just refreshes session cookies when present; routes opt-in to auth checks. This is deliberate deviation from the stock Supabase template.

### Verification
- `npm run build`: compiled clean, 3 new routes + Proxy Middleware shown
- `tsc --noEmit`: zero errors (pre-existing FormEvent deprecation in unrelated file)
- Admin API generate_link test: HTTP 200, valid action_link + hashed_token; test user deleted; auth.users back to 0

## Your output (150-300 words, markdown only)

## Verdict: APPROVE / APPROVE-WITH-NOTES / BLOCK

## Correctness vs current Supabase SSR patterns
(Is our getAll/setAll cookie handling right? Is auth.getUser() called immediately after createServerClient in middleware? Is verifyOtp the right method for magic link?)

## Security
(Cookie handling secure? Any session fixation or CSRF concerns? uri_allow_list scoped tight enough?)

## Scope alignment
(Is "infrastructure only" appropriate for P2 given PRD §4 lists auth as a stack requirement but V1.1–V1.4 don't use it? Or should P2 have built something user-facing?)

## Known gaps acceptable?
(No admin page, no @me profile, middleware doesn't redirect. Acceptable?)

## Ready to close P2? yes/no
## Ready to start P3 (lead capture)? yes/no
