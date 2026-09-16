@AGENTS.md

<!-- WORKFLOW:BEGIN — canonical workflow block. Source of truth: ~/Tools/SKILLS/references/WORKFLOW.md. Written verbatim into every AGENTS.md and the workflow section of CLAUDE.md by scripts/bootstrap-workspace.sh --agents-md; scripts/check-agents-md.sh hashes every copy against this file. Edit HERE only. -->
# Agent workflow

Every task moves through the same beats, whichever CLI or agent runs it — Claude, Codex/Gideon, Antigravity/Atlas,
OpenCode/Neo, Grok, Cursor. Drop this block into a repo as `AGENTS.md` (and the workflow section of `CLAUDE.md`), then
append the repo-specific callouts at the end; it also governs work in the repos that generate it.

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
2. Run the repo's checks *(repo-specific: list the exact commands in the block below)*.
3. Assemble the evidence captured along the way into before/after pairs.
4. Commit with a clear message, rebase onto the latest `origin/main`, and rerun the checks.
5. Push (`git push -u origin <branch>`; after rebasing an already-pushed branch, `--force-with-lease`).
6. Open the PR. The body must explain what changed, how it was tested (every claim backed by evidence), before/after
   proof, and any risks or follow-up work. Run the title and body through `/unslop` before posting.
7. Run `/org loop` until **5/5 with zero open findings**.
8. End by presenting the PR URL.

Do not merge the PR unless explicitly instructed. Keep the worktree until the PR is merged or closed.
<!-- WORKFLOW:END -->
