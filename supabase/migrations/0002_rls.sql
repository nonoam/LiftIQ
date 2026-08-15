-- ═══════════════════════════════════════════════════════════════════════
-- LiftIQ — Row Level Security
--
-- Dos detalles deliberados en todas las políticas:
--
--   1. `(SELECT auth.uid())` en vez de `auth.uid()` a secas. Envuelto en
--      un subselect, Postgres lo evalúa UNA vez por consulta (initPlan)
--      en lugar de una vez por fila. Con miles de series en el historial
--      la diferencia es grande.
--
--   2. `TO authenticated` para que ni siquiera se evalúen con el rol anon.
--
-- En las tablas hijas el WITH CHECK valida además que la fila padre es
-- del mismo usuario. Sin eso, cualquiera podría colgar una serie de la
-- sesión de otra persona indicando su propio user_id.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- GRANTs
--
-- RLS filtra FILAS, pero antes Postgres comprueba los privilegios de
-- TABLA. Las tablas creadas por una migración no reciben SELECT/INSERT/
-- UPDATE/DELETE para anon ni authenticated de forma automática, así que
-- sin esto toda petición de PostgREST falla con 42501 "permission denied"
-- sin llegar siquiera a evaluar las políticas.
--
-- Defensa en profundidad: el GRANT decide QUÉ ROL entra, la política
-- decide QUÉ FILAS ve. `anon` no recibe nada: la app exige login.
-- ───────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, UPDATE ON profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  exercises,
  routines,
  routine_exercises,
  workout_sessions,
  session_exercises,
  workout_sets
TO authenticated;

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets      ENABLE ROW LEVEL SECURITY;

-- ─── profiles ──────────────────────────────────────────────────────────
-- Sin INSERT: el perfil lo crea el trigger handle_new_user().
-- Sin DELETE: se borra en cascada al eliminar la cuenta.
CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ─── exercises ─────────────────────────────────────────────────────────
-- El catálogo global lo ve todo el mundo; los propios, solo su dueño.
CREATE POLICY exercises_select ON exercises
  FOR SELECT TO authenticated
  USING (owner_id IS NULL OR owner_id = (SELECT auth.uid()));

CREATE POLICY exercises_insert ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (is_custom AND owner_id = (SELECT auth.uid()));

CREATE POLICY exercises_update ON exercises
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (is_custom AND owner_id = (SELECT auth.uid()));

CREATE POLICY exercises_delete ON exercises
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- ─── routines ──────────────────────────────────────────────────────────
CREATE POLICY routines_all ON routines
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY routine_exercises_all ON routine_exercises
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM routines r
      WHERE r.id = routine_id AND r.user_id = (SELECT auth.uid())
    )
  );

-- ─── workouts ──────────────────────────────────────────────────────────
CREATE POLICY workout_sessions_all ON workout_sessions
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    -- routine_id es opcional (entreno en blanco), pero si viene tiene
    -- que ser una rutina propia.
    AND (
      routine_id IS NULL
      OR EXISTS (
        SELECT 1 FROM routines r
        WHERE r.id = routine_id AND r.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY session_exercises_all ON session_exercises
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM workout_sessions s
      WHERE s.id = session_id AND s.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY workout_sets_all ON workout_sets
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM session_exercises se
      WHERE se.id = session_exercise_id AND se.user_id = (SELECT auth.uid())
    )
  );
