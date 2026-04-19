# STATE.md — Atlas AI

**Last updated:** 2026-04-20 (session 50 close — P4.5 compliance gate)

---

## Current phase: P4.5 CLOSED → P5 UNBLOCKED

**Closed:** 2026-04-20 (session 50, ~03:40 AEST target)
**Sign-off:** Gideon PASS (single-seat gpt-5.4-mini — `.planning/research/p4.5-phase-verify/gideon-v1.md`)
**Next phase:** **P5 AI Advisor Chat + basic RAG** — UNBLOCKED by P4.5

---

## P4.5 summary

**Scope delivered (all 9 PHASE.md must-haves + 2 mid-session scope expansions):**

| # | Must-have | Status |
|---|-----------|--------|
| 1 | Site-wide MARA disclaimer footer | ✅ Wave 4 — layout.tsx owns `<Footer />` |
| 2 | MARA registration # + link in footer | ✅ Wave 1 — placeholder + CI gate mechanism |
| 3 | Chat system prompt staged (P5-ready) | ✅ Wave 1 — `chat-system-prompt.ts` |
| 4 | Per-turn chat footer disclaimer | ✅ Wave 1 — constant + system-prompt mandate (P5 wires) |
| 5 | Consent split (service + marketing) | ✅ Wave 3.5 — schema split live since P3; v3 Sydney wording |
| 6 | RLS policies live | ✅ Wave 3 — 006 applied to Sydney project |
| 7 | Data residency = ap-southeast-2 | ✅ Wave 3 — DEV-001 RESOLVED via Sydney migration |
| 8 | APP encryption verified | ✅ Wave 5a — attestation §3.2 + §3.3 |
| 9 | CI MARA grep gate | ✅ Wave 5b — 3-job workflow (local-pending push) |

**Mid-session scope expansions (authorized by Sam):**

- **Wave 0** — scrub fake `MARN 1798425` + `QEAC P538` + `ABN 12 345 678 901` across 7 files (Playwright-verified fake via portal.mara.gov.au)
- **Sydney region migration** — new Supabase project `fprqcugrmjvgrtbtohbf` (ap-southeast-2), old Singapore project pending Sam's deletion
- **Uni data expansion** — 4 Tier-1 corrections + 5 new CRICOS-verified universities (12 → 17 unis, 48 → 68 courses)
- **Vercel monorepo fix** — buildCommand/installCommand/outputDirectory for web/ subdirectory

---

## Commits pushed to main (sequence)

```
b24717c feat(phase-4.5): wave 0 — scrub fake MARN/QEAC/ABN identifiers
6e13b23 feat(phase-4.5): planning lock — 4.5-CONTEXT + 4.5-PLAN + APPROVAL
9057fe0 feat(phase-4.5): wave 1 — chat-system-prompt staging + mara-disclaimer v2
040e392 feat(phase-4.5): wave 2 — 006_rls_policies.sql authored (not applied yet)
d0497a8 feat(phase-4.5): uni data seed — 4 Tier-1 corrections + 5 CRICOS-verified additions
603b8f3 feat(phase-4.5): vercel.json — ignoreCommand for selective web/ deploys
53286c8 feat(phase-4.5): post-migration cleanup — consent v3 + DEV-001 resolved
111dfe2 feat(phase-4.5): wave 4 — footer wired site-wide in root layout
3fdee82 feat(phase-4.5): wave 5a — compliance-attestation-v1 doc
f4e69ca fix(phase-4.5): vercel.json monorepo buildCommand + 006 region comment
```

**10 commits pushed** across Wave 0 → Wave 5a + Vercel fix.

**Local-only (pending Sam gh auth refresh with `workflow` scope):**
- `.github/workflows/mara-grep-gate.yml` (Wave 5b) — requires `gh auth refresh -h github.com -s workflow` to push

**After workflow lands:** Wave 6 sign-off commit (PHASE.md P4.5 close + STATE.md update) will be the final push.

---

## Open items carried to P8 (final audit)

1. **MARA registration number (MARN) + QEAC + ABN replacement** — CI gate enforcement deadline **2026-04-27 23:59 AEST**
2. Service-role key rotation runbook + 90-day schedule
3. QS WUR licensing agreement (QS data in matcher UI)
4. 43-uni expansion with verified CRICOS codes (currently 17)
5. Per-course CRICOS codes on 68 course rows (currently null)
6. USyd + Melbourne BCS fee verification vs official 2025 fee PDFs
7. `is_regional` flag authoritative source (Department of Home Affairs list)

---

## P5 pre-flight for next session

**P5 scope (PHASE.md lines 218-223):**
- Switch demo chat from OpenRouter → OpenAI `gpt-4o-mini`
- Embed 43 unis + CRICOS course metadata — but currently we have 17 unis (P8 backfill pending)
- System prompt wiring: import `CHAT_SYSTEM_PROMPT_V1` from `web/src/lib/chat-system-prompt.ts` (already staged in P4.5)
- `/api/chat` streams with RAG retrieval + per-turn footer
- Abort/disconnect/backpressure handling + per-IP rate limit

**Pre-reqs for P5 already landed in P4.5:**
- ✅ Chat system prompt staged
- ✅ MARA-safe deflection pattern defined
- ✅ Per-turn footer constant
- ✅ Sydney Supabase with pgvector extension (P1 + migrations)
- ✅ Compliance attestation documented

**Blockers for P5:**
- Need OpenAI API key (currently `OPENAI_API_KEY` placeholder in `.env.local`)
- Need to verify pgvector index strategy for the 17 unis' embeddings
