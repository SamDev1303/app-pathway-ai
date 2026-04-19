# SOURCECODE.md — Atlas AI Living Architecture

**Last updated:** 2026-04-20 00:55 AEST · P4 done (6-wave match engine shipped: migrations 003+004+005, `/matches/[token]` Server Component, Round-5 4-persona contract PASS, MARA grep clean)
**Update rule:** Every commit that adds/removes/renames files OR bumps a stack version MUST refresh this file in the same commit. See `CLAUDE.md` §3.

---

## Stack versions (pinned)

### Web (`/web`)
| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.3 | App Router, Server Components, Edge-ready |
| `react` | 19.2.4 | UI runtime |
| `@ai-sdk/openai` | 3.0.52 | OpenAI provider for AI SDK |
| `@ai-sdk/react` | 3.0.160 | `useChat` / streaming hooks |
| `ai` | 6.0.158 | AI SDK v6 core |
| `@supabase/supabase-js` | 2.103.0 | DB + auth client |
| `resend` | 6.10.0 | Transactional email |
| `framer-motion` | 12.38.0 | Landing animations |
| `lucide-react` | 1.8.0 | Icon set |
| `tailwindcss` | 4 (via `@tailwindcss/postcss`) | Utility CSS |
| `zod` | 4.3.6 | Runtime validation |

### Mobile (`/mobile`)
| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54.0.33 | Expo SDK |
| `expo-router` | (via SDK 54) | File-based routing |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local persistence |
| `@expo-google-fonts/instrument-serif` + `plus-jakarta-sans` | 0.4.0 | Typography |

Node engine: unspecified (uses system). Recommended: Node 20 LTS.

---

## Repo tree (top-level)

```
atlas-ai/
├── README.md                    ← product pitch + run/deploy
├── SOURCECODE.md                ← this file, living arch doc
├── PRD.md                       ← hard-cut v1 product spec
├── PHASE.md                     ← phase tracker + dual sign-off
├── CLAUDE.md                    ← governance rules for agents
├── RESUME.md                    ← how to continue the build next session
├── .gitignore
├── .vercel/project.json         ← projectId pinned; display → atlas-ai
├── .planning/                   ← GSD meta (STATE, PROJECT, config, research)
│   ├── PROJECT.md               ← meta pointer → root PRD/PHASE
│   ├── STATE.md                 ← current phase + blockers + next action
│   ├── config.json              ← fine/research/verifier flags
│   └── research/
│       └── p0-plan-check-2026-04-16/ ← Atlas/Gideon/Neo/Specter/minis artifacts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← P1 schema (universities/courses/leads/embeddings + RLS + pgvector)
├── web/                         ← Next.js 16 app (production surface)
│   ├── .env.example             ← P1 env template (Supabase/OpenAI/Resend/Make)
│   └── src/lib/universities-seed.ts ← 43 AU unis seed for P1
├── mobile/                      ← Expo SDK 54 app (light rebrand in P7)
└── _reference/
    ├── au-imagery-sources.md    ← AU university imagery sources
    ├── scaffold-snapshot.md     ← demo scaffold notes
    ├── client-handover/
    │   └── ATLAS-AI-SOW.md      ← SOW for UniMate (client-facing)
    └── archive/
        ├── STATE-2026-04-11.md       ← pre-rename state
        ├── OLD-PRD-2026-04-11.md     ← client's original 22-page PRD (markdown)
        ├── ATLAS-AI-PRD-2026-04-11-client-original.pdf ← same PRD as PDF
        ├── UniMate-Client-Pitch-2026-04.md ← original pitch deck text
        └── unimate-demo-lan-qr.png   ← demo tunnel QR code
```

Line counts: regenerate with `cloc web mobile --exclude-dir=node_modules,.next,dist` on every phase close.

---

## Web source tree (`/web/src`)

```
src/
├── app/
│   ├── layout.tsx               ← root layout + metadata (Atlas AI)
│   ├── page.tsx                 ← landing (hero + lead capture entry)
│   ├── globals.css              ← Tailwind v4 + CSS vars
│   └── api/
│       ├── chat/route.ts        ← full advisor chat (AI SDK streaming)
│       ├── chat-simple/route.ts ← lightweight chat fallback
│       ├── leads/route.ts       ← 5-step lead capture POST handler
│       ├── match/route.ts       ← UniMatch ranking (demo JS matcher)
│       └── sop/route.ts         ← SOP generator endpoint
├── lib/
│   ├── content.ts               ← landing copy + CTA strings
│   └── (universities.ts)        ← to be added P1: 43 AU unis seed
└── components/                  ← UI primitives (see P3-P6 for growth)
```

Per-file purpose is kept in sync by CLAUDE.md rule §3 — if a file's role changes, this table updates in the same commit.

---

## Active HTTP endpoints (web)

| Method | Path | Purpose | Auth | Status |
|---|---|---|---|---|
| POST | `/api/chat` | Streaming advisor chat | public (rate-limited P5) | demo — needs MARA-safe rewrite in P0.5 + P5 |
| POST | `/api/chat-simple` | Non-streaming chat fallback | public | demo — needs MARA-safe rewrite in P0.5 + P5 |
| POST | `/api/leads` | 5-step lead capture + inline match RPC invocation (returns `match_token`) | public + captcha P3 | P3 done + P4 done (invokes `match_unis_for_lead` RPC inline, returns `match_token`) |
| POST | `/api/sop` | Generate SOP draft | public | demo — rebuilds + react-pdf export in P6 (net-new, not a "lift") |
| GET  | `/matches/[token]` | Server Component — renders ranked strong + stretch matches for the lead identified by `match_token` (magic-link fallback when lead is stale) | public (token-scoped) | P4 done (Wave 5) |

"demo" = exists from pre-rename demo; each row notes which phase rebuilds it.
**Accuracy rule (CLAUDE.md §3a):** the set of POST rows above must equal the set of `route.ts` files under `web/src/app/api/`. If `ls web/src/app/api/*/route.ts | wc -l` != POST row count, the commit fails. GET row for `/matches/[token]` is a page route, not an API route. Current count: 4 API routes (`chat`, `chat-simple`, `leads`, `sop`) + 1 page route (`/matches/[token]`).

---

## Database schema (Supabase — to be provisioned in P1)

Not yet provisioned. P1 will create:
- `universities` (43 rows seeded from CRICOS open data)
- `courses` (CRICOS-registered only)
- `leads` (with consent + timestamp fields per Privacy Act 1988)
- `embeddings` (pgvector, 1536-dim via `text-embedding-3-small`)

Region: `ap-southeast-2` (Sydney). RLS enabled on all tables.

---

## Active features (mirrors PHASE.md "done" rows)

Phase 0 (this commit): repo rename + governance scaffold. No user-facing features yet — demo code from pre-rename is frozen until P3–P6 rebuild it against the Supabase backend.

---

## Deferred / explicitly out of v1

Tracked in `PRD.md` §3 (Out-of-scope). Re-adding any of these requires a new PO — not a scope edit.
