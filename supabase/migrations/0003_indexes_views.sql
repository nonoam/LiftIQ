-- ═══════════════════════════════════════════════════════════════════════
-- LiftIQ — índices y vistas derivadas
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Índices
--
-- Las UNIQUE constraints de 0001 ya cubren (session_id, position),
-- (routine_id, position) y (session_exercise_id, set_number), así que
-- aquí solo van los accesos que quedan sin cubrir: el filtro de RLS por
-- user_id y las consultas de historial y de "última vez".
-- ───────────────────────────────────────────────────────────────────────

-- Historial: la pantalla principal pide las sesiones del usuario por fecha.
CREATE INDEX workout_sessions_user_started_idx
  ON workout_sessions (user_id, started_at DESC);

-- "La última vez que hiciste este ejercicio": se filtra por usuario y
-- ejercicio, y se ordena por la sesión.
CREATE INDEX session_exercises_user_exercise_idx
  ON session_exercises (user_id, exercise_id);

CREATE INDEX session_exercises_session_idx
  ON session_exercises (session_id);

CREATE INDEX workout_sets_user_idx
  ON workout_sets (user_id);

CREATE INDEX routine_exercises_user_idx
  ON routine_exercises (user_id);

CREATE INDEX routines_user_idx
  ON routines (user_id)
  WHERE NOT is_archived;

-- Buscador de ejercicios: trigramas para tolerar erratas y coincidencias
-- parciales ("press incl" → "Press inclinado con mancuernas").
CREATE INDEX exercises_name_trgm_idx
  ON exercises USING gin (name gin_trgm_ops);

CREATE INDEX exercises_owner_idx
  ON exercises (owner_id)
  WHERE owner_id IS NOT NULL;

CREATE INDEX exercises_muscle_group_idx
  ON exercises (muscle_group)
  WHERE is_active;

-- ───────────────────────────────────────────────────────────────────────
-- v_exercise_last_performance
--
-- Una fila por (usuario, ejercicio) con las series de la ÚLTIMA sesión
-- terminada en la que apareció ese ejercicio. Es lo que alimenta el
-- autorrelleno de la pantalla de entreno: el cliente pide de golpe la
-- referencia de todos los ejercicios de la sesión en una sola consulta,
-- en vez de traerse el historial entero.
--
-- security_invoker = true es imprescindible: sin ello la vista se
-- ejecutaría con los permisos de su propietario y saltaría las RLS de
-- las tablas base, filtrando datos entre usuarios.
-- ───────────────────────────────────────────────────────────────────────
CREATE VIEW v_exercise_last_performance
WITH (security_invoker = true) AS
WITH ranked AS (
  SELECT
    se.user_id,
    se.exercise_id,
    se.id                                    AS session_exercise_id,
    s.id                                     AS session_id,
    COALESCE(s.finished_at, s.started_at)    AS performed_at,
    ROW_NUMBER() OVER (
      PARTITION BY se.user_id, se.exercise_id
      ORDER BY COALESCE(s.finished_at, s.started_at) DESC
    ) AS rn
  FROM session_exercises se
  JOIN workout_sessions s ON s.id = se.session_id
  WHERE s.finished_at IS NOT NULL
    -- Un ejercicio añadido y no ejecutado no cuenta como "última vez":
    -- si contase, el autorrelleno vendría vacío.
    AND EXISTS (
      SELECT 1 FROM workout_sets w WHERE w.session_exercise_id = se.id
    )
)
SELECT
  r.user_id,
  r.exercise_id,
  r.session_id,
  r.performed_at,
  COUNT(*) FILTER (WHERE ws.set_type <> 'warmup')  AS working_sets,
  MAX(ws.weight_kg)                                AS top_weight_kg,
  jsonb_agg(
    jsonb_build_object(
      'set_number', ws.set_number,
      'weight_kg',  ws.weight_kg,
      'reps',       ws.reps,
      'rir',        ws.rir,
      'set_type',   ws.set_type
    ) ORDER BY ws.set_number
  ) AS sets
FROM ranked r
JOIN workout_sets ws ON ws.session_exercise_id = r.session_exercise_id
WHERE r.rn = 1
GROUP BY r.user_id, r.exercise_id, r.session_id, r.performed_at;

-- ───────────────────────────────────────────────────────────────────────
-- v_session_summary
--
-- Totales por sesión para la lista del historial, calculados en la base
-- de datos en lugar de traerse todas las series al móvil.
--
-- El volumen ignora las series de calentamiento: contarlas infla la
-- cifra y hace que la progresión real no se vea.
-- ───────────────────────────────────────────────────────────────────────
CREATE VIEW v_session_summary
WITH (security_invoker = true) AS
SELECT
  s.id                                            AS session_id,
  s.user_id,
  s.name,
  s.started_at,
  s.finished_at,
  s.duration_seconds,
  COUNT(DISTINCT se.id)                           AS exercise_count,
  COUNT(ws.id) FILTER (WHERE ws.set_type <> 'warmup') AS working_set_count,
  COALESCE(
    SUM(ws.weight_kg * ws.reps) FILTER (WHERE ws.set_type <> 'warmup'),
    0
  )::NUMERIC(12,2)                                AS total_volume_kg
FROM workout_sessions s
LEFT JOIN session_exercises se ON se.session_id = s.id
LEFT JOIN workout_sets ws      ON ws.session_exercise_id = se.id
GROUP BY s.id, s.user_id, s.name, s.started_at, s.finished_at, s.duration_seconds;

-- Las vistas son de solo lectura y, al ser security_invoker, quedan
-- filtradas por las RLS de las tablas base (ver 0002_rls.sql).
GRANT SELECT ON v_exercise_last_performance, v_session_summary TO authenticated;
