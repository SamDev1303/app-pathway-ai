-- Atlas AI — P4 UniMatch engine RPC
-- Region: ap-southeast-1 (Singapore)
-- Apply via: supabase db push (applied AFTER 003_match_prep.sql)
-- Prerequisites: 003_match_prep.sql applied (needs industry_placement + matches/token columns).
--
-- Function signature deviation from CONTEXT R-2 (locked RETURNS TABLE):
-- We RETURN jsonb + self-UPDATE leads.matches as side effect. Rationale documented
-- in .planning/research/4-RESEARCH.md §"RPC Failure Handling — Revised RPC signature"
-- and .planning/4-PLAN.md §Deviations from CONTEXT — Delta 1.
--
-- Regional heuristic: REJECTED by Gideon plan-check round 1 (2026-04-19).
-- v1 has no preferred_state column and inferring regional intent from
-- preferred_fields was judged scope drift. regional_score is hard-zero; the
-- column still exists in the weight jsonb for v2 once a real signal is captured.
-- See 4-PLAN.md §"Deviations from CONTEXT — Delta 2" for the ruling.

CREATE OR REPLACE FUNCTION public.match_unis_for_lead(
  p_lead_id uuid,
  p_weights jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Landmine #1: prevent search_path hijack; fully qualify all refs
AS $$
DECLARE
  v_lead record;
  v_matches jsonb;
  -- weights unpacked from p_weights
  v_w_field numeric;
  v_w_level numeric;
  v_w_budget numeric;
  v_w_ielts numeric;
  v_w_qs numeric;
  v_w_g8 numeric;
  v_w_placement numeric;
  v_w_regional numeric;
  v_w_intake numeric;
  v_lead_prioritizes_outcomes boolean;
BEGIN
  -- ------------------------------------------------------------------
  -- Load lead profile (fully qualified per search_path='')
  -- ------------------------------------------------------------------
  SELECT id, preferred_fields, preferred_levels, preferred_intake_month,
         tuition_budget_aud, ielts_overall
  INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead % not found', p_lead_id;
  END IF;

  -- prioritize_outcomes is not captured anywhere in the P3 lead flow (only in the
  -- retained pre-P3 MatcherForm scaffold). Per 4-PLAN.md Delta 3 (Gideon round-1
  -- REJECT) we do not infer it from preferred_fields — that was judged scope drift.
  -- Weight `industry_placement` is 0 in the passed-in jsonb. The branch below stays
  -- in place so a future phase can flip it on by capturing a real signal.
  v_lead_prioritizes_outcomes := false;

  -- ------------------------------------------------------------------
  -- Unpack weights jsonb → numeric locals
  -- ------------------------------------------------------------------
  v_w_field     := (p_weights->>'field')::numeric;
  v_w_level     := (p_weights->>'level')::numeric;
  v_w_budget    := (p_weights->>'budget')::numeric;
  v_w_ielts     := (p_weights->>'ielts')::numeric;
  v_w_qs        := (p_weights->>'qs_rank')::numeric;
  v_w_g8        := (p_weights->>'g8')::numeric;
  v_w_placement := (p_weights->>'industry_placement')::numeric;
  v_w_regional  := (p_weights->>'regional')::numeric;
  v_w_intake    := (p_weights->>'intake')::numeric;

  -- ------------------------------------------------------------------
  -- Score all courses via chained CTEs
  -- ------------------------------------------------------------------
  WITH course_scores AS (
    SELECT
      c.id                AS course_id,
      c.university_id,
      c.name              AS course_name,
      c.field,
      c.level,
      c.indicative_fee,
      c.ielts_overall     AS course_ielts,
      c.industry_placement,
      u.name              AS uni_name,
      u.short_name,
      u.qs_ranking_2025,
      u.is_group_of_eight,
      u.is_regional,
      u.city,
      u.state,
      -- field_score — Landmine #6: NULL preferred_fields → half-score (not 0)
      CASE
        WHEN v_lead.preferred_fields IS NULL
          OR array_length(v_lead.preferred_fields, 1) IS NULL THEN v_w_field / 2
        WHEN c.field = ANY(v_lead.preferred_fields) THEN v_w_field
        ELSE 0
      END AS field_score,
      -- level_score — empty/NULL preferred_levels → full (student didn't filter)
      CASE
        WHEN v_lead.preferred_levels IS NULL
          OR array_length(v_lead.preferred_levels, 1) IS NULL THEN v_w_level
        WHEN c.level = ANY(v_lead.preferred_levels) THEN v_w_level
        ELSE 0
      END AS level_score,
      -- budget_score — stretch math per Research §Stretch Math
      CASE
        WHEN v_lead.tuition_budget_aud IS NULL THEN v_w_budget / 2
        WHEN c.indicative_fee IS NULL THEN v_w_budget / 2
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud THEN v_w_budget
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud * 1.20 THEN v_w_budget / 2
        WHEN c.indicative_fee <= v_lead.tuition_budget_aud * 1.50 THEN 0
        ELSE -1  -- sentinel: hard-cut, course excluded downstream
      END AS budget_score,
      -- ielts_score — stretch math
      CASE
        WHEN v_lead.ielts_overall IS NULL THEN v_w_ielts / 2
        WHEN c.ielts_overall IS NULL THEN v_w_ielts / 2
        WHEN v_lead.ielts_overall >= c.ielts_overall THEN v_w_ielts
        WHEN v_lead.ielts_overall >= c.ielts_overall - 0.5 THEN v_w_ielts / 2
        ELSE -1  -- sentinel: hard-cut
      END AS ielts_score,
      -- qs_score — scaled 0..v_w_qs; unranked unis (NULL) treated as rank 999
      GREATEST(0, v_w_qs * (1 - COALESCE(u.qs_ranking_2025, 999)::numeric / 200)) AS qs_score,
      -- g8_score
      CASE WHEN u.is_group_of_eight THEN v_w_g8 ELSE 0 END AS g8_score,
      -- placement_score — triggers only when student's field matches AND course has placement
      CASE
        WHEN v_lead_prioritizes_outcomes
         AND c.field = ANY(COALESCE(v_lead.preferred_fields, ARRAY[]::text[]))
         AND c.industry_placement
        THEN v_w_placement
        ELSE 0
      END AS placement_score,
      -- regional_score — heuristic REJECTED round 1; hard-zero.
      -- v_w_regional is 0 in the passed weight vector; no preferred_state column
      -- exists to drive this signal. A v2 phase will reintroduce this branch once
      -- the signal is captured.
      0::numeric AS regional_score,
      -- intake_score
      CASE
        WHEN v_lead.preferred_intake_month IS NULL THEN v_w_intake / 2
        WHEN v_lead.preferred_intake_month = ANY(c.intake_months) THEN v_w_intake
        ELSE 0
      END AS intake_score
    FROM public.courses c
    JOIN public.universities u ON c.university_id = u.id
  ),
  course_totals AS (
    SELECT *,
      -- total_score: sum of all signals, treating -1 sentinels as 0
      CASE WHEN budget_score < 0 THEN 0 ELSE budget_score END
      + CASE WHEN ielts_score < 0 THEN 0 ELSE ielts_score END
      + field_score + level_score
      + qs_score + g8_score + placement_score + regional_score + intake_score
      AS total_score,
      -- hard_cut: exclude from matches entirely
      (budget_score < 0 OR ielts_score < 0 OR field_score = 0) AS hard_cut,
      -- stretch_flag: 50%-of-weight on budget OR ielts (but not hard-cut)
      (budget_score < 0 OR ielts_score < 0) = false
      AND (budget_score = v_w_budget / 2 OR ielts_score = v_w_ielts / 2)
      AS stretch_flag
    FROM course_scores
  ),
  uni_best AS (
    -- Per R-1: per-uni score = max(course_score). DISTINCT ON keeps the best course per uni.
    SELECT DISTINCT ON (university_id) *
    FROM course_totals
    WHERE NOT hard_cut
    ORDER BY university_id, total_score DESC
  ),
  ranked AS (
    -- Per R-3: order by total desc, tiebreak QS asc, G8 desc, name asc
    SELECT *,
      ROW_NUMBER() OVER (
        ORDER BY total_score DESC,
                 qs_ranking_2025 ASC NULLS LAST,
                 is_group_of_eight DESC,
                 uni_name ASC
      ) AS rn
    FROM uni_best
  ),
  top_score AS (
    SELECT total_score AS max_score FROM ranked WHERE rn = 1
  ),
  enriched AS (
    -- Build the per-match jsonb shape consumed by match-schema.ts MatchResultSchema
    SELECT
      r.*,
      jsonb_build_object(
        'uni_id',      r.university_id,
        'uni_name',    r.uni_name,
        'short_name',  r.short_name,
        'course_name', r.course_name,
        'match_pct',   ROUND(
          100.0 * r.total_score / NULLIF((SELECT max_score FROM top_score), 0)
        )::int,
        'reason_parts', jsonb_build_object(
          'matched_fields',   ARRAY[r.field],
          'budget_verdict',
            CASE
              WHEN r.budget_score = v_w_budget THEN 'within'
              WHEN r.budget_score = v_w_budget / 2 THEN 'stretch'
              ELSE 'far_stretch'
            END,
          'ielts_verdict',
            CASE
              WHEN r.ielts_score = v_w_ielts THEN 'meets'
              WHEN r.ielts_score = v_w_ielts / 2 THEN 'stretch'
              ELSE 'below'
            END,
          'qs_rank',            r.qs_ranking_2025,
          'g8',                 r.is_group_of_eight,
          'industry_placement', r.industry_placement,
          'regional',           r.is_regional,
          'intake_hit',         r.intake_score = v_w_intake,
          'best_course_name',   r.course_name
        ),
        'stretch_reason',
          CASE
            WHEN r.budget_score = v_w_budget / 2 AND v_lead.tuition_budget_aud IS NOT NULL THEN
              'Tuition above your stated budget by roughly ' ||
              ROUND(100.0 * (r.indicative_fee - v_lead.tuition_budget_aud) / v_lead.tuition_budget_aud)::text ||
              '%.'
            WHEN r.ielts_score = v_w_ielts / 2 THEN
              'IELTS 0.5 band below the course requirement.'
            ELSE NULL
          END
      ) AS match_row
    FROM ranked r
  )
  -- ------------------------------------------------------------------
  -- Classify strong vs stretch BY TIER (stretch_flag), then cap 3 + 2.
  -- Per W-3: "Matches" (hard fit) + "Stretch" (within budget/IELTS tolerance).
  -- Gideon plan-check round 1 Blocker #2: prior impl used rn <= 3 / rn BETWEEN 4 AND 5
  -- which could leak stretch into strong and include non-stretch rows as stretch.
  -- ------------------------------------------------------------------
  SELECT jsonb_build_object(
    'strong',
      COALESCE(
        (SELECT jsonb_agg(e.match_row ORDER BY e.rn)
         FROM (
           SELECT match_row, rn FROM enriched
           WHERE NOT stretch_flag
           ORDER BY rn ASC
           LIMIT 3
         ) e),
        '[]'::jsonb
      ),
    'stretch',
      COALESCE(
        (SELECT jsonb_agg(e.match_row ORDER BY e.rn)
         FROM (
           SELECT match_row, rn FROM enriched
           WHERE stretch_flag
           ORDER BY rn ASC
           LIMIT 2
         ) e),
        '[]'::jsonb
      ),
    'computed_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) INTO v_matches;

  -- ------------------------------------------------------------------
  -- Persist to the lead row (side effect — keeps single round-trip)
  -- ------------------------------------------------------------------
  UPDATE public.leads
  SET matches = v_matches,
      matches_computed_at = now()
  WHERE id = p_lead_id;

  RETURN v_matches;
END;
$$;

-- ================================================================
-- Landmine #2: Supabase auto-grants EXECUTE to anon/authenticated by default in
-- some configs. REVOKE explicitly + GRANT only to service_role.
-- ================================================================
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.match_unis_for_lead(uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.match_unis_for_lead(uuid, jsonb) TO service_role;
