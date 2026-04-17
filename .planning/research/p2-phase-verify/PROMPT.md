# P2 Phase-Verify — Supabase Auth magic link infrastructure

**Repo:** `~/Desktop/atlas-ai`
**Commit:** `809d7dc feat(phase-2): Supabase Auth magic link infrastructure`
**Plan-check (both seats PASS):** Gideon APPROVE-WITH-NOTES (note: prefer getClaims() over getUser() — non-blocker) + Specter APPROVE-WITH-NOTES
**Reviewer role:** NO CODE WRITING. REVIEW ONLY. ONE OUTPUT FILE.

## Phase-verify question (goal-backward)

**Does P2 deliver the auth infrastructure PRD §4 requires, without blocking the anonymous-first UX?**

## 8-item P2 phase-verify checklist

1. **Package installed** — `@supabase/ssr` in web/package.json
2. **Browser client factory** — `createBrowserClient` in `src/lib/supabase/client.ts`
3. **Server client factory** — `createServerClient` with getAll/setAll cookie bridge in `src/lib/supabase/server.ts`
4. **Middleware session refresh** — `updateSession()` helper calls `supabase.auth.getUser()` immediately, returns `supabaseResponse` unchanged
5. **Middleware NO redirect** — anonymous-first design intact; does not force unauthed users to /login
6. **Callback route** — GET `/auth/callback` extracts `token_hash` + `type`, calls `verifyOtp()`, redirects to `next` param as `pathname` only (no open-redirect)
7. **Login page** — client component with email input, calls `signInWithOtp({ email, options: { emailRedirectTo } })`, shows "check your email" confirmation
8. **Supabase config** — site_url + uri_allow_list applied via Management API; external_email_enabled; 1-hour OTP expiry
9. **Build + typecheck** — `next build` + `tsc --noEmit` both clean
10. **Magic link generation tested** — Admin API `/auth/v1/admin/generate_link` returns valid action_link; test user deleted

## Output

Write ONE markdown file to `.planning/research/p2-phase-verify/{AGENT_NAME}-v1.md`:

- **Verdict:** PASS / PARTIAL / FAIL
- 10-item table (status + evidence)
- Ready to close P2? yes/no
- Ready to start P3 (lead capture)? yes/no
- Any issues for P3-P5?

## DO NOT

- Modify files
- Output more than ONE file
- Take longer than 5 minutes
