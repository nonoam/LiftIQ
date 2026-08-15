-- ═══════════════════════════════════════════════════════════════════════
-- LiftIQ — catálogo global de ejercicios
--
-- owner_id NULL + is_custom FALSE = visible para todos los usuarios
-- (ver la política exercises_select en 0002_rls.sql).
--
-- Idempotente: se apoya en el índice exercises_global_name_unique, así
-- que se puede volver a ejecutar sin duplicar filas.
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO exercises (name, muscle_group, equipment) VALUES
  -- ── Pecho ────────────────────────────────────────────────────────────
  ('Press de banca con barra',              'chest',      'barbell'),
  ('Press inclinado con barra',             'chest',      'barbell'),
  ('Press declinado con barra',             'chest',      'barbell'),
  ('Press de banca con mancuernas',         'chest',      'dumbbell'),
  ('Press inclinado con mancuernas',        'chest',      'dumbbell'),
  ('Aperturas con mancuernas',              'chest',      'dumbbell'),
  ('Cruce de poleas',                       'chest',      'cable'),
  ('Press de pecho en máquina',             'chest',      'machine'),
  ('Contractor de pecho (peck deck)',       'chest',      'machine'),
  ('Fondos en paralelas',                   'chest',      'bodyweight'),
  ('Flexiones',                             'chest',      'bodyweight'),

  -- ── Espalda ──────────────────────────────────────────────────────────
  ('Dominadas',                             'back',       'bodyweight'),
  ('Dominadas supinas',                     'back',       'bodyweight'),
  ('Jalón al pecho',                        'back',       'cable'),
  ('Jalón agarre neutro',                   'back',       'cable'),
  ('Remo con barra',                        'back',       'barbell'),
  ('Remo Pendlay',                          'back',       'barbell'),
  ('Remo con mancuerna a una mano',         'back',       'dumbbell'),
  ('Remo en polea baja',                    'back',       'cable'),
  ('Remo en máquina',                       'back',       'machine'),
  ('Remo en T',                             'back',       'barbell'),
  ('Peso muerto convencional',              'back',       'barbell'),
  ('Pull-over en polea',                    'back',       'cable'),
  ('Encogimientos de hombros',              'back',       'dumbbell'),

  -- ── Hombros ──────────────────────────────────────────────────────────
  ('Press militar con barra',               'shoulders',  'barbell'),
  ('Press de hombros con mancuernas',       'shoulders',  'dumbbell'),
  ('Press Arnold',                          'shoulders',  'dumbbell'),
  ('Press de hombros en máquina',           'shoulders',  'machine'),
  ('Elevaciones laterales con mancuernas',  'shoulders',  'dumbbell'),
  ('Elevaciones laterales en polea',        'shoulders',  'cable'),
  ('Elevaciones frontales',                 'shoulders',  'dumbbell'),
  ('Pájaros con mancuernas',                'shoulders',  'dumbbell'),
  ('Face pull',                             'shoulders',  'cable'),

  -- ── Bíceps ───────────────────────────────────────────────────────────
  ('Curl con barra',                        'biceps',     'barbell'),
  ('Curl con barra Z',                      'biceps',     'barbell'),
  ('Curl con mancuernas',                   'biceps',     'dumbbell'),
  ('Curl martillo',                         'biceps',     'dumbbell'),
  ('Curl predicador',                       'biceps',     'barbell'),
  ('Curl en polea',                         'biceps',     'cable'),
  ('Curl concentrado',                      'biceps',     'dumbbell'),
  ('Curl inclinado con mancuernas',         'biceps',     'dumbbell'),

  -- ── Tríceps ──────────────────────────────────────────────────────────
  ('Extensión de tríceps en polea',         'triceps',    'cable'),
  ('Extensión de tríceps con cuerda',       'triceps',    'cable'),
  ('Press francés',                         'triceps',    'barbell'),
  ('Extensión sobre la cabeza con mancuerna','triceps',   'dumbbell'),
  ('Press de banca agarre cerrado',         'triceps',    'barbell'),
  ('Fondos en banco',                       'triceps',    'bodyweight'),
  ('Patada de tríceps',                     'triceps',    'dumbbell'),

  -- ── Antebrazo ────────────────────────────────────────────────────────
  ('Curl de muñeca',                        'forearms',   'barbell'),
  ('Curl de muñeca inverso',                'forearms',   'barbell'),
  ('Paseo del granjero',                    'forearms',   'dumbbell'),

  -- ── Cuádriceps ───────────────────────────────────────────────────────
  ('Sentadilla con barra',                  'quads',      'barbell'),
  ('Sentadilla frontal',                    'quads',      'barbell'),
  ('Sentadilla búlgara',                    'quads',      'dumbbell'),
  ('Prensa de piernas',                     'quads',      'machine'),
  ('Hack squat',                            'quads',      'machine'),
  ('Extensión de cuádriceps',               'quads',      'machine'),
  ('Zancadas',                              'quads',      'dumbbell'),
  ('Sentadilla goblet',                     'quads',      'kettlebell'),

  -- ── Isquiotibiales ───────────────────────────────────────────────────
  ('Peso muerto rumano',                    'hamstrings', 'barbell'),
  ('Peso muerto piernas rígidas',           'hamstrings', 'barbell'),
  ('Curl femoral tumbado',                  'hamstrings', 'machine'),
  ('Curl femoral sentado',                  'hamstrings', 'machine'),
  ('Buenos días',                           'hamstrings', 'barbell'),
  ('Peso muerto rumano con mancuernas',     'hamstrings', 'dumbbell'),

  -- ── Glúteos ──────────────────────────────────────────────────────────
  ('Hip thrust con barra',                  'glutes',     'barbell'),
  ('Puente de glúteos',                     'glutes',     'bodyweight'),
  ('Patada de glúteo en polea',             'glutes',     'cable'),
  ('Abducción de cadera en máquina',        'glutes',     'machine'),

  -- ── Gemelos ──────────────────────────────────────────────────────────
  ('Elevación de talones de pie',           'calves',     'machine'),
  ('Elevación de talones sentado',          'calves',     'machine'),
  ('Elevación de talones en prensa',        'calves',     'machine'),

  -- ── Core ─────────────────────────────────────────────────────────────
  ('Plancha abdominal',                     'core',       'bodyweight'),
  ('Crunch abdominal',                      'core',       'bodyweight'),
  ('Crunch en polea',                       'core',       'cable'),
  ('Elevación de piernas colgado',          'core',       'bodyweight'),
  ('Rueda abdominal',                       'core',       'other'),
  ('Giro ruso',                             'core',       'other'),
  ('Plancha lateral',                       'core',       'bodyweight'),

  -- ── Cuerpo completo ──────────────────────────────────────────────────
  ('Swing con kettlebell',                  'full_body',  'kettlebell'),
  ('Thruster',                              'full_body',  'barbell'),
  ('Cargada de potencia',                   'full_body',  'barbell'),
  ('Burpees',                               'full_body',  'bodyweight')
ON CONFLICT (lower(btrim(name))) WHERE owner_id IS NULL DO NOTHING;
