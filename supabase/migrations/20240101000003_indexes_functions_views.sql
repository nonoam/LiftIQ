-- LiftIQ: Indexes, Helper Functions, and Views

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

-- Exercises: filterable fields + full-text search
CREATE INDEX idx_exercises_primary_muscle   ON exercises(primary_muscle_group_id);
CREATE INDEX idx_exercises_equipment        ON exercises(equipment);
CREATE INDEX idx_exercises_movement_type    ON exercises(movement_type);
CREATE INDEX idx_exercises_is_custom        ON exercises(is_custom);
CREATE INDEX idx_exercises_created_by       ON exercises(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_exercises_name_trgm        ON exercises USING gin(name gin_trgm_ops);
CREATE INDEX idx_exercises_name_es_trgm     ON exercises USING gin(name_es gin_trgm_ops) WHERE name_es IS NOT NULL;
CREATE INDEX idx_exercises_active           ON exercises(is_active) WHERE is_active = TRUE;

-- Exercise Media
CREATE INDEX idx_exercise_media_exercise    ON exercise_media(exercise_id);
CREATE INDEX idx_exercise_media_primary     ON exercise_media(exercise_id, is_primary) WHERE is_primary = TRUE;

-- Body Weight History
CREATE INDEX idx_body_weight_user_date      ON body_weight_history(user_id, recorded_at DESC);

-- Routines
CREATE INDEX idx_routines_user              ON routines(user_id);
CREATE INDEX idx_routines_user_archived     ON routines(user_id, is_archived);

-- Routine Exercises
CREATE INDEX idx_routine_exercises_routine  ON routine_exercises(routine_id, position);
CREATE INDEX idx_routine_exercises_exercise ON routine_exercises(exercise_id);

-- Workout Sessions
CREATE INDEX idx_sessions_user_started      ON workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_sessions_user_routine      ON workout_sessions(user_id, routine_id) WHERE routine_id IS NOT NULL;
CREATE INDEX idx_sessions_finished          ON workout_sessions(user_id, finished_at DESC)
  WHERE finished_at IS NOT NULL;

-- Workout Sets
CREATE INDEX idx_sets_session               ON workout_sets(session_id);
CREATE INDEX idx_sets_exercise              ON workout_sets(exercise_id);
CREATE INDEX idx_sets_session_exercise      ON workout_sets(session_id, exercise_id);

-- Progress Predictions
CREATE INDEX idx_predictions_user_exercise  ON progress_predictions(user_id, exercise_id, generated_at DESC);
CREATE INDEX idx_predictions_active         ON progress_predictions(user_id, expires_at)
  WHERE used_at IS NULL;

-- AI Conversations
CREATE INDEX idx_ai_user_created            ON ai_conversations(user_id, created_at DESC);

-- ─────────────────────────────────────────────
-- HELPER FUNCTIONS: 1RM Calculations
-- ─────────────────────────────────────────────

-- Epley formula: 1RM = weight × (1 + reps/30)
CREATE OR REPLACE FUNCTION calculate_epley_1rm(weight DECIMAL, reps INTEGER)
RETURNS DECIMAL AS $$
BEGIN
  IF reps IS NULL OR weight IS NULL OR reps <= 0 OR weight <= 0 THEN RETURN NULL; END IF;
  IF reps = 1 THEN RETURN weight; END IF;
  RETURN ROUND(weight * (1.0 + reps::DECIMAL / 30.0), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Brzycki formula: 1RM = weight × 36 / (37 - reps)
CREATE OR REPLACE FUNCTION calculate_brzycki_1rm(weight DECIMAL, reps INTEGER)
RETURNS DECIMAL AS $$
BEGIN
  IF reps IS NULL OR weight IS NULL OR reps <= 0 OR weight <= 0 THEN RETURN NULL; END IF;
  IF reps = 1 THEN RETURN weight; END IF;
  IF reps >= 37 THEN RETURN weight; END IF;
  RETURN ROUND(weight * (36.0 / (37.0 - reps::DECIMAL)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Average of Epley + Brzycki for better accuracy
CREATE OR REPLACE FUNCTION calculate_estimated_1rm(weight DECIMAL, reps INTEGER)
RETURNS DECIMAL AS $$
BEGIN
  IF reps IS NULL OR weight IS NULL OR reps <= 0 OR weight <= 0 THEN RETURN NULL; END IF;
  IF reps = 1 THEN RETURN weight; END IF;
  RETURN ROUND(
    (calculate_epley_1rm(weight, reps) + calculate_brzycki_1rm(weight, reps)) / 2.0,
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────
-- HELPER FUNCTION: Volume calculation
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_session_volume(p_session_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(weight_kg * reps), 0)
  FROM workout_sets
  WHERE session_id = p_session_id
    AND is_warmup = FALSE
    AND weight_kg IS NOT NULL
    AND reps IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- ─────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────

-- Denormalized exercise history for efficient queries
CREATE OR REPLACE VIEW user_exercise_history AS
SELECT
  ws.user_id,
  wset.exercise_id,
  e.name                                                     AS exercise_name,
  ws.id                                                      AS session_id,
  ws.started_at,
  ws.routine_id,
  wset.id                                                    AS set_id,
  wset.set_number,
  wset.weight_kg,
  wset.reps,
  wset.rpe,
  wset.is_warmup,
  wset.is_dropset,
  wset.is_failure,
  calculate_estimated_1rm(wset.weight_kg, wset.reps)         AS estimated_1rm,
  (wset.weight_kg * wset.reps)                               AS set_volume_kg
FROM workout_sessions ws
JOIN workout_sets     wset ON wset.session_id  = ws.id
JOIN exercises        e    ON e.id             = wset.exercise_id
WHERE ws.finished_at IS NOT NULL
  AND wset.is_warmup = FALSE;

-- Weekly volume per muscle group (for dashboard + muscle map)
CREATE OR REPLACE VIEW weekly_volume_by_muscle AS
SELECT
  ws.user_id,
  e.primary_muscle_group_id                           AS muscle_group_id,
  mg.name                                             AS muscle_group_name,
  mg.slug                                             AS muscle_group_slug,
  DATE_TRUNC('week', ws.started_at AT TIME ZONE 'UTC') AS week_start,
  COALESCE(SUM(wset.weight_kg * wset.reps), 0)        AS total_volume_kg,
  COUNT(*)                                             AS total_sets,
  COUNT(DISTINCT ws.id)                                AS session_count,
  COUNT(DISTINCT DATE(ws.started_at))                  AS training_days
FROM workout_sessions  ws
JOIN workout_sets       wset ON wset.session_id        = ws.id
JOIN exercises          e    ON e.id                   = wset.exercise_id
JOIN muscle_groups      mg   ON mg.id                  = e.primary_muscle_group_id
WHERE ws.finished_at IS NOT NULL
  AND wset.is_warmup = FALSE
GROUP BY ws.user_id, e.primary_muscle_group_id, mg.name, mg.slug,
         DATE_TRUNC('week', ws.started_at AT TIME ZONE 'UTC');

-- Latest 1RM per exercise per user (for progress tracking)
CREATE OR REPLACE VIEW latest_1rm_per_exercise AS
SELECT DISTINCT ON (user_id, exercise_id)
  user_id,
  exercise_id,
  exercise_name,
  session_id,
  started_at,
  MAX(estimated_1rm) OVER (PARTITION BY user_id, exercise_id, session_id) AS session_best_1rm,
  started_at                                                               AS achieved_at
FROM user_exercise_history
WHERE estimated_1rm IS NOT NULL
ORDER BY user_id, exercise_id, started_at DESC;

-- Storage bucket for exercise media (run manually or via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exercises-media', 'exercises-media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false);
