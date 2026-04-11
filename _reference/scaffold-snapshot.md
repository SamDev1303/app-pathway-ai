# Pre-Redesign Scaffold Snapshot

**Date archived:** 2026-04-11
**Reason:** Sam rejected the generic SaaS-template feel. Full redesign. Scaffold deleted; this file is the audit trail of what existed before the rebuild.

## What the scaffold shipped

```
unimate-workspace/
├── web/
│   ├── unimate-website.html       (998 lines — single-file landing page, no backend)
│   └── unimate-website 2.html     (duplicate copy)
├── app/                           (Expo RN — partial)
│   ├── app/_layout.tsx            (26 lines — root stack only)
│   ├── app/(tabs)/_layout.tsx     (bottom tab bar)
│   ├── app/(tabs)/index.tsx       (Home)
│   ├── app/(tabs)/match.tsx       (UniMatch)
│   ├── app/(tabs)/chat.tsx        (AI Advisor)
│   ├── app.json
│   ├── eas.json
│   └── package.json
├── docs/                          (10 files)
│   ├── ARCHITECTURE.md · API.md · SETUP.md · PRIVACY.md · ROADMAP.md
│   ├── DEPLOYMENT.md · CONTRIBUTING.md · MOBILE.md · APP_STORE_CHECKLIST.md
│   └── DATABASE.md
├── .env.example
├── CLAUDE.md
└── README.md
```

## Modules completed (scaffold)
- Landing page hero, feature grid, static CTA form — no backend wiring
- 3 of 5 RN tabs (Home, UniMatch, AI Chat) styled with brand tokens but no data
- SOP Generator tab — missing
- Profile tab — missing

## Modules NOT completed (scaffold)
- No `/api/leads`, `/api/chat`, or `/api/unimatch` endpoints (static HTML)
- No Supabase schema or wiring
- No OpenAI chat integration
- No seed university data
- No lead form validation or submission path
- No match engine scoring code
- No deployment (never pushed to Vercel)

## Why redesigned from scratch
- Generic SaaS-template aesthetic: dashboard-style cards, white buttons, centered headlines. Fails the Ashika.com.au design bar (per MEMORY.md).
- Single-file HTML can't host `/api/*` routes required by PRD.
- Docs were LLM-generated from PRD — derived noise, no new signal. Rebuild uses the PRD as the sole source of truth.

## Reusable ideas (kept as inspiration only)
- Brand token names (navy/gold/bg) — mirrored exactly into new Tailwind config.
- Bottom tab structure (5 tabs) — kept; screens fully rewritten.
- Lead form field list — kept; UX completely redesigned as 4-step modal with Framer Motion.
