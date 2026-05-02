# P1 Plan-Check Review

**Verdict:** APPROVE-WITH-NOTES

## Schema correctness

PASS.

The applied schema matches `supabase/migrations/001_initial_schema.sql` and the PRD's database intent in §5:
- 4 tables: `universities`, `courses`, `leads`, `embeddings`
- 2 extensions: `uuid-ossp`, `vector`
- 3 RLS policies: `universities_anon_read`, `courses_anon_read`, `leads_anon_insert`
- The `leads` table includes the required consent columns and CHECK constraints

The live verification supplied in the prompt also matches the schema shape:
- `universities`: 12 rows
- `courses`: 48 rows
- `leads`: 0 rows
- `embeddings`: 0 rows
- extensions present: `vector 0.8.0`, `uuid-ossp 1.1`

## Seed correctness

APPROVE FOR P1 CLOSE, WITH A DOCUMENTED GAP.

The seed is not PRD-complete: the handoff and PRD assume 43 universities, while the live seed contains 12. That is a material scope reduction, but it is not a schema defect and it does not break the P1 goal of getting a working Supabase seed online for demo/E2E use.

This should be treated as a known backlog item, not a P1 blocker, because:
- the database is live and usable
- the seed script is deterministic and service-role based
- the deviation from the aspirational 43-uni target is explicitly called out in the commit message

If this were being asserted as "PRD complete", it would be a block. For P1 close, it is acceptable with notes.

## RLS safety

PASS.

The verified HTTP behavior matches the intended policy boundary:
- anon `SELECT` on `universities` and `courses` returns `200`
- anon `SELECT` on `leads` returns `[]`, which is the correct RLS-denied behavior because no anon `SELECT` policy exists
- anon `INSERT` on `leads` with valid `consent_service=true` returns `201`
- service_role `SELECT` on `leads` returns rows as expected

That is the correct P1 posture: public read only for public course/university data, insert-only for leads, and service-role read access for operational use.

## Region deviation

PASS for audit trail, BLOCK for production readiness.

The region deviation is recorded well enough for audit purposes:
- `PRD.md` §5 and §6 now explicitly note the `ap-southeast-1` deviation inline
- `planning/pathway-ai/DEVIATIONS.md` DEV-001 captures the decision date, owner, actual vs target region, and the 4 downstream obligations
- the deviation record is explicit that real traffic must not ship until the obligations are addressed

That is sufficient to close P1, but it is not sufficient to call the system production-ready. Production must remain blocked until the APP 8 disclosure and the other DEV-001 obligations are completed.

## Known limitations absorbed

PASS with notes.

The following are acceptable for P1, but remain production gaps:
- `courses.cricos_code` is still `NULL` in the seed
- `industry_placement` lives in the app seed type, not the DB schema

Both are already flagged for P4 / P4.5. They do not block P1 close because they do not undermine the schema apply, the seed pipeline, or the current RLS safety boundary.

## Final calls

- Ready to close P1? **yes**
- Ready to start P2 (auth magic link)? **yes**
- Production-ready today? **no**

