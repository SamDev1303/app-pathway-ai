-- Atlas AI — Phase 3.1 leads.status column (supports Admin Dashboard via Supabase Studio)
-- Region: ap-southeast-1 (Singapore)
-- Apply via: supabase db push (or Supabase dashboard SQL editor)
-- Prerequisites: 001_initial_schema.sql applied; leads table exists.
--
-- Why this exists: PRD-CLIENT.md §A row 1 claims UniMate gets a working dashboard
-- on Day 1 via Supabase Studio (list + filter + profile + notes + STATUS workflow).
-- The first four come free with Studio; status requires this column.
-- No price change — 4 lines of SQL, shipped inside v1 scope.

-- ================================================================
-- status enum — tight taxonomy for v1; v2 can extend via ALTER TYPE
-- ================================================================
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'converted');

ALTER TABLE leads
  ADD COLUMN status lead_status NOT NULL DEFAULT 'new',
  ADD COLUMN status_updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_status_updated_at ON leads(status_updated_at DESC);

-- ================================================================
-- Trigger: auto-stamp status_updated_at when status changes.
-- Lets UniMate edit the `status` column in Supabase Studio and get
-- accurate "last touched" timestamps without any custom UI.
-- ================================================================
CREATE OR REPLACE FUNCTION stamp_lead_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_status_stamp
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION stamp_lead_status_updated_at();

-- ================================================================
-- RLS note: service role edits status via Studio. Anon cannot touch
-- leads beyond INSERT (already enforced by 001_initial_schema.sql).
-- No new policies needed.
-- ================================================================
