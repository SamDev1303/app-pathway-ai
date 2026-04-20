-- Atlas AI — Phase 5 wave 0: chat audit tables
-- Region: ap-southeast-2 (Sydney) — project fprqcugrmjvgrtbtohbf
-- Apply via: supabase db push
-- Prerequisites: 001-007 applied.
--
-- Design intent: MARA belt-and-braces audit trail.
--   * mara_deflections — every time the prompt or post-filter aborts a stream
--     on a visa/PR/migration trigger. Compliance auditors can verify that
--     deflection is actually happening (not just a prompt claim).
--   * chat_dataset_gaps — every "not in my dataset" fallback. Product signal
--     for which universities/topics to seed next.
--
-- Anon: NO access. Service role writes from /api/chat route.

CREATE TABLE IF NOT EXISTS mara_deflections (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id         uuid,              -- FK added in 009 after chat_sessions exists
  user_message       text NOT NULL,
  triggered_phrase   text NOT NULL,     -- the matched keyword/regex fragment
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mara_deflections_created_at ON mara_deflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mara_deflections_session    ON mara_deflections(session_id);

CREATE TABLE IF NOT EXISTS chat_dataset_gaps (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   uuid,                     -- FK added in 009 after chat_sessions exists
  user_message text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_dataset_gaps_created_at ON chat_dataset_gaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_dataset_gaps_session    ON chat_dataset_gaps(session_id);

-- ================================================================
-- RLS — service role only
-- ================================================================
ALTER TABLE mara_deflections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_dataset_gaps  ENABLE ROW LEVEL SECURITY;
-- No anon policies = default-deny.
