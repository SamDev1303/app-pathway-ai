# Meeting Notes — Atlas AI Product Architecture & Execution Alignment

**When:** 2026-04-24, 5:00–5:30pm IST (9:30–10:00pm AEST)
**Link:** https://meet.google.com/ocv-rmvt-dgt
**Audience:** Client (wrote the 10-item agenda — technical, burned-by-previous-vendor flavour)
**Doc sent 30min before:** `CLIENT-STATUS.md`

---

## Telegram pre-meeting paste (send 30min before)

```
Before we jump on — one-pager mapping your agenda to current state:
github.com/[repo]/atlas-ai/blob/main/CLIENT-STATUS.md

TL;DR: 6 of 10 items shipped, 3 open decisions I need your call on:
1. Analytics: Supabase Studio now → custom UI in P8, or custom now?
2. better-auth: swap now (1–2d) or P8?
3. P6 SOP generator vs P7 mobile rebrand — sequential or parallel?

Rest is detail + grep-able evidence. See you at 5.
```

---

## Speaker notes (30-min meeting)

### 00:00–02:00 — Frame the conversation
- Thank them for the agenda, it's the most specific one I've seen
- "I took your 10 items and mapped each to current state. 6 shipped, 3 are open decisions I want your call on today, 1 is an honest gap I'll close this week."
- Don't read the doc at them. They've read it.

### 02:00–10:00 — Walk the architecture (§3)
- One-line stack: Next.js App Router on Vercel → `/api/*` → Supabase Postgres Sydney with pgvector
- "No agent chaining" — lean into this. One `/api/chat` route, deterministic deflection filter, no LangChain.
- Show `web/src/lib/` tree — 19 single-purpose files. Point: "if you open any one of these you understand it in 5 minutes."
- Show `SOURCECODE.md` — route table with accuracy rule. Point: "this document can't drift because commits fail review if they don't update it."

**If they push on "how do I know it's actually modular":** open `match-weights.ts`. Show it's a single object. Changing recommendation logic = editing one file.

### 10:00–15:00 — MARA compliance differentiator (§2, §9)
- Walk the dual audit tables: `mara_deflections` + `chat_dataset_gaps`
- "Every time the bot refuses to answer a visa question, we log it. Every time it says 'I don't have that data', we log it. That's both compliance and product signal."
- Dual-seat review: "Two independent reviewers sign off per phase. No one-person YOLO merges."

**This is where they'll relax.** The agenda reads like someone who got burned by a vendor shipping agent slop. Show them the governance IS the product.

### 15:00–22:00 — The 3 open decisions (§5, §6, §8)

**1. Analytics dashboard** — "Three paths: Supabase Studio today (free), custom `/admin/analytics` page (~3h), or Metabase bolt-on (1 day). My recommendation: Studio now, custom in P8. Your call?"
- *Listen.* If they say "custom now", ship in P6 alongside SOP.

**2. better-auth swap** — "I shipped Supabase Auth magic link to unblock P3–P5. Swap to better-auth is 1–2 days, isolated to one package, zero user data migration because it's all standard JWTs. Want it now or P8?"
- *Don't defend Supabase Auth.* If they want better-auth, say "fine, P8 item, logged."

**3. P6 vs P7 ordering** — "Mobile rebrand has 3–7 day Play Store review latency. If you want mobile in the final ship, I should start P7 in parallel with P6 this week."
- *Bias to parallel.* It's the right call.

### 22:00–26:00 — Honest gaps
- No pino/winston app logger yet — shipping this week, ~1h work
- No Sentry — shipping this week, ~20min
- 12/43 unis seeded — P8 backfill
- CRICOS codes incomplete on subset — same P8

**Do not oversell.** These are small, cheap gaps. Owning them = credibility.

### 26:00–29:00 — Their turn
- "What's missing from this picture?"
- "What's your definition of 'done' for P6 SOP generator?"
- "Who else on your side reviews the handover pack?"

### 29:00–30:00 — Close
- "Expect `CLIENT-STATUS.md` updated after this call with your decisions logged. P6 plan-check kicks off tomorrow morning my time."
- Commit to a weekly Friday checkpoint.

---

## Things NOT to say

| Don't | Why |
|---|---|
| "We can absolutely do anything you want" | Sounds like agency-speak, triggers their burned-by-vendor trauma |
| "It's fully AI-powered" | They wrote "over-reliance on AI agents" as a red flag. Frame AI as a *component*, not the product. |
| "We're using the latest and greatest [X]" | They asked for "no vendor lock-in". Latest ≠ trustworthy. |
| "Don't worry about [X]" | Never dismiss a concern. Engage it. |
| Quoting new scope/price on the call | Let them ask. If they propose scope, say "let me cost it and send by EOD tomorrow." |

## Things to say (verbatim-ish)

- "That's a good question — let me show you in the code." (Then actually do it.)
- "Deliberately deferred to P8 because [reason]." (Shows it's a decision, not an oversight.)
- "Your call." (Puts the pen in their hand on the 3 open items.)
- "Fair." (When they push back legitimately. Don't defend ego.)

## If asked something you don't know

"Don't have that in my head right now — let me check the code and send by EOD." Never guess. They'll test for this.

## Post-meeting (same night, before closing out)

1. Update `CLIENT-STATUS.md` §"What I want your call on" with their answers
2. Write `_reference/client-handover/MEETING-2026-04-24-decisions.md` — one file per call
3. Telegram Sam self-summary: "Client said [X] on analytics, [Y] on better-auth, [Z] on parallel. P6 plan-check dispatches tomorrow."
4. `/gsd-discuss-phase 6` can run while you sleep if decisions unblock it

---

## Evidence cheat-sheet (for if they drill in)

| If they ask | Open |
|---|---|
| "Where's the recommendation logic?" | `web/src/lib/match-weights.ts` + `matcher.ts` + migration `004_match_function.sql` |
| "Show me the MARA audit" | `supabase/migrations/008_chat_audit.sql` + `web/src/lib/chat-deflection.ts` |
| "How modular is the lib?" | `ls web/src/lib/` — 19 files, each under 200 LOC |
| "How do I know commits map to phases?" | `git log --oneline | head -20` — every one has `phase-N` prefix |
| "How's the dataset updated?" | `supabase/migrations/001_initial_schema.sql` → new migration per update |
| "Where's user tracking?" | Migrations 008 + 009 — chat_sessions, chat_messages, mara_deflections, chat_dataset_gaps |
| "What's the Next.js version?" | `web/package.json` — Next 16 App Router |
| "Is there a test suite?" | Honest answer: typecheck is the quality gate; no test framework yet. P9 item. |
