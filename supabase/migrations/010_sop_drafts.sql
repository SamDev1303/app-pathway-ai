-- Atlas AI — Phase 6 Wave 0: sop_drafts versioning table
-- Region: ap-southeast-1 (project fprqcugrmjvgrtbtohbf)
-- Apply via: supabase db push
-- Prerequisites: 001–009 applied.
--
-- Design intent (P6 CONTEXT D1):
--   * One row per SOP draft per lead. parent_draft_id gives us the edit tree
--     for free without bloating leads.row on many revisions.
--   * version_number is MAX(version_number where lead_id=...) + 1 at insert
--     time (computed in /api/sop route, not a DB trigger — keeps migration
--     idempotent + lets route handle race conditions explicitly).
--   * UNIQUE(lead_id, version_number) is the authoritative concurrency guard:
--     concurrent regenerations that both compute the same MAX+1 will see one
--     succeed and the other fail with Postgres error 23505 (unique_violation).
--     The route retries on 23505 up to 3x — see /api/sop route.ts.
--   * Service-role-only RLS (mirrors migrations 007/008/009). Anon and authed
--     users never touch this table directly; all writes go through the
--     service-role client inside /api/sop.
--
-- Idempotent pattern mirrored from migration 007.

CREATE TABLE IF NOT EXISTS sop_drafts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id            uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  parent_draft_id    uuid REFERENCES sop_drafts(id) ON DELETE SET NULL,
  version_number     int NOT NULL,
  full_text          text NOT NULL,
  sections           jsonb,
  model              text NOT NULL,
  edited_from_section text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sop_drafts_lead_version_unique UNIQUE (lead_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_sop_drafts_lead
  ON sop_drafts(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sop_drafts_parent
  ON sop_drafts(parent_draft_id);

-- ================================================================
-- RLS — service role only
-- ================================================================
ALTER TABLE sop_drafts ENABLE ROW LEVEL SECURITY;
-- No anon / authenticated policies = default-deny.
-- Service role bypasses RLS by design (Supabase core behaviour).
