# PRD — Atlas AI v1 (HARD-CUT)

**Version:** 1.0 · **Locked:** 2026-04-16 · **Owner:** Sam (Koda Labs) · **Client:** UniMate Pty Ltd
**Budget:** $3,000 AUD fixed · **Timeline:** 3 weeks from 50% deposit · **Target market:** Australia only

> This PRD supersedes the client's original 22-page "Atlas AI" PRD (archived at `_reference/archive/OLD-PRD-2026-04-11.md`). Scope here is reduced to ship on budget. The 6 cut modules are quoted separately in v2 (§9).

---

## 1. Product summary

Atlas AI is a MARA-safe, QEAC-aligned AI advisor that helps international students pick an Australian university, capture their intent as a qualified lead for UniMate Pty Ltd, and export a draft Statement of Purpose. It runs on web (primary surface) with a companion Expo app. Legal advice and migration guidance are explicitly out of scope — all chat turns carry a MARA disclaimer.

---

## 2. v1 scope (four modules, ship-blocking)

| # | Module | Outcome | Success metric |
|---|---|---|---|
| V1.1 | **AI Advisor Chat** | Student asks questions about CRICOS-registered Australian courses/unis; streamed answers grounded in the 43-uni seed. **Chat does NOT give visa or migration advice** — any such question is deflected to "Consult a registered MARA agent" + link to UniMate's MARA registration | Response time <3s to first token; MARA disclaimer on every turn; zero visa/migration advice strings in audit |
| V1.2 | **Lead Capture** | 5-step progressive form. Each step persists **client-side only** (`localStorage`) so back-button doesn't lose data. PII hits Supabase in a single atomic write on step 5 AFTER consent tick, alongside `consent_given_at` + `consent_wording_version`. Lead emailed to Sam + UniMate via Resend | 100% leads land in DB + email post-consent; zero pre-consent PII rows in `leads` |
| V1.3 | **UniMatch Engine** | `/api/match` returns ranked AU universities with match % and reason text | Top-3 results under 500ms from Supabase |
| V1.4 | **SOP Generator** | Generate draft SOP from lead profile, export to PDF client-side via react-pdf | PDF downloads in <2s; edit + regenerate loop works |

---

## 3. Out-of-scope (explicit — DO NOT build without a new PO)

These six modules are removed from v1. The v1 client-facing framing is **"v1 ships conversion; v2 adds operations."** Never say "cut" to the client.

| ID | Module | Reason cut | v2 approx |
|---|---|---|---|
| X.1 | Admin Dashboard (roles-based CRM) | Leads to Google Sheet via Make.com in v1 | $2–3k |
| X.2 | Provider Dashboard | No actual uni partners signed yet — building for a market that doesn't exist | $3–4k |
| X.3 | Course Management Scraper | AU university scraping is legal grey; 43 manual CRICOS seeds covers 95% | $2k |
| X.4 | Analytics Dashboard | Vercel Analytics + Supabase logs suffice for v1 | $1–2k |
| X.5 | Better Auth (magic link + multi-session) | Supabase Auth magic link has identical UX at zero integration cost | $1k |
| X.6 | `internal_user_id` abstraction layer | Redundant when we're Supabase end-to-end; re-adds value only if client migrates off | $1k |

Total v2 quote envelope: **~$10–13k** — anchors the $15k follow-on conversation.

---

## 4. User stories (by module)

### V1.1 — AI Advisor Chat
- As a prospective student, I ask "Which Australian unis teach AI?" and get a streamed, MARA-safe answer listing CRICOS-registered options with match reasoning.
- As a student, every chat turn I see ends with "This is not migration advice. Consult a registered MARA agent." — no exceptions.
- As UniMate, I can trust that the chatbot will **never** give migration advice. Visa subclass, PR pathway, MLTSSL/STSOL occupation list, post-study work visa, and points-test questions are deflected to "Consult a registered MARA agent" with link to UniMate's registration. No hedged answers, no summaries of visa rules, no gestures at the DoHA website beyond the MARA link.

### V1.2 — Lead Capture
- As a prospective student, I fill a 5-step form (personal → academic → preferences → budget → contact). Each step saves to my browser (`localStorage`) so the back-button doesn't lose progress; nothing reaches Atlas AI's server until I tick the consent box on step 5.
- As a prospective student, the consent wording on step 5 is split into two explicit ticks: (a) required — "I consent to Atlas AI storing this enquiry so UniMate's MARA agents can respond" (service consent); (b) optional — "I consent to marketing emails about Australian study options" (marketing consent). I can submit without the marketing tick.
- As Sam, I get a Resend email with the lead the moment step 5 submits with BOTH consent flags ticked where applicable; UniMate gets a copy; both include a lead score.
- As a compliance auditor, I can see `consent_given_at`, `consent_wording_version`, `consent_service` (true), and `consent_marketing` (bool) columns on every row of `leads`. There are zero rows where `consent_service = false`.

### V1.3 — UniMatch Engine
- As a student, after step 3 of the lead form I see my top-3 AU unis with match % + one-line reason each.
- As UniMate, the matcher uses real CRICOS data only — no invented courses.

### V1.4 — SOP Generator
- As a student, after matching I can generate a draft SOP from my profile and download it as PDF.
- As a student, I can edit any section of the draft and regenerate — state persists across edits.

---

## 5. Tech stack + rationale

| Layer | Choice | Why |
|---|---|---|
| Frontend builder | Lovable.dev (primary) → Bolt.new (fallback) | Sam does not hand-write code; no-code React + Supabase path |
| Web framework | Next.js 16 (existing) | Already scaffolded; App Router + AI SDK v6 works cleanly |
| Mobile | Expo SDK 54 (existing) | Don't rewrite; light rebrand in P7 |
| Auth | Supabase Auth magic link | Replaces Better Auth — identical UX, zero integration cost |
| Database | Supabase Postgres + pgvector (region `ap-southeast-2`) | Single vendor, RLS, data residency in Sydney |
| LLM (chat) | OpenAI `gpt-4o-mini` | Production-grade replacement for OpenRouter free-tier |
| LLM (embeddings) | OpenAI `text-embedding-3-small` (1536-dim) | Cheap, fits pgvector, fast |
| PDF | react-pdf (client-side) | No server work; SOP exports in-browser |
| Email | Resend | Already wired; works well with Next.js |
| Hosting | Vercel (existing project) | Free hobby tier covers v1 traffic |
| Lead CRM (v1) | Google Sheet via Make.com | Replaces admin dashboard; zero code |

---

## 6. AU compliance requirements (non-negotiable)

| Requirement | Implementation |
|---|---|
| **MARA Code of Conduct** — chat must NOT give migration advice | System prompt hard rule + per-turn footer: "This is not migration advice. Consult a registered MARA agent." UniMate's MARA number displayed in page footer with registration link. **Scaffold audit (P0.5):** existing demo strings in `web/src/lib/content.ts` + `web/src/app/api/chat/route.ts` mentioning PR pathways, subclass 500/485, MLTSSL/STSOL, or PR points are removed BEFORE P1 starts. Compliance gate (P4.5) re-verifies before P5 chat goes live. |
| **Privacy Act 1988** — explicit consent on lead capture | No PII is persisted to Supabase before step 5 consent. Steps 1–4 persist only to `localStorage` client-side. On step 5, a single atomic write stores `consent_given_at`, `consent_wording_version`, `consent_service` (required), and `consent_marketing` (optional). Wording reviewed by Neo + signed off by Atlas. |
| **QEAC standards** — no misleading course claims | Only surface CRICOS-registered courses; show "CRICOS-registered" badge; no ranking claims beyond QS WUR public data |
| **Data residency** (AU preference) | Supabase region `ap-southeast-2` (Sydney); Vercel Edge requests route through Sydney POP |
| **No unauthorised scraping** | 43 AU unis seeded manually from CRICOS open data + public uni pages. Scraper module cut to v2. |

---

## 7. Non-functional requirements

| Metric | Target |
|---|---|
| Chat first-token latency | <3s p95 |
| Page load (landing) | <2s p95 on 4G |
| Lead form step-save | <500ms p95 |
| Match API | <500ms p95 from warm Supabase |
| Uptime | 99% (Vercel hobby SLA is best-effort) |
| Browser support | Evergreen Chrome/Safari/Edge; mobile Safari 16+ |

---

## 8. Acceptance criteria (client sign-off)

UniMate acceptance requires all of:
1. Four v1 modules demo-able end-to-end against a seeded Supabase
2. MARA disclaimer visible on every chat turn
3. Lead captured in DB + emailed to UniMate + Sam with consent timestamp
4. SOP downloads as PDF from draft
5. Mobile app opens with new "Atlas AI" branding (P7 complete)
6. `atlas-ai.vercel.app` live; `unimate-demo.vercel.app` redirects after 30 days

---

## 9. v2 backlog (priced separately, anchors $15k follow-on)

- Admin Dashboard — roles-based CRM (X.1)
- Provider Dashboard — uni partner surface (X.2)
- Course Management Scraper — if legal review clears (X.3)
- Analytics Dashboard — beyond Vercel Analytics (X.4)
- Advanced Auth — Better Auth migration if Supabase Auth hits limits (X.5)
- `internal_user_id` abstraction — only if migrating off Supabase (X.6)

---

## 10. Assumptions (tracked in SOW §10)

1. UniMate provides MARA registration number + QEAC credentials
2. UniMate provides `atlasai.com.au` (or approves `atlas-ai.vercel.app` as primary)
3. UniMate provides logo + brand guidelines within 3 business days of PO
4. Initial uni shortlist (max 10) for seed curation provided by UniMate; remaining 33 sourced from CRICOS open data
