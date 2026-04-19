-- Atlas AI — Phase 4.5 RLS policies
-- Region: ap-southeast-2 (Sydney) — DEV-001 RESOLVED 2026-04-20 via project migration
-- Applied on: project fprqcugrmjvgrtbtohbf (Sydney)
-- Apply via: supabase db push OR Supabase dashboard SQL editor
-- Prerequisites: 001-005 already applied.
--
-- Design intent: Privacy Act 1988 APP 11 (security of personal information).
-- Anon (web browser) clients MUST NOT read `leads`. They may only INSERT new
-- leads via /api/leads server route, which uses the service role key.
-- Reference data (universities, courses) is public — anon SELECT allowed.
--
-- Service role bypasses RLS by default — no policy needed for /api/leads,
-- /api/sop, or the match_unis_for_lead() RPC to continue working.

-- ================================================================
-- leads — anon INSERT only, service role full access (bypass)
-- ================================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Block anon reads explicitly (also covered by default-deny, but explicit is clearer
-- for compliance auditors reading this migration directly).
DROP POLICY IF EXISTS leads_anon_no_select ON leads;
CREATE POLICY leads_anon_no_select ON leads
  FOR SELECT
  TO anon
  USING (false);

-- Allow anon INSERT for the lead-capture modal's direct Supabase client path
-- (defence in depth — current /api/leads uses service role, but future browser-
-- side inserts must still satisfy the consent_service = true CHECK constraint
-- from 001_initial_schema.sql).
DROP POLICY IF EXISTS leads_anon_insert ON leads;
CREATE POLICY leads_anon_insert ON leads
  FOR INSERT
  TO anon
  WITH CHECK (consent_service = true);

-- Block anon UPDATE + DELETE.
DROP POLICY IF EXISTS leads_anon_no_update ON leads;
CREATE POLICY leads_anon_no_update ON leads
  FOR UPDATE
  TO anon
  USING (false);

DROP POLICY IF EXISTS leads_anon_no_delete ON leads;
CREATE POLICY leads_anon_no_delete ON leads
  FOR DELETE
  TO anon
  USING (false);

-- ================================================================
-- universities — public reference, anon SELECT allowed
-- ================================================================
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS universities_anon_read ON universities;
CREATE POLICY universities_anon_read ON universities
  FOR SELECT
  TO anon
  USING (true);

-- ================================================================
-- courses — public reference, anon SELECT allowed
-- ================================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS courses_anon_read ON courses;
CREATE POLICY courses_anon_read ON courses
  FOR SELECT
  TO anon
  USING (true);

-- ================================================================
-- Post-apply verification queries
-- Run in Supabase SQL Editor as postgres user (or via psql with SUPABASE_DB_URL)
-- Reference: docs/compliance-attestation-v1.md §3.1
--   SELECT relname, relrowsecurity FROM pg_class
--     WHERE relname IN ('leads','universities','courses');
--   SELECT has_table_privilege('anon', 'leads', 'INSERT');    -- expect: true
--   SELECT has_table_privilege('anon', 'leads', 'SELECT');    -- expect: false (RLS default-deny)
--   SELECT has_table_privilege('anon', 'universities', 'SELECT'); -- expect: true
-- ================================================================
