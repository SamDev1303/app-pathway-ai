# UniMate — Client Pitch

---

## Opening (casual)

Appreciate you making time.

So I've been building this thing called UniMate — basically for students landing in Sydney trying to figure out uni, housing, getting around. We've got a rough version running, web and iOS, wanted to show it to you and get your honest take.

It's early. Some stuff works, some stuff we're still figuring out. Happy to walk through it and hear what you reckon.

---

**What we've built:**
A working two-sided demo — a web site and a native iOS mobile app — that onboards international students arriving in Australia, matches them to university/accommodation/transport options, and captures leads in real time. This is a functional prototype, not a mockup. You can tap through it, it submits real data, and it runs on the same infrastructure we'd use in production.

**What it does:**
- Student-facing flow: guided intake, university matching, accommodation discovery, transport/travel help
- Lead capture: every high-intent signal lands in a dashboard for the agent or partner to action
- Mobile-first: built natively for iOS so it feels like an Australian app, not a website in a wrapper

**Tech stack:**
- **Mobile:** React Native + Expo (same stack used by Discord, Shopify, Coinbase)
- **Web:** Next.js + React, deployed on Vercel (the same CDN that serves OpenAI, Notion, Supabase)
- **Data + auth:** Supabase (PostgreSQL + row-level security, SOC 2 Type II certified)
- **AI layer:** Claude + Gemini models for the matching and summarisation logic

**Security — honest version:**
- Every request goes over HTTPS. No exceptions.
- Credentials live in a vault, never in code — we have a pre-commit hook that blocks any push containing an API key or token.
- User data sits behind Supabase row-level security, so even if someone got a read-only key they could only see their own row, not the whole table.
- We're not pretending we have enterprise-grade SOC 2 today — what we have is the clean foundation a SOC 2 audit would be built on, not the audit itself.

**The real part:**
We're new to building at this scale — I won't pretend otherwise. What's changed is that AI coding assistants like Claude are now good enough that a small team can ship production-grade software in weeks, not months. When we hit something we haven't done before, we learn it — we don't outsource it. That's why this demo exists at all, and that's why we can iterate on it in the call today if you want changes.

If there's a feature you want to see added or a flow you want changed, tell us on the call and we'll ship it this week.

---

## Closing (casual)

Yeah so that's pretty much it.

Honest answer — this isn't the finished thing. It's a working version we put together to show something real instead of talking about what we'd build.

If any of it looks useful, awesome. If there's something you'd actually use or something you'd want different — just tell us, no stress either way. We're not here to push anything. Just figured you'd give us a straighter take than most.

Cheers mate.


