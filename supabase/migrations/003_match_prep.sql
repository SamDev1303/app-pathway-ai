-- Atlas AI — P4 UniMatch prep: add industry_placement, match storage, token
-- Region: ap-southeast-1 (Singapore)
-- Apply via: supabase db push (or Supabase Management API /v1/projects/{ref}/database/query)
-- Prerequisites: 001_initial_schema.sql + 002_leads_status.sql applied.
--
-- Why this exists: P4 UniMatch engine needs three schema additions the P1 schema file
-- deferred (industry_placement was in TS type only) or never built (matches/token
-- storage). Shipped as a discrete schema file so the plpgsql function in 004 has a
-- stable schema to reference.

-- ================================================================
-- courses.industry_placement — was in TS type (universities-seed.ts), missing in DB
-- Seed script (web/scripts/seed-universities.ts:24) explicitly flagged as P4's job
-- ================================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS industry_placement boolean NOT NULL DEFAULT false;

-- ================================================================
-- leads match result storage
-- ================================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS matches jsonb,
  ADD COLUMN IF NOT EXISTS matches_computed_at timestamptz,
  ADD COLUMN IF NOT EXISTS match_token uuid DEFAULT uuid_generate_v4();

-- ================================================================
-- Drop the array column (was scaffolded in P1, never populated, superseded by matches jsonb)
-- Pre-flight: per Research Landmine #7, verify no RLS policy references matched_university_ids.
-- P1 schema file added only leads_anon_insert (WITH CHECK (true)) — no column refs. Safe.
-- ================================================================
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS matched_university_ids;

-- ================================================================
-- Backfill match_token for any pre-existing rows (zero rows in prod today; safe no-op)
-- Must run BEFORE adding NOT NULL + UNIQUE so legacy rows without a default don't block.
-- ================================================================
UPDATE public.leads SET match_token = uuid_generate_v4() WHERE match_token IS NULL;

-- ================================================================
-- Enforce NOT NULL + UNIQUE (Landmine #4 — DEFAULT alone doesn't guarantee uniqueness)
-- ================================================================
ALTER TABLE public.leads
  ALTER COLUMN match_token SET NOT NULL;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_match_token_unique UNIQUE (match_token);

-- ================================================================
-- Token lookup index — /matches/{token} server component uses this exclusively
-- UNIQUE constraint creates a btree index automatically; keep an explicit named
-- index for grep-discoverability per `must_haves.artifacts`.
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_leads_match_token ON public.leads(match_token);

-- ================================================================
-- No RLS policy changes. anon still has INSERT-only (001 schema file).
-- match_token is returned in the 200 response from /api/leads; server-role reads
-- leads from /matches/[token] Server Component. No new anon SELECT path added.
-- ================================================================
