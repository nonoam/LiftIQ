-- ═══════════════════════════════════════════════════════════════════════
-- LiftIQ — progreso semanal por rutina
--
-- Responde a "¿cuántas repeticiones llevo esta semana en esta rutina y
-- cómo va comparado con las anteriores?".
--
-- Son FUNCIONES y no vistas por la semana natural: date_trunc('week', ...)
-- sobre un timestamptz usa la zona horaria de la sesión de Postgres, que
-- en PostgREST es UTC. Un entreno de lunes a las 00:30 en España es
-- domingo 22:30 UTC, así que una vista en UTC lo metería en la semana
-- anterior. Pasando la zona del dispositivo, la semana coincide con la
-- que el usuario tiene en la cabeza.
--
-- SECURITY INVOKER (el valor por defecto): las RLS de las tablas base
-- siguen aplicando, así que cada usuario solo agrega sus propios datos.
-- ═══════════════════════════════════════════════════════════════════════

-- Repeticiones, series y volumen por semana para una rutina.
-- Alimenta el gráfico de barras de la pantalla de rutina.
CREATE FUNCTION get_routine_weekly_reps(
  p_routine_id UUID,
  p_timezone   TEXT    DEFAULT 'UTC',
  p_weeks      INTEGER DEFAULT 12
)
RETURNS TABLE (
  week_start      DATE,
  sessions        BIGINT,
  total_reps      BIGINT,
  total_sets      BIGINT,
  total_volume_kg NUMERIC,
  avg_rir         NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    (date_trunc('week', s.started_at AT TIME ZONE p_timezone))::DATE          AS week_start,
    COUNT(DISTINCT s.id)                                                      AS sessions,
    COALESCE(SUM(ws.reps) FILTER (WHERE ws.set_type <> 'warmup'), 0)::BIGINT  AS total_reps,
    COUNT(ws.id) FILTER (WHERE ws.set_type <> 'warmup')                       AS total_sets,
    COALESCE(
      SUM(ws.weight_kg * ws.reps) FILTER (WHERE ws.set_type <> 'warmup'), 0
    )::NUMERIC(12,2)                                                          AS total_volume_kg,
    ROUND(AVG(ws.rir) FILTER (WHERE ws.set_type <> 'warmup'), 1)              AS avg_rir
  FROM workout_sessions s
  JOIN session_exercises se ON se.session_id = s.id
  JOIN workout_sets      ws ON ws.session_exercise_id = se.id
  WHERE s.routine_id = p_routine_id
    AND s.finished_at IS NOT NULL
    AND s.started_at >= NOW() - (p_weeks || ' weeks')::INTERVAL
  GROUP BY 1
  ORDER BY 1;
$$;

-- El mismo desglose, pero ejercicio a ejercicio: es lo que permite ver si
-- el total semanal sube porque progresas o porque has metido más volumen
-- en un solo movimiento.
CREATE FUNCTION get_routine_exercise_weekly_reps(
  p_routine_id UUID,
  p_timezone   TEXT    DEFAULT 'UTC',
  p_weeks      INTEGER DEFAULT 12
)
RETURNS TABLE (
  week_start    DATE,
  exercise_id   UUID,
  exercise_name TEXT,
  total_reps    BIGINT,
  total_sets    BIGINT,
  avg_rir       NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    (date_trunc('week', s.started_at AT TIME ZONE p_timezone))::DATE          AS week_start,
    e.id                                                                      AS exercise_id,
    e.name                                                                    AS exercise_name,
    COALESCE(SUM(ws.reps) FILTER (WHERE ws.set_type <> 'warmup'), 0)::BIGINT  AS total_reps,
    COUNT(ws.id) FILTER (WHERE ws.set_type <> 'warmup')                       AS total_sets,
    ROUND(AVG(ws.rir) FILTER (WHERE ws.set_type <> 'warmup'), 1)              AS avg_rir
  FROM workout_sessions s
  JOIN session_exercises se ON se.session_id = s.id
  JOIN exercises         e  ON e.id = se.exercise_id
  JOIN workout_sets      ws ON ws.session_exercise_id = se.id
  WHERE s.routine_id = p_routine_id
    AND s.finished_at IS NOT NULL
    AND s.started_at >= NOW() - (p_weeks || ' weeks')::INTERVAL
  GROUP BY 1, 2, 3
  ORDER BY 1, 3;
$$;

GRANT EXECUTE ON FUNCTION get_routine_weekly_reps(UUID, TEXT, INTEGER)          TO authenticated;
GRANT EXECUTE ON FUNCTION get_routine_exercise_weekly_reps(UUID, TEXT, INTEGER) TO authenticated;

-- Las agregaciones filtran por rutina y recorren sus sesiones terminadas.
CREATE INDEX workout_sessions_routine_idx
  ON workout_sessions (routine_id, started_at DESC)
  WHERE routine_id IS NOT NULL AND finished_at IS NOT NULL;
