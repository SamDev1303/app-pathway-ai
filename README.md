# Atlas AI

AI-powered study-abroad advisor for Australia — built for **UniMate Pty Ltd** (Sydney NSW), a MARA-registered and QEAC-certified migration consultancy.

v1 ships four conversion-critical modules: AI Advisor Chat, 5-step Lead Capture, UniMatch Engine (43 AU universities seeded), and SOP Generator with PDF export.

---

## Stack

- **Web:** Next.js 16 (App Router) · React 19 · Tailwind v4 · AI SDK v6 · `@ai-sdk/openai`
- **Mobile:** Expo SDK 54 · React Native · Expo Router
- **Backend:** Supabase (Postgres + Auth magic link + pgvector) · region `ap-southeast-2`
- **LLM:** OpenAI `gpt-4o-mini` (chat) · `text-embedding-3-small` (RAG)
- **Email:** Resend
- **PDF:** react-pdf (client-side SOP export)
- **Hosting:** Vercel (web) · Expo OTA (mobile)
- **Lead CRM (v1):** Google Sheet via Make.com scenario

Full rationale and v2 roadmap in [`PRD.md`](./PRD.md).

---

## Run

```bash
# Web
cd web && npm install && npm run dev         # http://localhost:3000

# Mobile
cd mobile && npm install && npx expo start --tunnel
```

Required env (see `.env.example` per subdir):
- `OPENAI_API_KEY`
- `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

---

## Deploy

| Env | URL | Status |
|---|---|---|
| Production | `atlas-ai.vercel.app` | pending P9 |
| Legacy demo | `unimate-demo.vercel.app` | kept live until 2026-05-16, then 301 → atlas-ai |

Vercel project: `prj_A6cObazFvum7qN49jOm8UiDFIBbH` (renamed display → `atlas-ai`). Committer email must be `krishnashamal143@gmail.com`.

---

## Governance

Every commit must update [`PHASE.md`](./PHASE.md) and [`SOURCECODE.md`](./SOURCECODE.md). Phase transitions require dual sign-off (Gideon + Neo; Specter/NeMo Tron as fallback when Neo/OpenCode infra stalls) in PHASE.md. Hard rules in [`CLAUDE.md`](./CLAUDE.md).

Demo / pre-rename history archived in [`_reference/archive/`](./_reference/archive/).

---

## Contact

- **Client:** UniMate Pty Ltd — Sydney NSW, Australia (MARA/QEAC licensed)
- **Build:** Koda Labs — `sam@claudeking.org`
- **Repo:** https://github.com/SamDev1303/unimate-demo (rename to `atlas-ai` pending)
