# P1 Handoff — Supabase Provisioning + Schema Apply

**Last updated:** 2026-04-17 12:33 AEDT · Koda
**Prereq:** P0.5 must be closed (phase-verify dual sign-off recorded in PHASE.md)

---

## Status as of handoff

### ✅ DONE by Koda
1. `web/.env.local` written with Sam's Supabase creds (gitignored):
   - URL: `https://szuqcptsmmgycvagteza.supabase.co`
   - Legacy JWT anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Legacy JWT service_role key (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_KEY` for backward-compat)
   - New v2 keys (`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`)
2. Schema staged: `supabase/migrations/001_initial_schema.sql` (universities + courses + leads + embeddings + pgvector + RLS)
3. Seed data staged: `web/src/lib/universities-seed.ts` (43 AU universities, renamed `industry_placement`)

### ⛔ BLOCKED on Sam
The following require Sam's dashboard access or terminal — cannot be done autonomously by Koda:

1. **Confirm region = `ap-southeast-2`** (Sydney)
   - Open: https://supabase.com/dashboard/project/szuqcptsmmgycvagteza/settings/general
   - Required per PRD §6 (data residency — Privacy Act 1988 + MARA Code of Conduct)
   - **If region is different:** project needs to be recreated in `ap-southeast-2` before any PII lands in it

2. **Enable pgvector extension**
   - Open: https://supabase.com/dashboard/project/szuqcptsmmgycvagteza/database/extensions
   - Search "vector" → toggle ON
   - Required — the migration will fail without it

3. **Provide DB password** for `supabase link`
   - Retrieve from: https://supabase.com/dashboard/project/szuqcptsmmgycvagteza/settings/database (under "Database password")
   - Format: paste the password into a Telegram message OR add it to `web/.env.local` as `SUPABASE_DB_PASSWORD=...`

4. **CLI login on the new account**
   - Run in terminal: `supabase login`
   - Browser opens for OAuth with the Supabase account owning project `szuqcptsmmgycvagteza`
   - NOT the same account currently logged into the CLI — must re-auth

---

## Execution steps AFTER Sam unblocks

### Step 1: Link + Apply migration
```bash
cd ~/Desktop/atlas-ai
supabase link --project-ref szuqcptsmmgycvagteza
# Enter DB password when prompted

# Apply the pgvector + schema migration
supabase db push
```

### Step 2: Verify schema
```bash
# Via CLI
supabase db dump --schema public

# Or via dashboard: https://supabase.com/dashboard/project/szuqcptsmmgycvagteza/editor
# Should see: universities, courses, leads, embeddings (with pgvector)
```

### Step 3: Seed the 43 universities
```bash
# Write the seed script (not yet committed — P1 execution task)
cd ~/Desktop/atlas-ai
# Script TBD: scripts/seed-universities.ts
# Reads web/src/lib/universities-seed.ts
# Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS
# Inserts all 43 universities
npx tsx scripts/seed-universities.ts
```

### Step 4: Verify RLS policies
```bash
# Anon cannot read universities? YES (universities are public — RLS should allow anon SELECT on universities + courses)
# Anon cannot INSERT/UPDATE on universities? MUST BLOCK
# Anon can INSERT on leads (with consent_service=true)? YES
# Anon cannot SELECT on leads? MUST BLOCK (only service_role reads)
# Anon has no access to embeddings? MUST BLOCK

# Test via dashboard SQL editor or:
SUPABASE_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY npx tsx scripts/test-rls.ts
```

### Step 5: Dispatch P1 plan-check + phase-verify
Dual-seat: Gideon (primary) + Specter (fallback since Neo OpenCode is flaky).

---

## Security considerations flagged

1. **Service role key in .env.local** — effectively a DB superkey. If `.env.local` leaks, attacker has full DB access. Confirm `.env*` is in `.gitignore` (verified: yes).
2. **Consent data retention** — `consent_wording_version` field stores which wording version a user agreed to. If we change APP 5 wording, old rows reference old version. Plan for wording-version archive.
3. **Anonymous key exposure** — `NEXT_PUBLIC_SUPABASE_ANON_KEY` will be bundled into client JS. RLS is the ONLY thing stopping anon from reading `leads`. Validate RLS BEFORE any real PII lands.
4. **Legal-disclosure caveat in LeadModal** — added per Gideon's APP 5 note, but actual handling of legal-disclosure requests needs a documented procedure (separate doc TBD for P3).

---

## Quick reference

| What | Where |
|---|---|
| Supabase project | https://supabase.com/dashboard/project/szuqcptsmmgycvagteza |
| Env file | `~/Desktop/atlas-ai/web/.env.local` (gitignored) |
| Schema | `~/Desktop/atlas-ai/supabase/migrations/001_initial_schema.sql` |
| Seed | `~/Desktop/atlas-ai/web/src/lib/universities-seed.ts` |
| PRD region rule | `~/Desktop/atlas-ai/PRD.md` §6 |
| Approval | `~/Desktop/atlas-ai/planning/atlas-ai/APPROVAL.md` |
