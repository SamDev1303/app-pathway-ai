# 📋 Screen-Share Notes Board — Atlas AI Meeting
**Today: Saturday 2026-04-25, 3:30pm AEST** · 30-min slot

---

## 🎯 OPEN WITH (60 sec)

> "9 of 10 phases shipped. Compliance gate, RAG chat, observability all production-ready. Phase 5.5 — structured logging + Sentry — landed this morning specifically because your agenda flagged debuggability as non-negotiable. Want me to walk you through what's live, or jump straight to your questions?"

**Let them choose.** If they say "walk through" → use brief §3 (System Design). If "questions" → §5 (Critical Questions).

---

## 🟢 TALKING POINTS (the big wins)

1. **Recommendation is SQL, not LLM.** Postgres RPC `match_unis_for_lead` ranks courses by GPA / IELTS / budget. Auditable, deterministic, costs nothing. ML can swap in at one file when ready.
2. **Belt-and-braces MARA deflection.** Pre-check on input + post-filter on stream output + audit-log every block. Not relying on the model to behave.
3. **3-layer PII redaction in logs** (just shipped). Path-based + censor function + recursive walker. Smoke test proves zero leaks.
4. **No vendor lock by design.** `CHAT_MODEL` env var swaps OpenRouter / Anthropic / OpenAI. Database is plain Postgres. Auth is JWT.
5. **Every interaction is a database row.** Leads, chats, deflections, dataset gaps, SOP versions — nothing is ephemeral.

---

## 🖥️ DEMO FLOW (if they want to see it)

| Step | URL / file | What they see | Time |
|---|---|---|---|
| 1 | atlas-ai.vercel.app | Landing page + MARA footer | 30s |
| 2 | atlas-ai.vercel.app/matches | Lead form (5 steps) | 60s |
| 3 | Submit → match token | Ranked university list | 30s |
| 4 | atlas-ai.vercel.app/chat | Ask "what's a good IT course in Sydney?" → streamed RAG answer with source citations | 60s |
| 5 | Same page: ask "can I get PR after this?" | Instant deflection to MARA agent + audit row written | 30s |
| 6 | IDE: open `web/src/lib/logger.ts` + `sentry.server.config.ts` | Show 3-layer redaction + scrubString | 60s |
| 7 | IDE: open `PHASE.md` | Show phase tracker with sign-offs | 30s |
| 8 | Terminal: `pnpm build` | 14 routes, 6.4s, 0 errors | optional |

**If short on time, do steps 1, 4, 5, 6.** That covers compliance + UX + code quality in 4 minutes.

---

## 🔥 IF THEY ASK (gotchas + honest answers)

| Question | Answer (don't dance) |
|---|---|
| "Where's the SOP generator?" | "Phase 6, not started. Route stub exists. Needs react-pdf wiring + section-edit loop. ~6h focused work." |
| "Where's the analytics dashboard?" | "Open decision today. Option A: Supabase Studio queries (ships now, free). Option B: custom /admin/analytics page (Phase 8, ~1 day). What do you want?" |
| "Why only 17 universities?" | "Seed dataset for the demo. Backfill to 43 is parked at Phase 8 — just data entry, no code." |
| "Mobile app?" | "Expo build exists, has Sentry, but rebrand from UniMate-demo branding pending (Phase 7). Can parallelize with web." |
| "Auth — better-auth?" | "Open. Supabase Auth works today, better-auth is more portable. Trade-off: Supabase has Postgres-native session integration, better-auth is provider-agnostic. Your call." |
| "Why OpenRouter Qwen and not GPT-4?" | "Free tier for the demo. Single env var swap to GPT-4-mini or Sonnet 4.6. Costs $0 today; production swap on your spend." |
| "Tests?" | "Typecheck (tsc --noEmit) + smoke-logger + manual QA per phase + Gideon code review. E2e suite is Phase 9 — happy to add Playwright now if priority." |
| "Vendor lock?" | "Postgres = pg_dump. Sentry = optional, opt-in via SENTRY_DSN. AI = env-gated. Auth = JWT. The only true bind is Vercel for hosting, and Next.js standalone output runs anywhere." |
| "How do we know it actually deflects?" | "mara_deflections table. Every block writes a row with the user message + the trigger phrase. Queryable in Supabase Studio. Full legal audit trail." |
| "How do we add a new university?" | "INSERT into universities table + run scripts/backfill-course-embeddings.ts. ~2 min per university. Could automate with a CSV importer in Phase 8." |
| "Cost per chat turn?" | "$0 today (Qwen free). On paid models: ~$0.001 per turn at 1500-token avg. Embedding cache means repeat queries are free after first hit." |
| "Why Next.js 16 and not stable 15?" | "16 has Cache Components (PPR) which is critical for the lead form's progressive save UX. Sentry SDK 10.50+ supports 16 — checked peer-deps before we started." |
| "Logging — show me a real log line" | Open terminal: `LOG_LEVEL=debug npx tsx web/scripts/smoke-logger.ts` — every email/phone field is `[Redacted]`, structure is JSON, stack traces preserved. |
| "Privacy Act / MARA compliance?" | "APP 5 collection notice live on lead form (`web/src/components/lead/Step5Contact.tsx`). MARA disclaimer in site footer + per-chat-turn footer. CI grep gate enforces zero migration-advice strings. Encryption at rest attested. Sydney region (ap-southeast-2)." |
| "Source code ownership?" | "Your repo. Standard MIT-ish handover. Phase 9 includes README + architecture doc + handover pack." |

---

## ❓ QUESTIONS TO ASK CLIENT

1. **Analytics:** Supabase Studio (ships now) or custom dashboard (Phase 8)? **← This is the one decision needed today.**
2. **Auth:** Stick with Supabase magic link or swap to better-auth before launch?
3. **Phase 6 priority:** SOP generator vs mobile rebrand — which ships first?
4. **University dataset:** Are you providing the 43-uni backfill data, or do you want me to source it?
5. **Production AI model:** stay on Qwen free, or move to GPT-4-mini / Sonnet for prod?
6. **Domain + branding:** Atlas AI as final name, or rebrand?
7. **Launch deadline:** what date are we targeting handover?
8. **Maintenance:** post-launch support model — retainer, ad-hoc, or full handover?

---

## 🚩 RED FLAGS (be honest if asked)

- ⚠️ SOP Generator Phase 6 not built (call out early — don't let them discover it)
- ⚠️ 17 universities seeded vs target 43
- ⚠️ Mobile app branding still says "UniMate-demo" in places
- ⚠️ No e2e test suite (have typecheck + smoke + manual)
- ⚠️ Analytics dashboard not built — open decision

---

## 🧠 IF YOU FORGET ONE THING

**The recommendation engine is SQL, not AI.** That single line answers half their concerns about black-box agents, scalability, ML readiness, and code ownership. Lead with it.

---

## 📞 LOGISTICS

- **Meeting link:** https://meet.google.com/ocv-rmvt-dgt
- **Time check before joining:** `TZ=Australia/Sydney date`
- **Repo:** github.com/SamDev1303/unimate-demo (private)
- **Live URL:** atlas-ai.vercel.app
- **Last commit:** `b18efdb` (P5.5 row flip, pushed origin/main 30 min before this brief was written)

---

*Pin this tab in your browser during screen share. Don't read from it — glance at it.*
