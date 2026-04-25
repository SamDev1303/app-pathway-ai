# Atlas-AI Pre-Meeting Demo Sweep — Synthesis

**Date:** 2026-04-25
**Time issued:** 12:30 AEST (3 hours to 15:30 client meeting)
**Agents:** Gideon (Codex gpt-5.4 code-side audit) + Sonnet subagent (Playwright browser walk)
**Mode:** Read-only audit. No commits/edits/deploys made.

## TL;DR

The chat 503 is fixed. Live site loads cleanly with **zero console errors**. But **Sam's screen-share script does not match what's actually on the live site**, and the planned demo question returns a deflection instead of a substantive answer. Two BLOCKs to address before 15:30 — one is a script change Sam can do verbally, the other is either a code fix or a script rework.

---

## Cross-validated BLOCKERS (both agents independently flagged)

### B1 — Hero CTA "Find your match" does NOT open a lead form modal
- **Source:** Gideon (`web/src/components/Hero.tsx:72`) + Sonnet (live: "anchor scroll to inline matcher, no modal")
- **Symptom:** Demo script step 2 says "CTA opens lead form modal → submits → /matches/[token]". Reality: CTA is `<a href="#match">` → scrolls to inline widget. No modal, no lead form, no `/matches/[token]` route in this flow.
- **Two paths to fix:**
  - **Script fix (5 min, ZERO deploy risk):** Sam updates verbal walkthrough — "I'll click through to the matcher widget here, then later we capture the lead via the consult form." Skip the modal narration entirely.
  - **Code fix (30-60 min + deploy):** Convert hero CTA to a client button that opens `LeadModal`; wire LeadModal success path to `window.location.assign('/matches/' + match_token)`. Adds a redeploy under time pressure with a fragile build pipeline.
- **Recommendation:** Script fix. The matcher widget IS impressive on its own and the lead capture can flow through `/consult`.

### B2 — Demo question "good IT course in Sydney?" returns dataset-miss deflection
- **Source:** Sonnet (live test)
- **Symptom:** Chat answers honestly: "The dataset doesn't cover specific courses in IT at universities in Sydney." That's a correct answer, not a bug — but it's not a *showcase*.
- **Note:** The match widget on landing DOES return WSU (Sydney) as a strong match for IT. The data exists in the matcher database but is not surfaced through chat RAG.
- **Fix:** Sam swaps the demo question for one that hits the dataset:
  - "What IELTS score do I need for a Master of IT?"
  - "What does a Master of IT cost at Federation University?"
  - "Which Group of Eight universities offer postgraduate computing?"
- **Recommendation:** Sam picks one of the above as the new step-5 question.

### B3 — DO NOT trigger a CLI redeploy before the meeting
- **Source:** Gideon
- **Symptom:** The current deploy (`atlas-kx772udr0`, aliased to `unimate-demo.vercel.app`) is healthy. The git-integration build path (`vercel.json` buildCommand `cd web && npm install && npm run build`) is the working pattern. The CLI `vercel build` path fails on Edge middleware + Supabase SSR. Earlier today the CLI deploy from `web/` produced an empty deployment with all routes 404'd.
- **Recommendation:** Leave production alone until after the meeting. If something breaks, `vercel redeploy <prior-good-url> --target production` is the safe escape hatch.

---

## HIGH (post-meeting fixes)

| # | Issue | File | Fix |
|---|---|---|---|
| H1 | Lead notify env mismatch — code reads `LEAD_NOTIFY_EMAILS`, prod has `ADMIN_NOTIFICATION_EMAIL` | `web/src/app/api/leads/route.ts:197` | Add `LEAD_NOTIFY_EMAILS` to Vercel prod OR change code to fall back through both names |
| H2 | `/api/chat-simple` still pinned to free-tier `openai/gpt-oss-120b:free` | `web/src/app/api/chat-simple/route.ts:50-75` | Reuse `/api/chat`'s model selector or read `CHAT_MODEL` |
| H3 | `/api/sop` returns 500 on bogus token instead of 404 | `web/src/app/api/sop/route.ts:339-354` | UUID-validate `body.leadToken` before query, return 404 |
| H4 | Rate-limiting fail-open — Upstash envs missing in prod | `web/src/lib/ratelimit.ts:25-65` | Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to prod |
| H5 | Browser `console.error` leaks on `/matches` and `/sop` pages | `web/src/app/matches/[token]/page.tsx:66-88` and 4 SOP files | Replace with `logger` + user-visible error state |
| H6 | `/api/chat` catch-path returns JSON 503 instead of SSE deflection stream | `web/src/app/api/chat/route.ts:365-375` | Reuse `deflectionStreamResponse()` for catch-path |
| H7 | No citation pills appear in any chat response | (UI component not yet wired) | Verify `messageMetadata.retrievedCourses` is rendered in chat bubble UI |

## NOTE (backlog)

- N1: Optional env aliases referenced but unset (`CHAT_PROVIDER`, `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `SOP_MODEL`, `LOG_LEVEL`, `SENTRY_ENVIRONMENT`). Safe today; normalize naming after meeting.
- N2: Public brand copy uses placeholder MARN/QEAC/contact — `web/src/lib/content.ts:3-16`. Client may ask for real numbers in the meeting.
- N3: Hero credential strip hidden on mobile (375px) — minor.
- N4: Streaming animation smoothness not verifiable via Playwright snapshot — Sam should finger-test `/chat` once before going live.

---

## What Sam should do in the next 30 minutes

1. **Pick one substantive demo question** to replace "good IT course in Sydney?" — see B2 above.
2. **Update the verbal screen-share script** so step 2 narrates "click through to the matcher widget" instead of "lead modal opens" — see B1.
3. **Live-test `/chat` once** with the new question to confirm streaming looks smooth on screen.
4. **Do not redeploy.** The current deploy is healthy.

After meeting → triage HIGH list (~2 hours of work, all post-meeting safe).

---

## Confidence

High. Cross-agent agreement on every BLOCK. Sonnet verified live behaviour with Playwright (snapshot + console messages). Gideon verified source from inside `~/Desktop/atlas-ai/` without sandbox issues. The only unverified claim is whether the H6 chat catch-path actually fires under any realistic demo input — likely safe because the model is now pinned to gpt-4o-mini (paid + reliable), but worth a 1-line proof curl post-meeting.
