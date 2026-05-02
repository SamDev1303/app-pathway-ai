# P1 Plan-Check Review — Supabase schema + seed + region deviation

**Repo:** `~/Desktop/pathway-ai`
**Commit under review:** `5ac9bf7` — `feat(phase-1): apply schema + seed 12 unis to Supabase ap-southeast-1 — region deviation recorded`
**Also relevant:** `32ad7bb` (seed script), `1fac8b7` (schema migration created in P0)
**Reviewer role:** NO CODE WRITING. REVIEW ONLY. ONE OUTPUT FILE.

## Context

P0.5 closed 12:36 AEDT with dual-seat PASS. P1 executes:
1. Apply `supabase/migrations/001_initial_schema.sql` → 4 tables + 2 extensions + 3 RLS policies (done via Management API)
2. Run `web/scripts/seed-universities.ts --apply` → 12 unis + 48 courses inserted via service_role PostgREST (done)
3. Document region deviation — Supabase project is in `ap-southeast-1` (Singapore) not `ap-southeast-2` (Sydney) as PRD §6 required. Sam overrode after Koda flagged. `planning/pathway-ai/DEVIATIONS.md` DEV-001 records 4 downstream obligations.

## Live state (verified by curl against Management API)
- Project URL: `https://szuqcptsmmgycvagteza.supabase.co`
- Project region: `ap-southeast-1` (DEVIATION)
- Tables: universities (12 rows), courses (48 rows), leads (0 rows), embeddings (0 rows)
- Extensions: vector 0.8.0, uuid-ossp 1.1
- RLS policies: universities_anon_read (SELECT), courses_anon_read (SELECT), leads_anon_insert (INSERT with_check=true)
- Verified behavior:
 - Anon SELECT universities/courses: HTTP 200 ✅
 - Anon SELECT leads: returns `[]` (RLS blocks — no SELECT policy for anon) ✅
 - Anon INSERT leads with valid consent_service=true: HTTP 201 ✅ (without `Prefer: return=representation` which needs SELECT)
 - service_role SELECT leads: returns row (bypasses RLS) ✅
 - CHECK constraint `leads_consent_service_must_be_true` present
 - CHECK constraint `leads_email_basic_shape` (regex) present

## Your task

Review whether P1 delivers what was promised AND whether the region deviation is safely recorded.

## Output

Write ONE markdown file to `.planning/research/p1-plan-check/{AGENT_NAME}-v1.md`:

- **Verdict:** APPROVE / APPROVE-WITH-NOTES / BLOCK
- **Schema correctness:** Does the applied schema match the migration file + PRD §5?
- **Seed correctness:** 12 unis is a gap from the aspirational 43. Is this acceptable for P1 close, or should it block?
- **RLS safety:** Are the policies actually blocking anon read of leads while allowing INSERT? Cite the verified HTTP tests above.
- **Region deviation:** Is DEV-001 + PRD §6 inline note + the 4 downstream obligations sufficient audit trail? Or should this block production readiness?
- **Known limitations absorbed:** courses.cricos_code NULL + industry_placement not in DB — flagged for P4/P4.5, acceptable for P1?
- **Ready to close P1?** yes/no
- **Ready to start P2 (auth magic link)?** yes/no

## Key files to inspect

- `supabase/migrations/001_initial_schema.sql` — source of truth for schema
- `web/scripts/seed-universities.ts` — seed execution path (takes service_role, runs PostgREST inserts)
- `web/src/lib/universities-seed.ts` — 12-uni dataset
- `planning/pathway-ai/DEVIATIONS.md` — DEV-001 full record
- `PRD.md` §4 + §6 — where deviation is inline-noted
- `planning/pathway-ai/P1-HANDOFF.md` — original handoff (some steps superseded by Management API approach)

## DO NOT

- Modify files
- Output more than ONE markdown file
- Take longer than 6 minutes
