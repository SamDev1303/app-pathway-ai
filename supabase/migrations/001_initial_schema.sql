-- Atlas AI — Phase 1 initial schema
-- Region: ap-southeast-2 (Sydney)
-- Apply via: supabase db push (or Supabase dashboard SQL editor)
-- Prerequisites: Supabase project created; pgvector extension enabled.
--
-- Audit trail: this schema matches PRD.md §5 and PHASE.md P1/P2/P3/P5 specs.
-- Changes here MUST update SOURCECODE.md database schema section in the same commit.

-- ================================================================
-- Extensions
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================================
-- universities — 43 AU unis, seeded from CRICOS open data + public uni pages
-- ================================================================
CREATE TABLE universities (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                 text UNIQUE NOT NULL,
  name                 text NOT NULL,
  short_name           text NOT NULL,
  city                 text NOT NULL,
  state                text NOT NULL, -- NSW / VIC / QLD / WA / SA / TAS / ACT / NT
  cricos_provider_code text,          -- e.g. "00026A"
  qs_ranking_2025      int,
  is_group_of_eight    boolean NOT NULL DEFAULT false,
  is_regional          boolean NOT NULL DEFAULT false,
  website              text,
  logo_letter          text,          -- for the rendered badge
  hero_color           text,          -- hex
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_universities_state ON universities(state);
CREATE INDEX idx_universities_go8 ON universities(is_group_of_eight);

-- ================================================================
-- courses — CRICOS-registered courses only (QEAC rule)
-- ================================================================
CREATE TABLE courses (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id    uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  cricos_code      text,             -- CRICOS course code — MUST be non-null for production rows
  name             text NOT NULL,
  level            text NOT NULL,    -- undergraduate | postgraduate | pathway
  field            text NOT NULL,    -- IT | Engineering | Health | Business | ...
  duration_months  int NOT NULL,
  indicative_fee   int,              -- AUD/year
  ielts_overall    numeric(2,1),
  intake_months    int[],            -- [2, 5, 7, 10]
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_university ON courses(university_id);
CREATE INDEX idx_courses_field ON courses(field);
CREATE INDEX idx_courses_level ON courses(level);

-- ================================================================
-- leads — atomic-write only after step-5 consent. Privacy Act 1988 compliant.
-- ================================================================
CREATE TABLE leads (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Step 1 (personal)
  full_name                 text NOT NULL,
  email                     text NOT NULL,
  phone                     text,
  country                   text,
  -- Step 2 (academic)
  highest_qualification     text,
  gpa                       numeric(3,2),
  ielts_overall             numeric(2,1),
  -- Step 3 (preferences)
  preferred_fields          text[],
  preferred_levels          text[],
  preferred_intake_month    int,
  -- Step 4 (budget)
  tuition_budget_aud        int,
  living_budget_aud         int,
  -- Step 5 (contact + consent)
  preferred_contact_channel text,
  notes                     text,
  -- Consent (per Privacy Act 1988 APP 3 + 5; service vs marketing split)
  consent_given_at          timestamptz NOT NULL,
  consent_wording_version   text NOT NULL,    -- e.g. "v1.0-2026-04-17"
  consent_service           boolean NOT NULL, -- REQUIRED true on insert (enforced by CHECK)
  consent_marketing         boolean NOT NULL DEFAULT false,
  -- Derived
  lead_score                int,
  matched_university_ids    uuid[],
  -- Meta
  user_agent                text,
  locale                    text,
  created_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT leads_consent_service_must_be_true CHECK (consent_service = true),
  CONSTRAINT leads_email_basic_shape CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);

-- ================================================================
-- embeddings — pgvector for RAG. P5 populates; anon never reads.
-- ================================================================
CREATE TABLE embeddings (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type  text NOT NULL,           -- university | course | knowledge (CRICOS metadata only — NO visa/migration content)
  source_id    uuid,
  content      text NOT NULL,
  embedding    vector(1536) NOT NULL,   -- OpenAI text-embedding-3-small
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_embeddings_hnsw ON embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_embeddings_source ON embeddings(source_type, source_id);

-- ================================================================
-- Row-Level Security (P2 + P4.5 responsibility)
-- ================================================================
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings   ENABLE ROW LEVEL SECURITY;

-- universities + courses: public read (anon) — they're CRICOS-public data
CREATE POLICY universities_anon_read ON universities FOR SELECT TO anon USING (true);
CREATE POLICY courses_anon_read      ON courses      FOR SELECT TO anon USING (true);

-- leads: anon INSERT-only (NO read/update/delete). Service role owns all reads.
CREATE POLICY leads_anon_insert ON leads FOR INSERT TO anon WITH CHECK (true);
-- NO select/update/delete policy for anon — RLS default denies.

-- embeddings: anon NO access. Service role only (P5 populates + reads).
-- No policy for anon means all operations denied.

-- Service role bypasses RLS by default in Supabase.

-- ================================================================
-- Audit: encryption at rest is provided by Supabase Postgres (AES-256 default).
-- Encryption in transit: TLS 1.2+ required for all connections.
-- See PHASE.md P4.5 (Vector mini round-2 finding) for verification task.
-- ================================================================
