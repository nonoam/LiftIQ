-- LiftIQ: Row Level Security Policies

ALTER TABLE muscle_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations     ENABLE ROW LEVEL SECURITY;

-- ─── MUSCLE GROUPS ─── publicly readable ───
CREATE POLICY "muscle_groups_select" ON muscle_groups
  FOR SELECT USING (TRUE);

-- ─── EXERCISES ───
-- Global catalog is public; custom exercises visible only to creator
CREATE POLICY "exercises_select" ON exercises
  FOR SELECT USING (is_custom = FALSE OR created_by = auth.uid());

CREATE POLICY "exercises_insert" ON exercises
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_custom = TRUE
    AND created_by = auth.uid()
  );

CREATE POLICY "exercises_update" ON exercises
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "exercises_delete" ON exercises
  FOR DELETE USING (created_by = auth.uid());

-- ─── EXERCISE MEDIA ─── publicly readable ───
CREATE POLICY "exercise_media_select" ON exercise_media
  FOR SELECT USING (TRUE);

-- Service role can insert/update media (used by admin seed scripts)
CREATE POLICY "exercise_media_service_insert" ON exercise_media
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ─── USER PROFILES ───
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ─── BODY WEIGHT HISTORY ───
CREATE POLICY "body_weight_all" ON body_weight_history
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── ROUTINES ───
CREATE POLICY "routines_all" ON routines
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── ROUTINE EXERCISES ───
CREATE POLICY "routine_exercises_all" ON routine_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE id = routine_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE id = routine_id AND user_id = auth.uid()
    )
  );

-- ─── WORKOUT SESSIONS ───
CREATE POLICY "workout_sessions_all" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── WORKOUT SETS ───
CREATE POLICY "workout_sets_all" ON workout_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- ─── PROGRESS PREDICTIONS ───
CREATE POLICY "predictions_select" ON progress_predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "predictions_insert" ON progress_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "predictions_update" ON progress_predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── AI CONVERSATIONS ───
CREATE POLICY "ai_conversations_all" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
