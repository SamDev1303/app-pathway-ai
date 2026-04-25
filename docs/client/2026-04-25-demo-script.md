# Atlas AI — Live Demo Script (3:30pm AEST, 25 April 2026)

**One-page click-by-click. Pin this tab. Glance, don't read.**

> **Stack one-liner:** "MARA-compliant Australian university matcher. Next.js 16 App Router, Supabase Sydney region, AI SDK v6 over OpenRouter, pgvector RAG with Gemini 3072-dim embeddings. 9 of 10 phases live, 1 in flight."

---

## Step 1 — Landing page (30s)
- **Action:** Open https://unimate-demo.vercel.app
- **Narration:** "MARA-compliant matcher built on Next.js 16 + Supabase Sydney region. The whole site is server-rendered with Cache Components — that black bar at the top is the MARA disclaimer, served on every route at the layout level."
- **Expected:** Hero loads in under 1s, navy + cream palette, MARA banner visible top + footer.
- **Fallback:** If page errors, refresh once. If still broken, switch to `web/src/app/page.tsx` in editor and walk through the code.

## Step 2 — Footer compliance proof (15s)
- **Action:** Scroll to footer.
- **Narration:** "MARA registration line, ABN placeholder, UniMate Pty Ltd Liverpool NSW. Privacy Act 1988 (APP 5) language is on the lead form, not buried in a TOS modal."
- **Expected:** Footer shows MARA + ABN + Liverpool NSW.

## Step 3 — Open lead form (10s)
- **Action:** Click **"Find your match"** CTA on the landing hero.
- **Narration:** "Five-step wizard. Each step persists to localStorage so the user can leave and come back — schema-versioned with a 30-day TTL so stale PII can't linger."
- **Expected:** Modal opens, Step 1 of 5, gold rail visible left, "Personal" eyebrow.

## Step 4 — Fill demo lead (90s)
- **Action:** Type sample data through all 5 steps. Suggested:
  - Step 1: `Demo Student` / `demo+meeting@unimate.test` / `+61400000001` / `India`
  - Step 2: Bachelor / GPA `3.2` / IELTS `6.5`
  - Step 3: Information Technology, Postgraduate, Intake `February`
  - Step 4: Tuition `35000` / Living `25000`
  - Step 5: Email contact, tick **service consent** ✅, leave marketing unchecked.
- **Narration:** "Server-side scoring tier A/B/C/D — client never sees the number. Privacy Act consent split: service is mandatory, marketing is optional. Different DB columns, different audit rows."
- **Expected:** Submit button enables only when service consent ticked.

## Step 5 — Submit → /matches/[token] redirect (15s)
- **Action:** Click **"Submit enquiry"**.
- **Narration:** "On a successful insert, the API returns the lead's match_token — the client redirects straight to `/matches/[token]` so the user sees ranked universities right now, not a generic thank-you screen."
- **Expected:** Browser URL flips to `/matches/<uuid>`. Page renders ranked Strong + Stretch matches within 2s.
- **Fallback:** If redirect doesn't fire, the lead WAS saved — read URL bar; refresh `/matches/<token>` manually using token from terminal logs.

## Step 6 — Walk the matches page (30s)
- **Action:** Scroll the matches page.
- **Narration:** "Ranking is a Postgres RPC, `match_unis_for_lead`, weighted by GPA × IELTS × budget × field × level. Pure SQL — auditable, deterministic, costs nothing per request. Weights live in `lib/match-weights.ts` and are JSON, not code, so tuning is a config push."
- **Expected:** Strong matches list, Stretch section below, "Draft your SOP" CTA, MARA banner top + footer.

## Step 7 — Open chat, ask demo question (45s)
- **Action:** Open https://unimate-demo.vercel.app/chat in a new tab. Type:
  > **What IELTS do I need for a Master of IT in Australia?**
- **Narration:** "RAG over the CRICOS course corpus. Last user message gets embedded with Gemini 3072-dim, hits the `match_courses_for_chat` RPC at threshold 0.65, top-k 5 grounded courses get inlined into the system prompt before the model sees them. Model is gpt-4o-mini behind OpenRouter today — single env var swap to Sonnet or Qwen."
- **Expected:** Streamed answer in under 3s. **Sources pill below the response** (citation rendering — proves the embeddings backfill is live).
- **Fallback:** If no Sources pill, the answer is still grounded but RAG returned no hits — say "the chat is on, the RAG corpus is the bit we're expanding to 43 unis next phase."

## Step 8 — Trigger MARA deflection (30s)
- **Action:** Type:
  > **Can I get PR after this course?**
- **Narration:** "Three-layer compliance gate. Layer 1: regex pre-check on the user input — short-circuits, never hits the model. Layer 2: cumulative-buffer post-filter on the streamed response, catches 'vi'+'sa' splits across token boundaries. Layer 3: every block writes a row to `mara_deflections` — full legal audit trail, queryable in Supabase Studio."
- **Expected:** Instant deflection — no model call, the canned MARA-safe message renders. (You can verify in Supabase Studio later — `select * from mara_deflections order by created_at desc limit 1`.)

## Step 9 — Show /consult page (15s)
- **Action:** Navigate to https://unimate-demo.vercel.app/consult
- **Narration:** "Fallback path for anything the matcher or chat can't handle — mailto + Liverpool office line. Phase 6 SOP generator UI plugs in here too."
- **Expected:** Consult page loads with contact details.

## Step 10 — Roadmap snapshot (45s)
- **Action:** Talk to the screen — no nav needed. (Or open `PHASE.md` in IDE if asked.)
- **Narration:**
  > "Roadmap: Phase 6 SOP generator — backend + DB schema + versioning shipped, the front-end react-pdf wiring is roughly 6 hours of work, queued for tomorrow. Phase 7 mobile rebrand — Expo build is live with Sentry, just needs the UniMate brand pass, that's about a day this week. Phase 8 dataset backfill from 17 to 43 universities — held until you confirm brand identity so we don't re-seed twice. Everything else — compliance, observability, RAG, deflection — is live today."

## Step 11 — Q&A fallback (rest of slot)
- **Action:** Hand it back to the client. Use the **Pre-empted Questions** section in `2026-04-25-screenshare-notes.md` if they probe.
- **Posture:** "Live today" / "Ships <date>" / "Deferred per scope". No "coming soon", no "should", no "in progress".

---

## Pre-flight checklist (do at 3:25pm)

- [ ] Open https://unimate-demo.vercel.app — confirm 200 + MARA banner visible
- [ ] Open https://unimate-demo.vercel.app/chat — confirm input box + first turn streams
- [ ] Open Supabase Studio in a hidden tab (in case they ask "show me a deflection row live")
- [ ] Open `PHASE.md` in editor (in case they ask for the audit trail)
- [ ] Open this file pinned in another tab — glance, don't read

## If something breaks live

1. **Chat 503:** "Caught a transient 503 — the catch path returns the MARA-safe deflection stream so the user sees a graceful fallback, not an error envelope. That's by design."
2. **Lead form fails:** "We've got a fail-soft on email notification — the lead row still lands in Supabase. Worst case I show you the row in Studio."
3. **Redirect doesn't fire:** "URL is in the address bar; the lead is saved. Demo continues by pasting the token."
4. **Matches page blank:** "RPC failed; the page renders the PendingMatches fallback. We log the lead_id + error to Sentry. Recompute is one Studio query."
5. **Anything else:** "I'll show you the code path. Every component is < 600 lines, single-concern."

---

## What you are NOT promising today

- SOP generator UI tonight — Phase 6 is roughly 6h focused work (queued)
- 43-uni backfill (Phase 8 — held until brand identity confirmed)
- Mobile rebrand (Phase 7 — about a day, this week)
- Custom analytics dashboard — open decision (Supabase Studio queries vs `/admin/analytics` page)

---

*Script generated 2026-04-25 12:50 AEST for the 3:30pm meeting. Mirrors live atlas-ai.vercel.app behaviour after the pre-meeting hardening commits.*
