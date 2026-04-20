-- Atlas AI — Phase 5 wave 0: course embeddings (RAG retrieval)
-- Region: ap-southeast-2 (Sydney) — project fprqcugrmjvgrtbtohbf
-- Apply via: supabase db push
-- Prerequisites: 001-006 applied; `vector` extension enabled.
--
-- Design intent: P5 RAG grounding. The existing `embeddings` table (001) is
-- 1536-dim (OpenAI) and unused. P5 uses Gemini `gemini-embedding-001` at
-- 3072-dim, keyed directly by course_id for 1:1 lookup. Separate table keeps
-- dimensionality change + RLS posture explicit.
--
-- Anon: NO access. Service role populates + reads via /api/chat route.

CREATE TABLE course_embeddings (
  course_id   uuid PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  embedding   vector(3072) NOT NULL,
  content     text NOT NULL,
  model       text NOT NULL DEFAULT 'gemini-embedding-001',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- HNSW cosine index for fast semantic search.
-- m=16, ef_construction=64 balances build time + recall for ~200-row scale.
CREATE INDEX idx_course_embeddings_hnsw
  ON course_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ================================================================
-- RPC: match_courses_for_chat — pgvector cosine similarity search
-- Callable by service_role only (RLS blocks anon).
-- ================================================================
CREATE OR REPLACE FUNCTION match_courses_for_chat(
  query_embedding vector(3072),
  top_k           int   DEFAULT 5,
  threshold       float DEFAULT 0.65
)
RETURNS TABLE (
  course_id      uuid,
  university_id  uuid,
  course_name    text,
  university_name text,
  level          text,
  field          text,
  cricos_code    text,
  similarity     float,
  content        text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ce.course_id,
    c.university_id,
    c.name         AS course_name,
    u.name         AS university_name,
    c.level,
    c.field,
    c.cricos_code,
    1 - (ce.embedding <=> query_embedding) AS similarity,
    ce.content
  FROM course_embeddings ce
  JOIN courses      c ON c.id = ce.course_id
  JOIN universities u ON u.id = c.university_id
  WHERE 1 - (ce.embedding <=> query_embedding) >= threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT top_k;
$$;

-- ================================================================
-- RLS — service role only
-- ================================================================
ALTER TABLE course_embeddings ENABLE ROW LEVEL SECURITY;
-- No policies for anon = default-deny. Service role bypasses RLS.

-- ================================================================
-- Verify:
--   SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'course_embeddings';
--   SELECT has_table_privilege('anon', 'course_embeddings', 'SELECT'); -- expect: false
-- ================================================================
