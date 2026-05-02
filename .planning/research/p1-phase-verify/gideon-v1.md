# P1 Phase-Verify Review

**Verdict:** PASS

## Schema + seed correctness

PASS. The live P1 build matches the documented schema/seed intent:
- The migration defines the intended extensions, tables, consent fields, and RLS boundary for public university/course reads plus insert-only leads: [supabase/migrations/001_initial_schema.sql:12](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L12), [supabase/migrations/001_initial_schema.sql:13](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L13), [supabase/migrations/001_initial_schema.sql:18](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L18), [supabase/migrations/001_initial_schema.sql:41](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L41), [supabase/migrations/001_initial_schema.sql:62](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L62), [supabase/migrations/001_initial_schema.sql:107](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L107), [supabase/migrations/001_initial_schema.sql:129](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L129), [supabase/migrations/001_initial_schema.sql:133](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L133).
- The seed script uses the service-role key and explicitly documents the two deferred P4.5 gaps: `courses.cricos_code = NULL` and `industry_placement` still living in the web type: [web/scripts/seed-universities.ts:5](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L5), [web/scripts/seed-universities.ts:19](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L19), [web/scripts/seed-universities.ts:24](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L24), [web/scripts/seed-universities.ts:69](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L69), [web/scripts/seed-universities.ts:132](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L132).
- The dataset in use is the 12-university fallback seed: [web/src/lib/universities-seed.ts:7](/Users/shamalkrishna/Desktop/pathway-ai/web/src/lib/universities-seed.ts#L7).

The 12-uni / 48-course seed is a scope reduction from the aspirational 43-uni target in PRD §4, but it does not break the P1 goal of getting a working seeded Supabase database online.

## RLS safety

PASS. The schema enforces the intended public/private boundary:
- anon `SELECT` is allowed on `universities` and `courses`: [supabase/migrations/001_initial_schema.sql:128](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L128), [supabase/migrations/001_initial_schema.sql:129](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L129), [supabase/migrations/001_initial_schema.sql:130](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L130).
- anon `INSERT` is allowed on `leads`, while `SELECT`/update/delete remain denied by default: [supabase/migrations/001_initial_schema.sql:132](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L132), [supabase/migrations/001_initial_schema.sql:133](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L133), [supabase/migrations/001_initial_schema.sql:134](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L134).
- lead consent is enforced with `consent_service = true`, optional marketing consent, and a basic email shape check: [supabase/migrations/001_initial_schema.sql:83](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L83), [supabase/migrations/001_initial_schema.sql:84](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L84), [supabase/migrations/001_initial_schema.sql:86](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L86), [supabase/migrations/001_initial_schema.sql:87](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L87), [supabase/migrations/001_initial_schema.sql:96](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L96), [supabase/migrations/001_initial_schema.sql:97](/Users/shamalkrishna/Desktop/pathway-ai/supabase/migrations/001_initial_schema.sql#L97).

That is the right posture for P1: public university/course reads, insert-only lead capture, and service-role operational access.

## Region deviation adequacy

PASS for auditability, not for production readiness. `planning/pathway-ai/DEVIATIONS.md` records DEV-001 with the actual `ap-southeast-1` region, the PRD target `ap-southeast-2`, and the four downstream obligations: [planning/pathway-ai/DEVIATIONS.md:7](/Users/shamalkrishna/Desktop/pathway-ai/planning/pathway-ai/DEVIATIONS.md#L7), [planning/pathway-ai/DEVIATIONS.md:21](/Users/shamalkrishna/Desktop/pathway-ai/planning/pathway-ai/DEVIATIONS.md#L21), [planning/pathway-ai/DEVIATIONS.md:38](/Users/shamalkrishna/Desktop/pathway-ai/planning/pathway-ai/DEVIATIONS.md#L38).

PRD §5 and §6 also carry the inline deviation note: [PRD.md:75](/Users/shamalkrishna/Desktop/pathway-ai/PRD.md#L75), [PRD.md:92](/Users/shamalkrishna/Desktop/pathway-ai/PRD.md#L92).

That is sufficient to close P1, but production must stay gated until the APP 8 / P4.5 work is complete.

## Known limitations absorbed

PASS with notes.
- `courses.cricos_code` is still null in seed data and marked for P4.5 backfill: [web/scripts/seed-universities.ts:20](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L20), [web/scripts/seed-universities.ts:21](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L21), [web/scripts/seed-universities.ts:22](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L22), [web/scripts/seed-universities.ts:23](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L23), [web/scripts/seed-universities.ts:134](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L134).
- `industry_placement` remains in the web seed type, not the DB schema, until the matcher migrates server-side: [web/scripts/seed-universities.ts:24](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L24), [web/scripts/seed-universities.ts:25](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L25), [web/scripts/seed-universities.ts:26](/Users/shamalkrishna/Desktop/pathway-ai/web/scripts/seed-universities.ts#L26).

## Final calls

- Ready to close P1? **yes**
- Ready to start P2 (auth magic link)? **yes**
- Production-ready today? **no**
