-- ═══════════════════════════════════════════════════════════════════════
-- LiftIQ — esquema base
--
-- Convenciones:
--   · Todo el peso se guarda en KILOS (weight_kg). Libras es solo una
--     preferencia de visualización, así las analíticas nunca son ambiguas.
--   · user_id está denormalizado en TODAS las tablas hijas para que las
--     políticas RLS sean comparaciones directas contra auth.uid() en vez
--     de subconsultas EXISTS (ver 0002_rls.sql).
--   · El esfuerzo se registra como RIR (repeticiones en reserva), entero
--     0..10. No se guarda RPE: es derivable como 10 - rir.
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ───────────────────────────────────────────────────────────────────────
-- Dominios de valores.
-- Enums nativos en vez de CHECK: dan autocompletado en los tipos
-- generados de TypeScript, que es exactamente lo que queremos en el
-- selector de ejercicios.
-- ───────────────────────────────────────────────────────────────────────
CREATE TYPE muscle_group AS ENUM (
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full_body'
);

CREATE TYPE equipment AS ENUM (
  'barbell', 'dumbbell', 'machine', 'cable',
  'bodyweight', 'kettlebell', 'band', 'other'
);

CREATE TYPE set_type AS ENUM ('working', 'warmup', 'dropset', 'failure');

CREATE TYPE weight_unit AS ENUM ('kg', 'lb');

-- ───────────────────────────────────────────────────────────────────────
-- updated_at automático
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────
-- profiles — extiende auth.users
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT,
  avatar_url           TEXT,
  weight_unit          weight_unit NOT NULL DEFAULT 'kg',
  default_rest_seconds INTEGER     NOT NULL DEFAULT 120
                                   CHECK (default_rest_seconds BETWEEN 0 AND 3600),
  onboarding_complete  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- El perfil se crea solo al registrarse, de modo que la app nunca tenga
-- que gestionar el caso "usuario autenticado sin fila en profiles".
-- SECURITY DEFINER porque el trigger corre en el esquema auth.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ───────────────────────────────────────────────────────────────────────
-- exercises — catálogo global (owner_id NULL) + ejercicios propios
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE exercises (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT         NOT NULL CHECK (length(btrim(name)) > 0),
  muscle_group  muscle_group NOT NULL,
  equipment     equipment    NOT NULL,
  is_custom     BOOLEAN      NOT NULL DEFAULT FALSE,
  owner_id      UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Un ejercicio global no tiene dueño y uno propio siempre lo tiene.
  -- Sin esto, un ejercicio "custom" con owner_id NULL sería visible para
  -- todo el mundo por la política de SELECT de 0002_rls.sql.
  CONSTRAINT exercises_ownership_consistent CHECK (
    (is_custom AND owner_id IS NOT NULL) OR
    (NOT is_custom AND owner_id IS NULL)
  )
);

-- Evita que el usuario cree dos veces el mismo ejercicio propio.
-- Índice único parcial en vez de UNIQUE de tabla: los globales
-- (owner_id NULL) quedan fuera y no chocan entre sí.
CREATE UNIQUE INDEX exercises_owner_name_unique
  ON exercises (owner_id, lower(btrim(name)))
  WHERE owner_id IS NOT NULL;

-- El catálogo global no puede tener nombres repetidos. Además da a
-- seed.sql un destino para ON CONFLICT, de modo que sea idempotente.
CREATE UNIQUE INDEX exercises_global_name_unique
  ON exercises (lower(btrim(name)))
  WHERE owner_id IS NULL;

-- ───────────────────────────────────────────────────────────────────────
-- routines / routine_exercises — plantillas reutilizables
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE routines (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL CHECK (length(btrim(name)) > 0),
  notes       TEXT,
  is_archived BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE routine_exercises (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id      UUID        NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- RESTRICT: borrar un ejercicio del catálogo jamás debe llevarse por
  -- delante rutinas ni historial.
  exercise_id     UUID        NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  position        INTEGER     NOT NULL CHECK (position >= 0),
  target_sets     INTEGER     CHECK (target_sets > 0),
  target_reps_min INTEGER     CHECK (target_reps_min >= 0),
  target_reps_max INTEGER     CHECK (target_reps_max >= 0),
  target_rir      INTEGER     CHECK (target_rir BETWEEN 0 AND 10),
  rest_seconds    INTEGER     CHECK (rest_seconds BETWEEN 0 AND 3600),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT routine_exercises_reps_range CHECK (
    target_reps_min IS NULL OR target_reps_max IS NULL
    OR target_reps_min <= target_reps_max
  ),

  -- DEFERRABLE es imprescindible: reordenar ejercicios arrastrándolos
  -- reescribe varias posiciones en una transacción y pasa por estados
  -- intermedios con duplicados.
  CONSTRAINT routine_exercises_position_unique
    UNIQUE (routine_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- ───────────────────────────────────────────────────────────────────────
-- workout_sessions / session_exercises / workout_sets — el registro real
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE workout_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- SET NULL: borrar la rutina no debe borrar los entrenos ya hechos.
  routine_id       UUID        REFERENCES routines(id) ON DELETE SET NULL,
  name             TEXT        NOT NULL DEFAULT 'Entreno',
  notes            TEXT,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  duration_seconds INTEGER     CHECK (duration_seconds >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT workout_sessions_finished_after_start CHECK (
    finished_at IS NULL OR finished_at >= started_at
  )
);

CREATE TRIGGER trg_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- El servidor es dueño de las dos marcas de tiempo.
--
-- started_at lo pone NOW() en el servidor, así que si finished_at lo
-- calculase el móvil, un reloj de teléfono unos segundos atrasado —cosa
-- habitual— daría finished_at < started_at y el CHECK rechazaría el
-- guardado justo al terminar de entrenar. Aquí se reescribe con la hora
-- del servidor y se recalcula la duración, de modo que nunca es negativa
-- ni depende de la precisión del reloj del dispositivo.
CREATE OR REPLACE FUNCTION finalise_workout_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
    NEW.finished_at      := GREATEST(NOW(), NEW.started_at);
    NEW.duration_seconds := GREATEST(
      0,
      EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at))::INTEGER
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workout_sessions_finalise
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION finalise_workout_session();

-- Como mucho una sesión abierta por usuario. Esto es lo que hace que
-- "continuar entreno" sea determinista en vez de una lista ambigua.
CREATE UNIQUE INDEX workout_sessions_one_active_per_user
  ON workout_sessions (user_id)
  WHERE finished_at IS NULL;

-- Capa intermedia: permite que un ejercicio esté en la sesión con CERO
-- series completadas (lo añadiste pero no lo hiciste) y da un sitio
-- estable al orden y a las notas por ejercicio.
CREATE TABLE session_exercises (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID        NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  position    INTEGER     NOT NULL CHECK (position >= 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT session_exercises_position_unique
    UNIQUE (session_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE workout_sets (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID        NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_number          INTEGER     NOT NULL CHECK (set_number > 0),
  weight_kg           NUMERIC(6,2) CHECK (weight_kg >= 0),
  reps                INTEGER     CHECK (reps >= 0),
  rir                 INTEGER     CHECK (rir BETWEEN 0 AND 10),
  set_type            set_type    NOT NULL DEFAULT 'working',
  notes               TEXT,
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT workout_sets_number_unique
    UNIQUE (session_exercise_id, set_number) DEFERRABLE INITIALLY DEFERRED
);
