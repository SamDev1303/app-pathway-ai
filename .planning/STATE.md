# STATE.md — Atlas AI planning state

**Last updated:** 2026-04-17 00:15 AEDT
**Current phase:** P0.5 in_progress (autonomous partial — 3/8 files scrubbed; 5 remain; plan-check + phase-verify still needed)
**Last completed phase:** P0 (done 2026-04-16)
**Next blocker:** Sam writes `planning/atlas-ai/APPROVAL.md` Telegram "proceed" → unblocks P0.5 plan-check dispatch + execution of remaining 5 files + verify.

---

## Phase status snapshot

| Phase | Status | Plan-check | Phase verify |
|---|---|---|---|
| P0 | ✅ done | Gideon APPROVE WITH NOTES + Atlas APPROVE (round 2) | Gideon PASS + Specter PASS |
| P0.5 | ⏸ gated | — | — |
| P1 | not_started | — | — |
| P2 | not_started | — | — |
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

- **P0.5 cannot start** until Sam writes timestamped "proceed" in `planning/atlas-ai/APPROVAL.md` via Telegram (per CLAUDE.md §11).
- **P1 cannot start** until P0.5 closes (HARD BLOCK per P0.5 block description).
- **P5 cannot start** until P4.5 closes (HARD BLOCK per P4.5 block description).

---

## Key commitments

- **Client:** UniMate Pty Ltd — Sydney NSW
- **Price:** $3,000 AUD fixed, HARD-CUT (no scope creep without new PO)
- **Timeline:** 3 weeks from 50% deposit
- **Upside signal:** ~$15k follow-on if v1 lands

---

## Agents (dual-seat, updated 2026-04-16)

- **Seat 1:** Gideon (Codex CLI, `gpt-5.4-mini` for review, `gpt-5.4` for implementation)
- **Seat 2:** Neo (OpenCode CLI, free models)
- **Fallback:** Specter (NVIDIA `nemotron-3-super-120b-a12b` via NIM) — filled in P0 verify when Neo's OpenCode sandbox blocked external-dir reads

---

## Commits on main (newest → oldest)

- `a14a481` chore(phase-0): close P0 — dual phase-verify PASS + swap Atlas → Neo globally
- `64558e9` fix(phase-0): record round 2 dual sign-off + absorb non-blocking notes
- `aa505d5` fix(phase-0): accept Gideon plan-check BLOCK — P0.5 + P4.5 + consent + route table
- `e83ee7d` fix(phase-0): lock PHASE.md writes to Koda + §4a rule + transcribe Atlas plan-check
- `1fac8b7` chore(phase-0): rename Unimate-demo → atlas-ai + add governance docs
