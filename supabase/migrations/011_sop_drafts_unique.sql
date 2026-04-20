-- 011_sop_drafts_unique.sql
-- Retrofit UNIQUE(lead_id, version_number) on sop_drafts for environments
-- where migration 010 was applied BEFORE the inline constraint was added.
-- Idempotent: no-op if constraint already exists (fresh DBs from updated 010).

DO $$
BEGIN
  ALTER TABLE sop_drafts
    ADD CONSTRAINT sop_drafts_lead_version_unique UNIQUE (lead_id, version_number);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
