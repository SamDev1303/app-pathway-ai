# Pathway-AI — AGENTS.md

> Global rules: `~/.agents/AGENTS.md` — every CLI loads it. This file is the workspace's only rules file; there is no
> CLAUDE.md here, and none may be added. `.planning/config.json` sets GSD's `claude_md_path` to this file, so GSD
> writes its sections here (`link` mode writes `@path` references) and never creates a CLAUDE.md. `web/AGENTS.md` adds the Next.js version notes for `web/`.

Rules every agent (Claude, Gideon, Neo, minis) must follow in this repo. Violations block the commit. These rules supersede the global defaults where they conflict.

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

### 3a. SOURCECODE.md route table must match `web/src/app/api/` (HARD RULE)

The "## 4. HTTP endpoints" table in `SOURCECODE.md` is the audit surface. Before any commit that touches `web/src/app/api/`, verify:

```bash
# One `/api/` row in SOURCECODE.md §4 per route.ts file, whatever the method; the counts must match
# works from any directory in the checkout; nested routes count too
cd "$(git rev-parse --show-toplevel)" || exit 1
routes=$(find web/src/app/api -name route.ts | wc -l | tr -d ' ')
rows=$(awk '/^## 4\. HTTP endpoints/{f=1;next} /^## /{f=0} f' SOURCECODE.md | grep -c '^| [A-Z]* | `/api/')
[ "$routes" -gt 0 ] || echo "FAIL: no route.ts found under web/src/app/api"
[ "$routes" = "$rows" ] || echo "MISMATCH: $routes route files vs $rows /api/ rows"
```

Reason: Gideon's P0 plan-check caught that `SOURCECODE.md` listed 4 routes but 5 existed (`/api/match` was missing). If the living arch doc is wrong, every agent downstream inherits the wrong map. This rule is the mechanical check that prevents doc drift.

P9 lands an automated regenerator for this table. Until then, every author of an API-touching commit runs the check above and fixes the table in the same commit.

---

## 4. Phase transitions require dual sign-off

A phase moves from `in_progress` → `done` only when BOTH of these are present in `PHASE.md`:

```
**Phase verify sign-off:** Gideon {YYYY-MM-DD} | Neo {YYYY-MM-DD}
```

**Dual-seat roles (2026-04-16; models are chosen by registry lane, never typed here):**
- **Primary seat 1:** Gideon (codex, lane `builder`/`grill`)
- **Primary seat 2:** Neo (opencode, lane `neo`)
- **Fallback:** Specter (lane `mini-specter`, Nemotron) fills Neo's seat when the opencode seat is blocked. Atlas is retired from this project.
- **Open question for Sam:** phases 4–5 ran single-seat Gideon review (`.planning/4-CONTEXT.md`, `.planning/5-CONTEXT.md`), and `.planning/.continue-here.md` asks whether to retire the dual-seat language formally. Until Sam decides, this rule stands as written.
- **Koda cannot sign off** on a phase (no self-signoff)
- Sam cannot override a unanimous veto from the dual-seat pair without writing a documented rationale in PHASE.md
- If the dual-seat pair disagrees, Koda escalates to Sam
- "Small change" is not an exemption — every phase close needs both sign-offs

Research sign-off (NIM minis) and plan-check sign-off (Gideon + Neo, or Gideon + Specter fallback) are also recorded in the phase row before `in_progress` → `done`.

### 4a. Koda is the ONLY agent that writes to PHASE.md (HARD RULE)

Gideon, Neo, Specter, Atlas (if ever re-enabled), and NIM minis MUST NOT edit `PHASE.md` directly. Every dispatched agent returns its verdict + sign-off line inside a single response file (the "output contract" in its prompt). **Koda transcribes** the sign-off into the appropriate PHASE.md row AFTER verifying:

1. The response file exists at the contract path
2. The verdict is present and well-formed (`APPROVE | APPROVE WITH NOTES | BLOCK` for plan-check; `PASS | FAIL` for phase verify)
3. The signature line matches the expected agent name + date

Reason: agents dispatched in parallel cannot see each other's work. If both Gideon and Atlas edit PHASE.md simultaneously, they race. If one agent marks a team task `[x]` when only it has signed, that's a governance breach and a false "done" — Sam loses the ability to trust PHASE.md as the source of truth.

**Prompt-template rule for every dispatch:** include an explicit "DO NOT modify any file in this repository (`~/Work/Pathway-AI/code/`). Write ONLY to your designated output path — no other files." If an agent mutates PHASE.md anyway, Koda reverts and re-dispatches with a tighter prompt.

Exception: Koda itself writes to PHASE.md as part of every commit (per §3). That's the whole point — one writer, no races.

---

## 5. Commit discipline

- One commit = one logical unit of work
- Format: `{type}(phase-N): what changed`
 - `feat(phase-3): lead form step 1 — personal info`
 - `fix(phase-5): chat timeout raised to 30s`
 - `chore(phase-0): rename Unimate-demo → pathway-ai + governance docs`
- Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`
- Never commit `.env` files or credentials (pre-push-guard skill enforces)
- Never `git reset --hard` or `git push --force` without Sam's explicit confirmation per session

---

## 6. Research is Neo + NIM minis, not ad-hoc

Per-phase research dispatches via `/org` or `superpowers:dispatching-parallel-agents`:

- **Neo** — primary researcher (Context7 + WebSearch for current API docs, AU legal, /QEAC standards)
- **Echo / Vector / Nexus / Forge** (`mini-*` lanes) — parallel scans for framework patterns, security gotchas, AU-specific edge cases
- Output lands in `.planning/{phase}/research/` — referenced from the phase's research sign-off row

Universal Context7 gate (from global feedback memory): BEFORE any external API / model / CLI call, run Context7 + WebSearch to confirm current model IDs and endpoints.

---

## 7. Gideon + Neo are final-say agents (Specter/NeMo Tron fallback)

- Code that Sam can't do in Lovable/Bolt → Gideon writes it (TS APIs, SQL migrations, react-pdf, anything outside no-code reach)
- UX copy, -safe tone, landing text, SOW wording → Neo
- Plan checks before `/gsd-execute-phase` → BOTH Gideon + Neo
- Phase verify before `done` → BOTH Gideon + Neo
- **Fallback:** when the Neo/opencode seat fails (sandbox rejects external dirs, model unreachable, etc.), Specter (lane `mini-specter`) serves as the second seat. Koda notes the fallback in the PHASE.md sign-off row.

Koda orchestrates but does not override. Sam signs invoices and holds ultimate veto.

---

## 8. AU compliance is non-negotiable

- **MARA Code of Conduct:** chat must NEVER give migration advice. System prompt hard rule + per-turn footer disclaimer: "This is not migration advice. Consult a registered advisor." Pathway-AI's MARA number must be visible in page footer.
- **Privacy Act 1988:** lead capture stores `consent_given_at` + `consent_wording_version` + `consent_service` + `consent_marketing`. Consent wording drafted + signed off by Neo.
- **QEAC:** only CRICOS-registered courses surface. "CRICOS-registered" badge visible. No ranking claims beyond QS WUR public data.
- **Data residency:** Supabase region `ap-southeast-2` (Sydney). Do not change without Sam's approval.
- **No unauthorised scraping:** AU uni data is 43 manually seeded rows from CRICOS open data + public pages. Never auto-scrape uni sites in v1.

---

## 9. No-code stack is locked (PRD §5)

Do not swap Lovable → another builder, Supabase → another DB, OpenAI → another provider, or Resend → another email service without:
1. A documented reason in the off-plan register
2. Sam's explicit approval
3. A PHASE.md task tracking the migration

v1 chat runs through OpenRouter: the model is selected by `CHAT_MODEL` in `web/src/app/api/chat/route.ts` (default `openrouter/qwen-free`, per Sam's 2026-04-21 free-model instruction in `.planning/5-CONTEXT.md`).

---

## 10. Parent-repo rules still apply

Global rules inherited from `~/.agents/AGENTS.md` and the operator runtime `~/claudeking.cloud/AGENTS.md`:
- HITL for all deletes (never `rm -rf` or `git reset --hard` without Sam's confirmation)
- Check date + time on session start/close via `mcp__time__get_current_time`
- Commit + push after work checkpoints
- Never expose real client names in public content (client = Pathway-AI internally; "our migration consultancy partner" externally if needed)
- Vercel committer must be `krishnashamal143@gmail.com`

---

## 11. Ship discipline

- Verify live + visually before claiming "done" — URL + mobile 375px width check, buttons clickable, nav/footer present
- Sam-facing progress: always keep an active todo list visible; Sam should never ask "where are we?"
- Approval gate — Sam gives an explicit, timestamped "proceed" before `/gsd-execute-phase` runs (the old
  `planning/pathway-ai/APPROVAL.md` file no longer exists, though `.planning/config.json` `approval_gate` still names it —
  left for Sam; record where the approval came from in the phase row)

If in doubt, read `PHASE.md` first. If still in doubt, ask Sam.

<!-- WORKFLOW:BEGIN — canonical workflow block. Source of truth: ~/Tools/SKILLS/references/WORKFLOW.md. Written verbatim into every AGENTS.md (the only rules file; no workspace keeps a CLAUDE.md) by scripts/bootstrap-workspace.sh --agents-md; scripts/check-agents-md.sh hashes every copy against this file. Edit only the canonical references/WORKFLOW.md in the skills repo, never a copy. -->

# Agent workflow

Every task moves through the same beats, whichever CLI or agent runs it — Claude, Codex/Gideon, Antigravity/Atlas,
OpenCode/Neo, Grok, Cursor, Kimi. Drop this block into a repo's `AGENTS.md` — the one rules file every CLI reads — then
add the repo-specific callouts (commands and checks, invariants, environment) before or after this block; it also
governs work in the repos that generate it.

## 0. GSD first

The first beat of anything — entering a workspace, creating one, a feature, a small fix — is a `/gsd-*` step:
`/gsd-new-project` on a new workspace, `/gsd-new-phase` or `/gsd-plan-phase` on an existing one, `/gsd-quick` for a small
task. GSD owns the outer lifecycle (discuss → plan → execute → verify → complete); the four beats below run inside
`/gsd-execute-phase`. `/org plan` wraps `/gsd-plan-phase` with the org's adversarial review; `/org loop` is the ship gate.

## 1–4. Isolate → Build → Prove → Ship

1. **Isolate — `/new-feature`.** Every task starts in a fresh git worktree branched from `origin/main`, created
   **beside** the primary checkout, never nested inside it. Never build on `main`.

2. **Build — `/code-structure`.** Actions/boundaries orchestrate the "why/when"; a service layer owns the reusable
   "how", with explicit inputs and structured returns. Actions own the rules, auth, state transitions and error
   classification; a service owns one mechanic, takes explicit parameters, returns a structured result and never
   touches state directly; extract into a service only what two or more callers already repeat.

3. **Prove — `/evidence-driven-testing`.** The repo's own checks plus runtime evidence. Capture the **before** while
   reproducing the issue — before fixing it, when it is cheapest — and the **after** once the change works. Headless
   environments use scripted screenshots, probes, measured numbers and output pairs. One assertion per state
   change; anything you could not exercise is marked `untested` with the reason, never left silent; every piece of
   evidence names the exact commit it was captured on.

4. **Ship — `/before-and-after`, then `/org loop` until 5/5 with zero open findings.** Open the PR with before/after
   proof in the description. `/org review` is the single-pass merge gate (PASS/FLAG/BLOCK from independent reviewer
   seats); `/org loop` drives a FLAG or BLOCK to **5/5 with zero open findings** on the org's own board — the fixer never
   grades its own work, a close needs a reviewer's AGREE. Finish by presenting the PR URL. Only Astra (the builder lane)
   and Koda build or merge; every other seat reviews, researches or drafts.

## Writing for humans

Run `/unslop` over anything a person will read, before you commit, post, or send it: commit messages, the PR title and
body, README and doc edits, code comments, the closing reply. It strips AI tells and replaces fancy words with plain
ones. Apply it to text you wrote or changed, not to prose you did not touch.

## Where plans live

A plan is written into the workspace it belongs to — `<workspace>/.planning/plans/YYYY-MM-DD-<slug>.md` — and
`<workspace>/.planning/CURRENT-PLAN.md` points at the active one (path, one-line goal, phase reached). A plan that lives
only in a CLI's private plan folder is invisible to every other agent and lost after a context clear. Koda-only work
uses `~/claudeking.cloud/.planning/`; project work uses that project's `.planning/`, never someone else's.

## Multi-agent rules

- Never commit directly to `main`. Never force-push to `main`; never plain `--force` anywhere — only
  `--force-with-lease`, only on your own task branch.

- One worktree and one branch per task and per agent — never reuse or modify another agent's worktree, branch, or
  uncommitted work. A brief is not a permission boundary: review seats run read-only by mechanism, and the checkout is
  fingerprinted before and after every fan-out.

- **Scope check** before starting: skim open PRs' changed files (`gh pr list`, `gh pr diff <n> --name-only`) and look for
  uncommitted work in shared checkouts. On overlap, stop and ask for direction.

- Resolve lockfile conflicts by regenerating, never by hand-merging.
- Worktrees do not isolate shared resources: confirm a dev-server port answers *your* process before trusting it, and do
  not run schema experiments against a shared database.

- Seats are addressed by registry lane name, never by a typed model id; nothing runs a model Sam has not named.
- If a conflict cannot be resolved confidently, stop and report instead of guessing.

## Completing a task

1. Keep changes limited to the assigned task.
2. Run the repo's checks *(repo-specific: list the exact commands in this file's checks section)*.
3. Assemble the evidence captured along the way into before/after pairs.
4. Commit with a clear message, rebase onto the latest `origin/main`, and rerun the checks.
5. Push (`git push -u origin <branch>`; after rebasing an already-pushed branch, `--force-with-lease`).
6. Open the PR. The body must explain what changed, how it was tested (every claim backed by evidence), before/after
   proof, and any risks or follow-up work. Run the title and body through `/unslop` before posting.

7. Run `/org loop` until **5/5 with zero open findings**.
8. End by presenting the PR URL.

Do not merge the PR unless explicitly instructed. Keep the worktree until the PR is merged or closed.
<!-- WORKFLOW:END -->

## This repo's checks

- `cd web && npm ci && npm run build`
- Before a commit that touches `web/src/app/api/`: the §3a route-table check above
