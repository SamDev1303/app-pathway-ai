# STATE.md — Atlas AI planning state

**Last updated:** 2026-04-17 12:58 AEDT (Koda session 3)
**Current phase:** P2 not_started (ready to begin — Supabase Auth magic link)
**Last completed phase:** P1 (done 2026-04-17 12:58 AEDT — dual-seat PASS, DEV-001 region deviation + 4 P4.5 production gates)
**Next blocker:** none for starting P2. P4.5 compliance gate has 4 items carrying forward from P1 (APP 8 disclosure + 43-uni backfill + per-course CRICOS + industry_placement DB column)

---

## Phase status snapshot

| Phase | Status | Plan-check | Phase verify |
|---|---|---|---|
| P0 | ✅ done | Gideon APPROVE WITH NOTES + Atlas APPROVE (round 2) | Gideon PASS + Specter PASS |
| P0.5 | ✅ done | Gideon APPROVE-WITH-NOTES (round 2) + Specter APPROVE-WITH-NOTES | Gideon PASS (round 2) + Specter PASS |
| P1 | ✅ done | Gideon APPROVE-WITH-NOTES + Specter APPROVE-WITH-NOTES | Gideon PASS + Specter PASS (12/12) |
| P2 | not_started (ready to begin) | — | — |
| P3 | not_started | — | — |
| P4 | not_started | — | — |
| P4.5 | not_started | — | — |
| P5 | not_started | — | — |
| P6 | not_started | — | — |
| P7 | can run parallel with P1–P4 | — | — |
| P8 | not_started | — | — |
| P9 | not_started | — | — |

Canonical roadmap: [`../PHASE.md`](../PHASE.md).

---

## Blocks

- ✅ **P0.5 CLOSED** 2026-04-17 12:36 AEDT (dual-seat PASS on plan-check + phase-verify, 3 commits: f425837 + 2bedf83 + 4a81cc8)
- ✅ **P1 CLOSED** 2026-04-17 12:58 AEDT (dual-seat PASS, commit 5ac9bf7). Region DEVIATION recorded as DEV-001 (project in ap-southeast-1 Singapore, not PRD §6 target ap-southeast-2 Sydney — Sam override).
- **P2 ready to begin** — Supabase Auth magic link (uses existing project + keys)
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

- `{pending}` chore(phase-1): close P1 — PHASE.md + STATE.md sign-offs recorded
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
