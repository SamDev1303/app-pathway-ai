# STATE.md — Atlas AI planning state

**Last updated:** 2026-04-21 (Koda s51 — P6 shipped clean, Gideon R3 PASS all personas, READY-TO-PUSH)
**Current phase:** P7 (next — mobile rebrand) after P6 push
**Last completed phase:** P6 — SOP Generator + PDF Export (done 2026-04-21; 7 feat + 7 fix commits `02354bd..9745717`; Gideon phase-verify R1 BLOCK → R2 BLOCK → R3 PASS all 4 personas; READY-TO-PUSH)
**Last completed phase:** P4 (done 2026-04-20 00:55 AEST — 6-wave execution; 4-persona Round-5 contract PASS; migration 005 stretch_flag fix live; must_have #3 REVOKE/GRANT injection PASS; MARA grep clean; `npm run build` PASS. Phase verify: Gideon PASS-WITH-NOTES (single-seat gpt-5.4, 2026-04-20 01:13 AEST; 4 PASS + 4 PASS-WITH-NOTES; zero push blockers — see `.planning/research/p4-phase-verify/gideon-v1.md`))
**Next phase:** P7 — mobile rebrand (P4.5 reconciled to `done` 2026-04-21; 3 deferred items escalated to P8)
**Next blocker:** none — P4 context clean. P4.5 compliance gate still carries 4 items from P1 + 1 improvement note from P2 (getClaims migration) + 1 new note from P3 (MARA-forbidden-string CI grep gate) + 1 new note from P4 discussion (QS WUR licensing lawyer-review — low risk, flag-only).

**P4 discovery (2026-04-19):** Schema gaps surfaced during discuss-phase. Migration 003_match_prep.sql must ship as part of P4 (not P4.5): (a) `courses.industry_placement boolean` — was in TS type, missing in DB (seed script header lines 17-24 explicitly flag this as P4's job); (b) `leads.matches jsonb`, `leads.matches_computed_at timestamptz`, `leads.match_token uuid` for match result storage; (c) drop unused `leads.matched_university_ids`. `preferred_state` column NOT added — location tiebreaker dropped from P4 scope.

**Review protocol change (2026-04-17 session 4):** Single-seat Gideon on `gpt-5.4` full supersedes dual-seat + mini-for-review pattern used in P0–P2. See `feedback_agent-model-calibration.md`.

---

## Phase status snapshot

| Phase | Status | Plan-check | Phase verify |
|---|---|---|---|
| P0 | ✅ done | Gideon APPROVE WITH NOTES + Atlas APPROVE (round 2) | Gideon PASS + Specter PASS |
| P0.5 | ✅ done | Gideon APPROVE-WITH-NOTES (round 2) + Specter APPROVE-WITH-NOTES | Gideon PASS (round 2) + Specter PASS |
| P1 | ✅ done | Gideon APPROVE-WITH-NOTES + Specter APPROVE-WITH-NOTES | Gideon PASS + Specter PASS (12/12) |
| P2 | ✅ done (infrastructure only) | Gideon APPROVE-WITH-NOTES + Specter APPROVE-WITH-NOTES | Gideon PASS + Specter PASS (10/10) |
| P3 | ✅ done | Gideon APPROVE round 2 (single-seat, 2026-04-17 23:40 AEST) | Gideon PASS round 2 (2026-04-18 02:56 AEST) |
| P4 | ✅ done (2026-04-20 00:55 AEST — 6 waves shipped; Round-5 4-persona contract PASS; 005 stretch_flag fix live; REVOKE/GRANT injection PASS; MARA grep clean; build PASS) | Gideon APPROVE r4 (single-seat gpt-5.4, 2026-04-19 19:22 AEST; 4 rounds: R1/R2/R3 BLOCK → absorbed 9 issues → R4 APPROVE) | Gideon PASS-WITH-NOTES (single-seat gpt-5.4, 2026-04-20 01:13 AEST; 4 PASS + 4 PASS-WITH-NOTES; zero push blockers — see `.planning/research/p4-phase-verify/gideon-v1.md`) |
| P4.5 | ✅ done (2026-04-20 — 9/9 compliance must-haves shipped; 3 items escalated to P8 backlog) | retroactive audit 2026-04-21 (scout — no formal plan-check) | retroactive PASS — evidence in PHASE.md §4.5 |
| P5 | ✅ done (2026-04-21 — 8 waves shipped; Gideon fold-in commit `8f4c1e8` landed; `pnpm build` PASS; MARA grep clean; row flipped retroactively 2026-04-21 parallel to P4.5 reconcile) | Gideon (single-seat gpt-5.4, session 51) | Gideon PASS (single-seat gpt-5.4, 2026-04-21; fold-in `8f4c1e8` absorbed notes) |
| P6 | ✅ done (2026-04-21 — 7 waves + 7 fix commits; lead-gated `/sop/[leadToken]`; sop_drafts versioned + UNIQUE(lead_id,version_number) retrofit via 011; streaming + real messageMetadata contract; client-side react-pdf; MARA pre-filter + cumulative post-filter; rate-limit 10/lead/day) | Gideon APPROVE-WITH-NOTES (single-seat gpt-5.4, 2026-04-21) | Gideon PASS R3 (4/4 personas PASS; 2 BLOCK rounds → 7 fix commits d7d6913+9acf76d+2f2dce1+9745717 → R3 clean — handoffs `koda-handoff-2026-04-21{,-r2,-r3}.md`) |
| P7 | can run parallel with P1–P4 | — | — |
| P8 | not_started | — | — |
| P9 | not_started | — | — |

Canonical roadmap: [`../PHASE.md`](../PHASE.md).

---

## Blocks

- ✅ **P0.5 CLOSED** 2026-04-17 12:36 AEDT (dual-seat PASS on plan-check + phase-verify, 3 commits: f425837 + 2bedf83 + 4a81cc8)
- ✅ **P1 CLOSED** 2026-04-17 12:58 AEDT (dual-seat PASS, commit 5ac9bf7). Region DEVIATION recorded as DEV-001 (project in ap-southeast-1 Singapore, not PRD §6 target ap-southeast-2 Sydney — Sam override).
- ✅ **P2 CLOSED** 2026-04-17 13:05 AEDT (dual-seat PASS, commit 809d7dc). Scope decision: infrastructure only (no admin page, no redirect — anonymous-first preserved). Non-blocker note: prefer getClaims() over getUser() in future P4 auth-gated work.
- **P3 ready to begin** — Lead capture (5-step + progressive save + scoring)
- **P4.5 production gate carries forward 4 items from P1:** APP 8 disclosure in LeadModal, 43-uni backfill (currently 12), per-course `cricos_code` backfill (currently NULL), `industry_placement` DB column add
- **P5 cannot start** until P4.5 closes (HARD BLOCK per P4.5 block description).

---

## Key commitments

- **Client:** UniMate Pty Ltd — Sydney NSW
- **Price:** $3,000 AUD fixed, HARD-CUT (no scope creep without new PO)
- **Timeline:** 3 weeks from 50% deposit
- **Upside signal:** ~$15k follow-on if v1 lands

---

## Agents (dual-seat, updated 2026-04-17)

- **Seat 1:** Gideon (Codex CLI, `gpt-5.4-mini` for review, `gpt-5.4` for implementation) — active this session
- **Seat 2:** Neo (OpenCode CLI, free models) — unreachable this session (CLI flag incompatibility on `opencode run` for phase-review prompts)
- **Fallback:** Specter (NVIDIA `nemotron-3-super-120b-a12b` via NIM) — filled seat 2 in both P0 and P0.5 (stateless adjudicator, pattern works reliably)

---

## Commits on main (newest → oldest)

- `{pending}` feat(phase-4): MARA grep gate clean + Round-5 4-persona smoke PASS + migration 005 stretch_flag fix + PHASE/STATE sign-off
- `cf82e9a` feat(phase-4): /matches/[token] Server Component + match components + magic-link fallback
- `f0b0a70` feat(phase-4): /api/leads invokes match RPC + returns match_token; delete orphan /api/match route
- `72200ec` feat(phase-4): apply 003+004 to live Supabase + seed upsert (persona A smoke PASS)
- `448045b` feat(phase-4): migration 003 match_prep + migration 004 match_unis_for_lead RPC
- `807c452` feat(phase-4): match weights + Zod schema + reason template + MARA disclaimer constants
- `2ae6477` docs(phase-4): plan locked — 16 tasks / 6 waves / Gideon R4 APPROVE
- `751ac33` docs(phase-4): research — weights + SQL + MARA banner + 11 landmines
- `{pending}` chore(phase-2): close P2 — PHASE.md + STATE.md sign-offs recorded
- `809d7dc` feat(phase-2): Supabase Auth magic link infrastructure
- `911379b` chore(phase-1): close P1 — dual-seat PASS sign-offs recorded + P2 unblocked
- `5ac9bf7` feat(phase-1): apply schema + seed 12 unis to Supabase ap-southeast-1 — region deviation recorded
- `32ad7bb` feat(phase-1): prep seed-universities.ts script (ready for Sam post-unblock)
- `c03e81d` chore(phase-0.5): STATE.md sync — P0.5 closed, P1 partially-unblocked
- `12755ed` chore(phase-0.5): close P0.5 — dual-seat PASS + Gideon v2 + Specter sign-offs recorded
- `4a81cc8` fix(phase-0.5): absorb Gideon phase-verify FAIL on item 6 — wire /api/leads to new consent fields
- `2bedf83` fix(phase-0.5): absorb Gideon round-1 BLOCK — remove residual migration copy + expand APP 5 notice
- `f425837` fix(phase-0.5): scaffold scrub — remove migration-advice strings per MARA Code of Conduct (web + mobile)
- `a14a481` chore(phase-0): close P0 — dual phase-verify PASS + swap Atlas → Neo globally
- `64558e9` fix(phase-0): record round 2 dual sign-off + absorb non-blocking notes
- `aa505d5` fix(phase-0): accept Gideon plan-check BLOCK — P0.5 + P4.5 + consent + route table
- `e83ee7d` fix(phase-0): lock PHASE.md writes to Koda + §4a rule + transcribe Atlas plan-check
- `1fac8b7` chore(phase-0): rename Unimate-demo → atlas-ai + add governance docs
