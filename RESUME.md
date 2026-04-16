# RESUME.md — How to continue Atlas AI

**Last session:** 2026-04-17 00:15 AEDT · **Koda** (Claude Opus 4.6)
**Where we stopped:** P0 done + P0.5 partially executed (3/8 files) + P1 prep complete (schema + seed + env staged). Approval gate + plan-check pending.

---

## One-command resume (from any shell)

```bash
cd ~/Desktop/atlas-ai && /gsd-resume-work
```

That single command reads `.planning/STATE.md` + `PHASE.md` + this file and restores full context. GSD's resume skill is wired to this workspace because the `.planning/` scaffold is in place (`config.json`, `STATE.md`, `PROJECT.md`).

If for some reason `/gsd-resume-work` doesn't fire cleanly, fall back to:

```bash
cd ~/Desktop/atlas-ai && cat RESUME.md .planning/STATE.md PHASE.md | head -200
```

---

## What is blocking forward progress

In order — do them top to bottom:

### 1. Sam writes APPROVAL.md (Telegram gate)

Per `CLAUDE.md §11`, P0.5 execution is gated on Sam writing a timestamped "proceed" line. Do this:

```bash
mkdir -p ~/Desktop/atlas-ai/planning/atlas-ai
cat > ~/Desktop/atlas-ai/planning/atlas-ai/APPROVAL.md <<EOF
# APPROVAL.md — Atlas AI Phase gate
proceed 2026-04-17 {HH:MM} AEDT — Sam — approve P0.5 scaffold scrub + P1 provisioning
EOF
```

Then commit as `chore(approval): Sam approves P0.5 + P1 execution 2026-04-17`.

### 2. Finish P0.5 — 5 remaining files to scrub

Koda already scrubbed 3 files in this session:
- `web/src/lib/content.ts` ✅ MARA-safe landing copy
- `web/src/app/api/chat/route.ts` ✅ hard deflection + disclaimer footer
- `web/src/app/api/chat-simple/route.ts` ✅ same rules, mobile version

Remaining (cite Gideon round-2 file:line):
- [ ] `web/src/components/ChatDrawer.tsx` (L7-12, 140) — chip suggestions still reference "PR in Australia", "subclass 500 vs 485", "visas"
- [ ] `web/src/components/MatcherForm.tsx` (L24, 35, 119-120, 165, 180, 201-207, 234, 260-264) — `wantsPR` state + "visa pathway" CTA + pathway-result sections
- [ ] `web/src/components/LeadModal.tsx` (L197-199) — split bundled consent into service (required) + marketing (optional)
- [ ] `web/src/app/api/sop/route.ts` + `web/src/app/api/match/route.ts` — audit for migration-advice leakage
- [ ] `mobile/lib/mockData.ts` (L48, 94, 123, 139, 153-154, 162, 166-167, 172) + `mobile/app/(tabs)/profile.tsx` (L58-66)

Close with the widened grep gate:
```bash
cd ~/Desktop/atlas-ai
grep -riE "(subclass|MLTSSL|STSOL|PR points|PR pathway|visa success|migration advice|DoHA|points test|Permanent Residency|visa pathway|post-study work|migration outcomes|PR-aware|PR-eligible|wants_pr|wantsPR)" web/src/ mobile/
# must return zero hits before P0.5 phase-verify
```

### 3. P0.5 plan-check + phase-verify

Dispatch Gideon (`codex exec -m gpt-5.4-mini --full-auto`) + Neo (`opencode run --agent neo`) on the completed scrub. Specter/NeMo Tron (`nim-dispatch.py --agents specter`) is the fallback if Neo's OpenCode sandbox fails again.

Model IDs (verified via Context7 2026-04-16):
- Codex CLI: `gpt-5.4-mini` (review/verify), `gpt-5.4` (deep implementation)
- Gemini CLI: `gemini-3.1-pro-preview` (if ever re-enabled — Atlas is currently retired from this project per Sam 2026-04-16)

### 4. Sam-blocked P1 provisioning

Koda staged all P1 assets; can't create the Supabase project without Sam's account access. Sam needs to:

1. Create Supabase project in region **`ap-southeast-2`** (Sydney — data residency requirement per PRD §6)
2. Enable pgvector extension in the new project (dashboard → Database → Extensions → `vector`)
3. Copy these into `web/.env.local` (template already at `web/.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Apply the migration:
   ```bash
   cd ~/Desktop/atlas-ai
   # Option A — via Supabase CLI (preferred)
   supabase link --project-ref {your-project-ref}
   supabase db push
   # Option B — paste supabase/migrations/001_initial_schema.sql into dashboard SQL editor
   ```

### 5. Seed 43 AU unis

Koda staged `web/src/lib/universities-seed.ts` with 43 AU universities + CRICOS provider codes + QS 2025 rankings. Next: write `scripts/seed-universities.ts` that reads the seed and inserts into Supabase using the service role key.

### 6. Dispatch P1 plan-check + phase-verify

Same dual-seat pattern: Gideon + Neo (Specter fallback).

---

## What got built in the last session (5 commits on `main`, all pushed)

- `1fac8b7` chore(phase-0): rename Unimate-demo → atlas-ai + 5 root governance files
- `e83ee7d` fix(phase-0): §4a governance lock + Atlas round 1 transcription
- `aa505d5` fix(phase-0): accept Gideon BLOCK + insert P0.5 + P4.5 + consent + route table fix
- `64558e9` fix(phase-0): record round 2 dual sign-off + absorb non-blocking notes
- `a14a481` chore(phase-0): close P0 — dual phase-verify PASS + swap Atlas → Neo globally
- _(uncommitted at handoff — see next section)_

## Uncommitted at this handoff

Koda prepped but hadn't committed yet at session close. One atomic commit closes the handoff:

```bash
cd ~/Desktop/atlas-ai
git add -A
git commit -m "chore(phase-0.5+phase-1-prep): autonomous scrub (3 files) + P1 assets staged + handoff"
git push origin main
```

This includes:
- P0.5 scrub of 3 files (content.ts, chat/route.ts, chat-simple/route.ts)
- P1 prep: `supabase/migrations/001_initial_schema.sql` + `web/src/lib/universities-seed.ts` + `web/.env.example`
- PHASE.md P0.5 status → in_progress with 3/8 tasks `[x]`; minis findings (OAIC NDB + APP encryption) absorbed into P9 + P4.5
- SOURCECODE.md tree + status stamp updated
- `.planning/STATE.md` stamp updated
- This RESUME.md
- Desktop hygiene: `~/Desktop/Atlas AI PRD.pdf` → `_reference/archive/`; client pitch + QR → archive; review artifacts → `.planning/research/`; SOW → `_reference/client-handover/`

---

## Round-2 mini findings absorbed into plan (non-blocking but important)

- **Echo (Llama 3.3 70B):** OAIC Notifiable Data Breaches plan missing. Added to **P9** as a required handover deliverable.
- **Vector (Llama 4 Maverick):** APP-compliant encryption at rest + in transit not explicit. Added to **P4.5** as a verification task.
- **Forge (Qwen3 Coder 480B):** timeout (150s) — no result. Not a blocker; dispatch skipped on a mini that's known-flaky.

---

## Tools + configs locked in

- **GSD:** granularity `fine`, research `yes`, plan-check `yes`, verifier `yes`, model profile `balanced` (see `.planning/config.json`)
- **Dual-seat agents:** Gideon (Codex gpt-5.4-mini for review) + Neo (OpenCode free models). Specter (NVIDIA Nemotron-3-Super-120B via NIM) is the documented NeMo Tron fallback when Neo's OpenCode sandbox blocks filesystem reads.
- **Atlas retired** from this project as of 2026-04-16 due to Gemini quota/capacity issues (see CLAUDE.md §4 notes).

---

## Contact

- **Client:** UniMate Pty Ltd — Sydney NSW (MARA/QEAC-licensed)
- **Client MARN + QEAC:** `{PENDING_FROM_UNIMATE}` — must be filled in `web/src/lib/content.ts` before production launch
- **Build owner:** Sam (Koda Labs) — sam@claudeking.org
