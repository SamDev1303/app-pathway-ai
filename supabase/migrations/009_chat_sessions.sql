-- Atlas AI — Phase 5 wave 0: chat session + message persistence
-- Region: ap-southeast-2 (Sydney) — project fprqcugrmjvgrtbtohbf
-- Apply via: supabase db push
-- Prerequisites: 001-008 applied.
--
-- Design intent: persistent chat history keyed by an httpOnly cookie token.
-- If the user has a lead_id (from the matcher form), we link it so the
-- advisor can see prior context and the CRM gets chat transcripts.

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token   text UNIQUE NOT NULL,
  lead_id         uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_active_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_token    ON chat_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_lead     ON chat_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_act ON chat_sessions(last_active_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role                  text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content               text NOT NULL,
  retrieved_course_ids  uuid[],
  deflected             boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON chat_messages(session_id, created_at);

-- Back-fill FK on audit tables now that chat_sessions exists. Guarded so
-- re-running the migration is safe (ADD CONSTRAINT has no IF NOT EXISTS).
DO $$ BEGIN
  ALTER TABLE mara_deflections
    ADD CONSTRAINT mara_deflections_session_fk
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE chat_dataset_gaps
    ADD CONSTRAINT chat_dataset_gaps_session_fk
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- RLS — service role only
-- ================================================================
ALTER TABLE chat_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;
-- No anon policies = default-deny.
