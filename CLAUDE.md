# CLAUDE.md — Atlas AI Governance

Rules every agent (Claude, Gideon, Atlas, Neo, minis) must follow in this repo. Violations block the commit. These rules supersede global CLAUDE.md defaults where they conflict.

---

## 1. Read order on session start

1. `PHASE.md` — find the current `in_progress` phase
2. `PRD.md` — confirm v1 scope, §3 out-of-scope
3. `SOURCECODE.md` — current architecture + stack versions
4. This file — governance

If any of these four are missing, STOP and regenerate before editing code.

---

## 2. Scope is locked at $3k AUD / 4 modules

- v1 ships: AI Advisor Chat, Lead Capture, UniMatch, SOP Generator (see PRD §2)
- v1 does NOT ship: Admin Dashboard, Provider Dashboard, Course Scraper, Analytics Dashboard, Better Auth, `internal_user_id` layer (see PRD §3)
- Re-adding any of the 6 cut modules requires a new PO. No scope creep. No "while I'm here" additions.

If a client request implies a cut module, Koda pushes back hard (see Koda personality push-back framework) and surfaces it as a v2 quote, not a v1 change.

---

## 3. Every commit updates PHASE.md + SOURCECODE.md (HARD RULE)

No exceptions. The same commit that touches code must:

1. Update the relevant phase row in `PHASE.md` — mark task done, add commit SHA, update timestamp
2. Update `SOURCECODE.md` — refresh file tree if files added/removed/renamed; bump stack versions if changed; update active endpoints table if routes added; update active features if phase moved to done

If a change can't be mapped to a phase in `PHASE.md`:
- STOP
- Either add a new phase/task to PHASE.md before coding, OR
- Log the change under PHASE.md's "Off-plan register" and flag for Sam

---

## 4. Phase transitions require dual sign-off

A phase moves from `in_progress` → `done` only when BOTH of these are present in `PHASE.md`:

```
**Phase verify sign-off:** Gideon {YYYY-MM-DD} | Atlas {YYYY-MM-DD}
```

- Koda cannot sign off on a phase (no self-signoff)
- Sam cannot override a unanimous veto from Gideon + Atlas without writing a documented rationale in PHASE.md
- If Gideon + Atlas disagree, Koda escalates to Sam
- "Small change" is not an exemption — every phase close needs both sign-offs

Research sign-off (Neo + NIM minis) and plan-check sign-off (Gideon + Atlas) are also recorded in the phase row before `in_progress` → `done`.

---

## 5. Commit discipline

- One commit = one logical unit of work
- Format: `{type}(phase-N): what changed`
  - `feat(phase-3): lead form step 1 — personal info`
  - `fix(phase-5): chat timeout raised to 30s`
  - `chore(phase-0): rename Unimate-demo → atlas-ai + governance docs`
- Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`
- Never commit `.env` files or credentials (pre-push-guard skill enforces)
- Never `git reset --hard` or `git push --force` without Sam's explicit confirmation per session

---

## 6. Research is Neo + NIM minis, not ad-hoc

Per-phase research dispatches via `/org-dispatch` or `superpowers:dispatching-parallel-agents`:

- **Neo** — primary researcher (Context7 + WebSearch for current API docs, AU legal, MARA/QEAC standards)
- **Echo / Vector / Nexus / Forge** (NIM minis) — parallel scans for framework patterns, security gotchas, AU-specific edge cases
- Output lands in `.planning/{phase}/research/` — referenced from the phase's research sign-off row

Universal Context7 gate (from global feedback memory): BEFORE any external API / model / CLI call, run Context7 + WebSearch to confirm current model IDs and endpoints.

---

## 7. Gideon + Atlas are final-say agents

- Code that Sam can't do in Lovable/Bolt → Gideon writes it (TS APIs, SQL migrations, react-pdf, anything outside no-code reach)
- UX copy, MARA-safe tone, landing text, SOW wording → Atlas
- Plan checks before `/gsd-execute-phase` → BOTH Gideon + Atlas
- Phase verify before `done` → BOTH Gideon + Atlas

Koda orchestrates but does not override. Sam signs invoices and holds ultimate veto.

---

## 8. AU compliance is non-negotiable

- **MARA Code of Conduct:** chat must NEVER give migration advice. System prompt hard rule + per-turn footer disclaimer: "This is not migration advice. Consult a registered MARA agent." UniMate's MARA number must be visible in page footer.
- **Privacy Act 1988:** lead capture stores `consent_given_at` + `consent_wording_version`. Consent wording reviewed by Neo + signed off by Atlas.
- **QEAC:** only CRICOS-registered courses surface. "CRICOS-registered" badge visible. No ranking claims beyond QS WUR public data.
- **Data residency:** Supabase region `ap-southeast-2` (Sydney). Do not change without Sam's approval.
- **No unauthorised scraping:** AU uni data is 43 manually seeded rows from CRICOS open data + public pages. Never auto-scrape uni sites in v1.

---

## 9. No-code stack is locked (PRD §5)

Do not swap Lovable → another builder, Supabase → another DB, OpenAI → another provider, or Resend → another email service without:
1. A documented reason in the off-plan register
2. Sam's explicit approval
3. A PHASE.md task tracking the migration

Free-tier OpenRouter is deprecated — v1 runs on OpenAI `gpt-4o-mini` + `text-embedding-3-small`.

---

## 10. Parent-repo rules still apply

Global rules inherited from `~/.claude/CLAUDE.md` and the parent `claudeking.cloud/CLAUDE.md`:
- HITL for all deletes (never `rm -rf` or `git reset --hard` without Sam's confirmation)
- Check date + time on session start/close via `mcp__time__get_current_time`
- Commit + push after work checkpoints
- Never expose real client names in public content (client = UniMate Pty Ltd internally; "our migration consultancy partner" externally if needed)
- Vercel committer must be `krishnashamal143@gmail.com`

---

## 11. Ship discipline

- Verify live + visually before claiming "done" — URL + mobile 375px width check, buttons clickable, nav/footer present
- Sam-facing progress: always keep an active todo list visible; Sam should never ask "where are we?"
- Telegram approval gate — Sam writes timestamped "proceed" in `planning/atlas-ai/APPROVAL.md` before `/gsd-execute-phase 1` runs

If in doubt, read `PHASE.md` first. If still in doubt, ask Sam.
