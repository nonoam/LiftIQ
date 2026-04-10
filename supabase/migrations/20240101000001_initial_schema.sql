-- LiftIQ: Initial Schema
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────────
-- MUSCLE GROUPS
-- ─────────────────────────────────────────────
CREATE TABLE muscle_groups (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  name_es       TEXT,
  slug          TEXT        NOT NULL UNIQUE,
  body_region   TEXT        NOT NULL CHECK (body_region IN ('upper', 'lower', 'core')),
  body_side     TEXT        CHECK (body_side IN ('anterior', 'posterior', 'both')),
  svg_path_id   TEXT,       -- corresponds to <path id="..."> in the SVG muscle map
  color_hex     TEXT        DEFAULT '#6366F1',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXERCISES (global catalog + user custom)
-- ─────────────────────────────────────────────
CREATE TABLE exercises (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT        NOT NULL,
  name_es                     TEXT,
  primary_muscle_group_id     UUID        NOT NULL REFERENCES muscle_groups(id),
  secondary_muscle_group_ids  UUID[]      NOT NULL DEFAULT '{}',
  movement_type               TEXT        NOT NULL CHECK (movement_type IN ('compound', 'isolation')),
  equipment                   TEXT        NOT NULL CHECK (equipment IN (
    'barbell','dumbbell','cable','machine','smith_machine',
    'bodyweight','kettlebell','resistance_band','ez_bar',
    'trap_bar','pull_up_bar','dip_bars','other'
  )),
  instructions                TEXT,
  is_custom                   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by                  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  wger_id                     INTEGER,
  exercisedb_id               TEXT,
  is_active                   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXERCISE MEDIA
-- ─────────────────────────────────────────────
CREATE TABLE exercise_media (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id   UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  media_type    TEXT        NOT NULL CHECK (media_type IN ('gif', 'video', 'image')),
  url           TEXT        NOT NULL,
  storage_path  TEXT,       -- path in Supabase Storage (exercises-media bucket)
  is_primary    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- USER PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE user_profiles (
  id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT        UNIQUE,
  display_name          TEXT,
  avatar_url            TEXT,
  goal                  TEXT        CHECK (goal IN ('strength', 'hypertrophy', 'endurance')),
  experience_level      TEXT        CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  default_rest_seconds  INTEGER     NOT NULL DEFAULT 90,
  progression_type      TEXT        NOT NULL DEFAULT 'linear'
                                    CHECK (progression_type IN ('linear', 'double', 'undulating')),
  weight_unit           TEXT        NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  theme                 TEXT        NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  notification_reminder BOOLEAN     NOT NULL DEFAULT TRUE,
  reminder_time         TIME        DEFAULT '09:00:00',
  is_premium            BOOLEAN     NOT NULL DEFAULT FALSE,
  onboarding_complete   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- BODY WEIGHT HISTORY
-- ─────────────────────────────────────────────
CREATE TABLE body_weight_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg     DECIMAL(5,2) NOT NULL,
  recorded_at   DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recorded_at)
);

-- ─────────────────────────────────────────────
-- ROUTINES
-- ─────────────────────────────────────────────
CREATE TABLE routines (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                        TEXT        NOT NULL,
  description                 TEXT,
  estimated_duration_minutes  INTEGER,
  is_archived                 BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROUTINE EXERCISES (ordered exercises within a routine)
-- ─────────────────────────────────────────────
CREATE TABLE routine_exercises (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id        UUID        NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id       UUID        NOT NULL REFERENCES exercises(id),
  position          INTEGER     NOT NULL,  -- 0-indexed display order
  target_sets       INTEGER     NOT NULL DEFAULT 3,
  target_reps_min   INTEGER,
  target_reps_max   INTEGER,
  target_weight_kg  DECIMAL(6,2),
  target_rpe        DECIMAL(3,1) CHECK (target_rpe >= 1 AND target_rpe <= 10),
  rest_seconds      INTEGER     NOT NULL DEFAULT 90,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, position)
);

-- ─────────────────────────────────────────────
-- WORKOUT SESSIONS
-- ─────────────────────────────────────────────
CREATE TABLE workout_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id       UUID        REFERENCES routines(id) ON DELETE SET NULL,
  name             TEXT        NOT NULL,
  notes            TEXT,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  duration_seconds INTEGER,
  body_weight_kg   DECIMAL(5,2),
  is_synced        BOOLEAN     NOT NULL DEFAULT TRUE,   -- FALSE = originated offline
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- WORKOUT SETS
-- ─────────────────────────────────────────────
CREATE TABLE workout_sets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id   UUID        NOT NULL REFERENCES exercises(id),
  set_number    INTEGER     NOT NULL,
  weight_kg     DECIMAL(6,2),
  reps          INTEGER,
  rpe           DECIMAL(3,1) CHECK (rpe >= 1 AND rpe <= 10),
  is_warmup     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_dropset    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_failure    BOOLEAN     NOT NULL DEFAULT FALSE,
  notes         TEXT,
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROGRESS PREDICTIONS (generated by Edge Functions)
-- ─────────────────────────────────────────────
CREATE TABLE progress_predictions (
  id                             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id                    UUID        NOT NULL REFERENCES exercises(id),
  suggested_weight_kg            DECIMAL(6,2),
  suggested_reps_min             INTEGER,
  suggested_reps_max             INTEGER,
  suggested_sets                 INTEGER,
  progression_type               TEXT        NOT NULL
                                             CHECK (progression_type IN ('linear', 'double', 'undulating')),
  is_deload_suggested            BOOLEAN     NOT NULL DEFAULT FALSE,
  plateau_detected               BOOLEAN     NOT NULL DEFAULT FALSE,
  consecutive_weeks_no_progress  INTEGER     NOT NULL DEFAULT 0,
  confidence_score               DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning                      TEXT,
  based_on_sessions              INTEGER     NOT NULL DEFAULT 0,
  generated_at                   TIMESTAMPTZ DEFAULT NOW(),
  expires_at                     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at                        TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- AI CONVERSATIONS (reserved for future AI integration)
-- ─────────────────────────────────────────────
CREATE TABLE ai_conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  messages    JSONB       NOT NULL DEFAULT '[]'::JSONB,
  context     JSONB               DEFAULT '{}'::JSONB,
  is_archived BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TRIGGERS: updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
