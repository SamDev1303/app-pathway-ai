You are Specter — stateless P1 phase-verify adjudicator for Atlas AI. Gideon (Codex gpt-5.4-mini) is running parallel phase-verify. Return a tight independent verdict.

## Cumulative P1 deliverables (verified via Supabase Management API + live curl tests)

### Schema (live state after migration f425837 + seed 5ac9bf7)

Tables in `public`:
```
[{"table_name":"courses"},{"table_name":"embeddings"},{"table_name":"leads"},{"table_name":"universities"}]
```

Extensions:
```
[{"extname":"uuid-ossp","extversion":"1.1"},{"extname":"vector","extversion":"0.8.0"}]
```

RLS policies (from `pg_policies`):
```
[
  {"tablename":"courses","policyname":"courses_anon_read","roles":"{anon}","cmd":"SELECT"},
  {"tablename":"leads","policyname":"leads_anon_insert","roles":"{anon}","cmd":"INSERT"},
  {"tablename":"universities","policyname":"universities_anon_read","roles":"{anon}","cmd":"SELECT"}
]
```

`leads` table CHECK constraints:
- `leads_consent_service_must_be_true` (consent_service = true)
- `leads_email_basic_shape` (email regex `^[^@]+@[^@]+\.[^@]+$`)

### Seed counts
```
[{"unis":12,"courses":48,"leads":0,"embeddings":0}]
```

Per-uni (from live query):
- UNSW (NSW, G8), USyd (NSW, G8), Melbourne (VIC, G8), Monash (VIC, G8), UQ (QLD, G8), ANU (ACT, G8), UWA (WA, G8), Adelaide (SA, G8, regional=true), UTS (NSW, non-G8), WSU (NSW, non-G8, regional=true), RMIT (VIC, non-G8), UOW (NSW, non-G8, regional=true)
- Each has 4 courses with CRICOS provider codes set (per-course cricos_code NULL — P4.5 gap)

### RLS behavior (curl-verified)
- Anon GET /universities → HTTP 200 (rows returned)
- Anon GET /courses → HTTP 200
- Anon GET /leads → HTTP 200 returning `[]` (RLS blocks even though rows may exist via service_role)
- Anon POST /leads with consent_service=true → HTTP 201 ✅
- Anon POST /leads with `Prefer: return=representation` → HTTP 401 (no SELECT grant for returning inserted row — expected PostgREST behavior)
- service_role SELECT /leads → returns rows (RLS bypassed)

### Deviations + gaps recorded
- **DEV-001 region** (`planning/atlas-ai/DEVIATIONS.md`): project in `ap-southeast-1` (Singapore) not `ap-southeast-2` (Sydney) per PRD §6. Sam override. 4 downstream obligations documented (APP 8 disclosure, UniMate client disclosure, MARA sign-off, APP 13 SOP). P4.5 gate BLOCKS production until addressed.
- **Scope gap**: 12 unis vs aspirational 43 — P4.5 backfill task.
- **courses.cricos_code = NULL** for all 48 — P4.5 backfill required before production per PRD §5 + QEAC.
- **industry_placement field** lives in web Course type only, not DB — P4 matcher server-migration adds column.

## Your 12-item verification

1. Schema applied live (4 tables) — evidence in data above.
2. Extensions enabled (vector 0.8.0 + uuid-ossp 1.1).
3. RLS enforced on leads (anon SELECT blocked, INSERT with consent=true works).
4. RLS enforced on embeddings (no policy = all anon denied).
5. RLS allows public read on universities + courses.
6. CHECK constraint `leads_consent_service_must_be_true` (would fail on consent_service=false).
7. CHECK constraint `leads_email_basic_shape` (would fail on malformed email).
8. Seed loaded: 12 unis + 48 courses.
9. Seed data integrity: provider codes + fields set per per-uni list.
10. DEV-001 region deviation audit trail.
11. 12-vs-43 scope gap audit trail.
12. Seed script reproducibility (not idempotent by default — --wipe flag available for reset).

## Output (markdown, 200-400 words)

## Verdict: PASS / PARTIAL / FAIL

## Item-by-item table
| # | Status | Evidence |
|---|---|---|
(Fill for all 12. Use PASS / PARTIAL / FAIL.)

## Ready to close P1? yes/no
## Ready to start P2? yes/no
## New issues for P2-P5? (bullets, 0-3 items)
