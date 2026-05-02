# P1 Phase-Verify — Supabase schema + seed delivery check

**Repo:** `~/Desktop/pathway-ai`
**Commit under review:** `5ac9bf7` (schema apply + seed exec + DEV-001)
**Plan-check (both seats PASS):** Gideon APPROVE-WITH-NOTES + Specter APPROVE-WITH-NOTES
**Reviewer role:** NO CODE WRITING. REVIEW ONLY. ONE OUTPUT FILE.

## Phase-verify question (goal-backward)

**Does P1 actually deliver what it promised?** Not "did schema apply succeed" but "is the Supabase layer now usable by P2-P9 without re-work?"

## 12-item P1 phase-verify checklist

Verify each item. Mark PASS / FAIL / PARTIAL with evidence.

1. **Schema applied live** — 4 tables in public schema: universities, courses, leads, embeddings.
2. **Extensions enabled** — pgvector >=0.8.0 + uuid-ossp installed.
3. **RLS enforced on leads** — anon cannot SELECT existing rows; anon CAN INSERT with consent_service=true; service_role bypasses.
4. **RLS enforced on embeddings** — NO policy for anon means ALL operations denied to anon.
5. **RLS allows public read on universities + courses** — CRICOS-public data.
6. **CHECK constraint on leads.consent_service** — INSERT with consent_service=false must fail.
7. **CHECK constraint on leads.email** — INSERT with malformed email must fail.
8. **Seed loaded** — 12 universities + 48 courses.
9. **Seed data integrity** — each uni has cricos_provider_code + state + flags; each course has required fields.
10. **Region deviation audit trail** — DEV-001 exists; PRD §4 + §6 inline-noted; 4 downstream obligations documented.
11. **Scope gap audit trail** — 12 vs 43 universities documented as P4.5 backlog.
12. **Seed script reproducibility** — re-runnable via --wipe flag (not idempotent by default).

## Output

Write ONE markdown file to `.planning/research/p1-phase-verify/{AGENT_NAME}-v1.md`:

- **Verdict:** PASS / PARTIAL / FAIL
- **12-item table** with status + evidence per item
- **Ready to close P1 officially?** yes/no
- **Ready to start P2 (Supabase Auth magic link)?** yes/no
- **Any NEW issues for P2-P5 to watch out for?**

## Verify against live state

If needed, hit Supabase Management API query endpoint using the PAT saved as `SUPABASE_ACCESS_TOKEN` in `web/.env.local` (not inlined here for secrets hygiene):
```bash
source web/.env.local
curl -X POST \
 -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
 -H "Content-Type: application/json" \
 -H "User-Agent: pathway-ai-koda/1.0" \
 -d '{"query": "SELECT count(*) FROM universities;"}' \
 https://api.supabase.com/v1/projects/szuqcptsmmgycvagteza/database/query
```

## DO NOT

- Modify files or DB state
- Output more than ONE markdown file
- Take longer than 6 minutes
- Inline the PAT into any written file — always reference `$SUPABASE_ACCESS_TOKEN` env var
