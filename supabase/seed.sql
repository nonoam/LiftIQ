-- LiftIQ Seed Data
-- Muscle Groups + Representative Exercise Catalog (~100 exercises)
-- Full catalog import from ExerciseDB: see scripts/import-exercisedb.ts

-- ─────────────────────────────────────────────
-- MUSCLE GROUPS
-- ─────────────────────────────────────────────
INSERT INTO muscle_groups (id, name, name_es, slug, body_region, body_side, svg_path_id, color_hex) VALUES
  ('11111111-0001-0000-0000-000000000000', 'Chest',            'Pecho',             'chest',            'upper', 'anterior', 'chest',            '#EF4444'),
  ('11111111-0002-0000-0000-000000000000', 'Back',             'Espalda',           'back',             'upper', 'posterior','back',             '#3B82F6'),
  ('11111111-0003-0000-0000-000000000000', 'Shoulders',        'Hombros',           'shoulders',        'upper', 'both',     'shoulders',        '#8B5CF6'),
  ('11111111-0004-0000-0000-000000000000', 'Biceps',           'Bíceps',            'biceps',           'upper', 'anterior', 'biceps',           '#06B6D4'),
  ('11111111-0005-0000-0000-000000000000', 'Triceps',          'Tríceps',           'triceps',          'upper', 'posterior','triceps',          '#F59E0B'),
  ('11111111-0006-0000-0000-000000000000', 'Forearms',         'Antebrazos',        'forearms',         'upper', 'both',     'forearms',         '#84CC16'),
  ('11111111-0007-0000-0000-000000000000', 'Abs',              'Abdominales',       'abs',              'core',  'anterior', 'abs',              '#F97316'),
  ('11111111-0008-0000-0000-000000000000', 'Obliques',         'Oblicuos',          'obliques',         'core',  'anterior', 'obliques',         '#FB923C'),
  ('11111111-0009-0000-0000-000000000000', 'Lower Back',       'Lumbar',            'lower-back',       'core',  'posterior','lower_back',       '#A78BFA'),
  ('11111111-0010-0000-0000-000000000000', 'Quads',            'Cuádriceps',        'quads',            'lower', 'anterior', 'quads',            '#EC4899'),
  ('11111111-0011-0000-0000-000000000000', 'Hamstrings',       'Isquiotibiales',    'hamstrings',       'lower', 'posterior','hamstrings',       '#14B8A6'),
  ('11111111-0012-0000-0000-000000000000', 'Glutes',           'Glúteos',           'glutes',           'lower', 'posterior','glutes',           '#F43F5E'),
  ('11111111-0013-0000-0000-000000000000', 'Calves',           'Pantorrillas',      'calves',           'lower', 'posterior','calves',           '#10B981'),
  ('11111111-0014-0000-0000-000000000000', 'Traps',            'Trapecios',         'traps',            'upper', 'posterior','traps',            '#6366F1'),
  ('11111111-0015-0000-0000-000000000000', 'Lats',             'Dorsales',          'lats',             'upper', 'posterior','lats',             '#0EA5E9'),
  ('11111111-0016-0000-0000-000000000000', 'Rear Delts',       'Deltoides Posterior','rear-delts',      'upper', 'posterior','rear_delts',       '#7C3AED'),
  ('11111111-0017-0000-0000-000000000000', 'Serratus',         'Serrato',           'serratus',         'upper', 'anterior', 'serratus',         '#0D9488')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- EXERCISES
-- ─────────────────────────────────────────────

-- CHEST
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Barbell Bench Press',       'Press Banca Barra',        '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid,'11111111-0003-0000-0000-000000000000'::uuid], 'compound',  'barbell',    'Lie on bench, grip bar shoulder-width apart, lower to chest, press up explosively.'),
('Incline Barbell Press',     'Press Inclinado Barra',    '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid,'11111111-0003-0000-0000-000000000000'::uuid], 'compound',  'barbell',    'Set bench to 30-45°. Press bar from upper chest.'),
('Decline Barbell Press',     'Press Declinado Barra',    '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid],                                              'compound',  'barbell',    'Decline bench press targeting lower chest.'),
('Dumbbell Bench Press',      'Press Banca Mancuernas',   '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid,'11111111-0003-0000-0000-000000000000'::uuid], 'compound',  'dumbbell',   'Press dumbbells from chest height. Greater ROM than barbell.'),
('Incline Dumbbell Press',    'Press Inclinado Mancuernas','11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid,'11111111-0003-0000-0000-000000000000'::uuid],'compound',  'dumbbell',   'Incline bench dumbbell press for upper chest.'),
('Dumbbell Flyes',            'Aperturas Mancuernas',     '11111111-0001-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',   'Wide arc motion, slight elbow bend. Squeeze at top.'),
('Cable Crossover',           'Cruce de Poleas',          '11111111-0001-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'cable',      'Cable fly from high or low pulley. Constant tension.'),
('Chest Dips',                'Fondos Pecho',             '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid],                                              'compound',  'dip_bars',   'Lean forward to emphasize chest over triceps.'),
('Push-Ups',                  'Flexiones',                '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid,'11111111-0003-0000-0000-000000000000'::uuid], 'compound',  'bodyweight', 'Classic push-up. Maintain plank position.'),
('Machine Chest Press',       'Press Pecho Máquina',      '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid],                                              'compound',  'machine',    'Guided chest press machine for isolation.'),
('Pec Deck / Butterfly',      'Pec Deck / Mariposa',      '11111111-0001-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'machine',    'Machine fly. Elbows bent 90°, squeeze pecs at end range.'),
('Landmine Press',            'Press Landmine',           '11111111-0001-0000-0000-000000000000', ARRAY['11111111-0003-0000-0000-000000000000'::uuid,'11111111-0005-0000-0000-000000000000'::uuid], 'compound',  'barbell',    'Angled press using landmine attachment.');

-- BACK
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Deadlift',                  'Peso Muerto',              '11111111-0002-0000-0000-000000000000', ARRAY['11111111-0011-0000-0000-000000000000'::uuid,'11111111-0012-0000-0000-000000000000'::uuid,'11111111-0009-0000-0000-000000000000'::uuid], 'compound', 'barbell', 'Hip hinge from floor. Bar close to body throughout lift.'),
('Barbell Row',               'Remo Barra',               '11111111-0015-0000-0000-000000000000', ARRAY['11111111-0002-0000-0000-000000000000'::uuid,'11111111-0004-0000-0000-000000000000'::uuid,'11111111-0014-0000-0000-000000000000'::uuid], 'compound', 'barbell', 'Hinge at hips 45°, row bar to lower chest/upper abdomen.'),
('Dumbbell Row',              'Remo Mancuerna',           '11111111-0015-0000-0000-000000000000', ARRAY['11111111-0002-0000-0000-000000000000'::uuid,'11111111-0004-0000-0000-000000000000'::uuid],                                              'compound', 'dumbbell','Unilateral row. Brace on bench, pull to hip.'),
('Pull-Ups',                  'Dominadas',                '11111111-0015-0000-0000-000000000000', ARRAY['11111111-0004-0000-0000-000000000000'::uuid,'11111111-0002-0000-0000-000000000000'::uuid],                                              'compound', 'pull_up_bar','Overhand grip pull-up. Full ROM from dead hang.'),
('Chin-Ups',                  'Jalones Supinados',        '11111111-0015-0000-0000-000000000000', ARRAY['11111111-0004-0000-0000-000000000000'::uuid],                                              'compound', 'pull_up_bar','Underhand grip. Emphasizes biceps more than pull-ups.'),
('Lat Pulldown',              'Jalón al Pecho',           '11111111-0015-0000-0000-000000000000', ARRAY['11111111-0004-0000-0000-000000000000'::uuid,'11111111-0002-0000-0000-000000000000'::uuid],                                              'compound', 'cable',   'Pull bar to upper chest. Drive elbows down and back.'),
('Seated Cable Row',          'Remo Sentado Polea',       '11111111-0002-0000-0000-000000000000', ARRAY['11111111-0015-0000-0000-000000000000'::uuid,'11111111-0004-0000-0000-000000000000'::uuid],                                              'compound', 'cable',   'Sit upright, row to lower abdomen. Squeeze scapulae.'),
('T-Bar Row',                 'Remo T',                   '11111111-0002-0000-0000-000000000000', ARRAY['11111111-0015-0000-0000-000000000000'::uuid,'11111111-0004-0000-0000-000000000000'::uuid],                                              'compound', 'barbell', 'Chest-supported or bent-over T-bar row.'),
('Face Pulls',                'Facepulls',                '11111111-0016-0000-0000-000000000000', ARRAY['11111111-0003-0000-0000-000000000000'::uuid,'11111111-0014-0000-0000-000000000000'::uuid],                                              'isolation','cable',   'Pull rope to face, elbows high. Great for shoulder health.'),
('Rack Pull',                 'Peso Muerto Rack',         '11111111-0002-0000-0000-000000000000', ARRAY['11111111-0014-0000-0000-000000000000'::uuid,'11111111-0009-0000-0000-000000000000'::uuid],                                              'compound', 'barbell', 'Deadlift from knee height in power rack. Overload the back.'),
('Romanian Deadlift',         'Peso Muerto Rumano',       '11111111-0011-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid,'11111111-0009-0000-0000-000000000000'::uuid],                                              'compound', 'barbell', 'Hip hinge with soft knees. Feel hamstring stretch at bottom.'),
('Good Mornings',             'Good Mornings',            '11111111-0011-0000-0000-000000000000', ARRAY['11111111-0009-0000-0000-000000000000'::uuid,'11111111-0012-0000-0000-000000000000'::uuid],                                              'compound', 'barbell', 'Bar on upper back, hinge at hips keeping back neutral.');

-- SHOULDERS
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Barbell Overhead Press',    'Press Militar Barra',      '11111111-0003-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid,'11111111-0014-0000-0000-000000000000'::uuid], 'compound',  'barbell',   'Press bar from front rack to overhead. Core tight.'),
('Dumbbell Shoulder Press',   'Press Hombro Mancuernas',  '11111111-0003-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid],                                              'compound',  'dumbbell',  'Seated or standing dumbbell overhead press.'),
('Arnold Press',              'Press Arnold',             '11111111-0003-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid],                                              'compound',  'dumbbell',  'Rotate palms during press for full shoulder activation.'),
('Lateral Raises',            'Elevaciones Laterales',    '11111111-0003-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',  'Raise arms to shoulder height, slight forward lean.'),
('Front Raises',              'Elevaciones Frontales',    '11111111-0003-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',  'Raise arms in front to shoulder height, controlled descent.'),
('Cable Lateral Raises',      'Elevaciones Laterales Polea','11111111-0003-0000-0000-000000000000',ARRAY[]::uuid[],                                                                                 'isolation', 'cable',     'Constant tension lateral raise with cable.'),
('Rear Delt Fly',             'Pájaro / Rear Delt Fly',   '11111111-0016-0000-0000-000000000000', ARRAY['11111111-0002-0000-0000-000000000000'::uuid],                                              'isolation', 'dumbbell',  'Bent-over or seated, raise arms back to horizontal.'),
('Machine Shoulder Press',    'Press Hombro Máquina',     '11111111-0003-0000-0000-000000000000', ARRAY['11111111-0005-0000-0000-000000000000'::uuid],                                              'compound',  'machine',   'Guided overhead press machine.'),
('Shrugs',                    'Encogimientos',            '11111111-0014-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'barbell',   'Shrug shoulders straight up. Pause at top, lower slowly.');

-- BICEPS
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Barbell Curl',              'Curl Barra',               '11111111-0004-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'barbell',   'Strict curl, no swing. Elbows fixed at sides.'),
('Dumbbell Curl',             'Curl Mancuernas',          '11111111-0004-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',  'Alternate or simultaneous curl. Supinate at top.'),
('Hammer Curl',               'Curl Martillo',            '11111111-0004-0000-0000-000000000000', ARRAY['11111111-0006-0000-0000-000000000000'::uuid],                                              'isolation', 'dumbbell',  'Neutral grip curl. Targets brachialis and brachioradialis.'),
('Preacher Curl',             'Curl Predicador',          '11111111-0004-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'barbell',   'Arm supported on preacher pad. Strict elbow flexion.'),
('Cable Curl',                'Curl Polea',               '11111111-0004-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'cable',     'Low cable curl. Constant tension throughout ROM.'),
('Incline Dumbbell Curl',     'Curl Inclinado Mancuernas','11111111-0004-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',  'Seated incline, arms behind torso for peak contraction.'),
('Concentration Curl',        'Curl Concentración',       '11111111-0004-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',  'Elbow braced on inner thigh. Slow controlled curl.'),
('EZ Bar Curl',               'Curl Barra EZ',            '11111111-0004-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'ez_bar',    'EZ bar reduces wrist strain. Semi-supinated grip.');

-- TRICEPS
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Tricep Dips',               'Fondos Tríceps',           '11111111-0005-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'compound',  'dip_bars',  'Upright torso to emphasize triceps. Full ROM.'),
('Close-Grip Bench Press',    'Press Agarre Cerrado',     '11111111-0005-0000-0000-000000000000', ARRAY['11111111-0001-0000-0000-000000000000'::uuid],                                              'compound',  'barbell',   'Hands shoulder-width, elbows close to body.'),
('Skull Crushers',            'Rompe Cráneos',            '11111111-0005-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'ez_bar',    'Lower bar to forehead, extend arms. Control the weight.'),
('Tricep Pushdown',           'Extensión Polea Alta',     '11111111-0005-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'cable',     'Push rope or bar down, full extension. Elbows at sides.'),
('Overhead Tricep Extension', 'Extensión Tríceps Cabeza', '11111111-0005-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',  'Dumbbell or cable behind head, extend arms overhead.'),
('Diamond Push-Ups',          'Flexiones Diamante',       '11111111-0005-0000-0000-000000000000', ARRAY['11111111-0001-0000-0000-000000000000'::uuid],                                              'compound',  'bodyweight','Hands form diamond shape, elbows track back.'),
('Kickbacks',                 'Patadas Tríceps',          '11111111-0005-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'dumbbell',  'Hinge forward, extend arm back, squeeze at lockout.');

-- LEGS: QUADS
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Back Squat',                'Sentadilla Trasera',       '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid,'11111111-0011-0000-0000-000000000000'::uuid], 'compound',  'barbell',   'Bar on traps, squat to parallel or below. Knees track toes.'),
('Front Squat',               'Sentadilla Frontal',       '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid],                                              'compound',  'barbell',   'Bar on front delts. Upright torso, deep squat.'),
('Leg Press',                 'Prensa de Piernas',        '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid],                                              'compound',  'machine',   'Foot position determines emphasis. Full ROM.'),
('Hack Squat',                'Hack Squat',               '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid],                                              'compound',  'machine',   'Machine hack squat targeting quads. Feet forward.'),
('Leg Extension',             'Extensión de Piernas',     '11111111-0010-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'machine',   'Full extension at top. Slow eccentric for quad hypertrophy.'),
('Bulgarian Split Squat',     'Sentadilla Búlgara',       '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid,'11111111-0011-0000-0000-000000000000'::uuid], 'compound',  'dumbbell',  'Rear foot elevated, lunge down deep. Vertical torso.'),
('Walking Lunges',            'Zancadas',                 '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid,'11111111-0011-0000-0000-000000000000'::uuid], 'compound',  'dumbbell',  'Step forward, lower back knee toward floor.'),
('Smith Machine Squat',       'Sentadilla Smith',         '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid],                                              'compound',  'smith_machine','Guided squat on Smith machine.');

-- LEGS: HAMSTRINGS & GLUTES
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Lying Leg Curl',            'Curl de Pierna Tumbado',   '11111111-0011-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'machine',   'Curl legs to 90°+ flexion, squeeze at top.'),
('Seated Leg Curl',           'Curl de Pierna Sentado',   '11111111-0011-0000-0000-000000000000', ARRAY[]::uuid[],                                                                                  'isolation', 'machine',   'Seated variation, longer hamstring stretch.'),
('Hip Thrust',                'Hip Thrust',               '11111111-0012-0000-0000-000000000000', ARRAY['11111111-0011-0000-0000-000000000000'::uuid],                                              'compound',  'barbell',   'Shoulders on bench, drive hips up powerfully. Full extension.'),
('Glute Bridge',              'Puente de Glúteo',         '11111111-0012-0000-0000-000000000000', ARRAY['11111111-0011-0000-0000-000000000000'::uuid],                                              'compound',  'bodyweight','Floor hip thrust. Single or double leg.'),
('Cable Pull-Through',        'Tirón de Polea Glúteo',    '11111111-0012-0000-0000-000000000000', ARRAY['11111111-0011-0000-0000-000000000000'::uuid],                                              'compound',  'cable',     'Hip hinge, drive hips forward against cable resistance.'),
('Sumo Deadlift',             'Peso Muerto Sumo',         '11111111-0012-0000-0000-000000000000', ARRAY['11111111-0011-0000-0000-000000000000'::uuid,'11111111-0010-0000-0000-000000000000'::uuid], 'compound',  'barbell',   'Wide stance deadlift, greater glute emphasis.'),
('Kettlebell Swing',          'Swing con Kettlebell',     '11111111-0012-0000-0000-000000000000', ARRAY['11111111-0011-0000-0000-000000000000'::uuid,'11111111-0009-0000-0000-000000000000'::uuid], 'compound',  'kettlebell','Explosive hip hinge. Power from glutes/hams, not arms.');

-- CALVES
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Standing Calf Raise',       'Elevación Talones de Pie', '11111111-0013-0000-0000-000000000000', ARRAY[]::uuid[], 'isolation', 'machine',    'Full plantarflexion, pause at top. Slow eccentric.'),
('Seated Calf Raise',         'Elevación Talones Sentado','11111111-0013-0000-0000-000000000000', ARRAY[]::uuid[], 'isolation', 'machine',    'Targets soleus. 90° knee angle.'),
('Leg Press Calf Raise',      'Elevación Talones Prensa', '11111111-0013-0000-0000-000000000000', ARRAY[]::uuid[], 'isolation', 'machine',    'Use leg press platform for calf raises.'),
('Donkey Calf Raise',         'Elevación Burro',          '11111111-0013-0000-0000-000000000000', ARRAY[]::uuid[], 'isolation', 'machine',    'Bent-over position maximizes gastroc stretch.');

-- CORE: ABS & LOWER BACK
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Crunch',                    'Crunch Abdominal',         '11111111-0007-0000-0000-000000000000', ARRAY[]::uuid[], 'isolation', 'bodyweight', 'Curl spine up, not a sit-up. Short ROM, squeeze abs.'),
('Cable Crunch',              'Crunch Polea',             '11111111-0007-0000-0000-000000000000', ARRAY[]::uuid[], 'isolation', 'cable',      'Kneel, curl down against cable resistance.'),
('Hanging Leg Raise',         'Elevación Piernas Colgado','11111111-0007-0000-0000-000000000000', ARRAY['11111111-0008-0000-0000-000000000000'::uuid], 'isolation', 'pull_up_bar', 'Raise legs to 90° or above. Avoid swinging.'),
('Plank',                     'Plancha',                  '11111111-0007-0000-0000-000000000000', ARRAY['11111111-0009-0000-0000-000000000000'::uuid], 'isolation', 'bodyweight', 'Hold rigid plank position. No sagging hips.'),
('Ab Rollout',                'Rueda Abdominal',          '11111111-0007-0000-0000-000000000000', ARRAY['11111111-0009-0000-0000-000000000000'::uuid], 'compound',  'other',      'Extend out and return. Advanced core exercise.'),
('Russian Twist',             'Giro Ruso',                '11111111-0008-0000-0000-000000000000', ARRAY['11111111-0007-0000-0000-000000000000'::uuid], 'isolation', 'other',      'Seated rotation. Add weight plate or medicine ball.'),
('Side Plank',                'Plancha Lateral',          '11111111-0008-0000-0000-000000000000', ARRAY['11111111-0007-0000-0000-000000000000'::uuid], 'isolation', 'bodyweight', 'Lateral hold. Stack or stagger feet.'),
('Hyperextension',            'Hiperextensión',           '11111111-0009-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid], 'isolation', 'machine',    'Extend spine on hyperextension bench. No overextension.'),
('Back Extension',            'Extensión de Espalda',     '11111111-0009-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid], 'isolation', 'machine',    'Glute-ham bench back extension.'),
('Deadbug',                   'Insecto Muerto',           '11111111-0007-0000-0000-000000000000', ARRAY['11111111-0009-0000-0000-000000000000'::uuid], 'isolation', 'bodyweight', 'Opposite arm/leg extension from supine. Anti-extension core.');

-- COMPOUND MOVEMENTS (Olympic / Powerlifting)
INSERT INTO exercises (name, name_es, primary_muscle_group_id, secondary_muscle_group_ids, movement_type, equipment, instructions) VALUES
('Power Clean',               'Cargada de Potencia',      '11111111-0002-0000-0000-000000000000', ARRAY['11111111-0010-0000-0000-000000000000'::uuid,'11111111-0003-0000-0000-000000000000'::uuid], 'compound', 'barbell', 'Olympic lift pulling bar from floor to front rack.'),
('Trap Bar Deadlift',         'Peso Muerto Trap Bar',     '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0011-0000-0000-000000000000'::uuid,'11111111-0002-0000-0000-000000000000'::uuid], 'compound', 'trap_bar', 'Hex bar deadlift, more quad-dominant than conventional.'),
('Farmer''s Walk',            'Paseo del Granjero',       '11111111-0006-0000-0000-000000000000', ARRAY['11111111-0014-0000-0000-000000000000'::uuid,'11111111-0009-0000-0000-000000000000'::uuid], 'compound', 'dumbbell','Walk carrying heavy dumbbells or kettlebells.'),
('Sled Push',                 'Empuje de Trineo',         '11111111-0010-0000-0000-000000000000', ARRAY['11111111-0012-0000-0000-000000000000'::uuid,'11111111-0007-0000-0000-000000000000'::uuid], 'compound', 'other',   'Push weighted sled for strength or conditioning.');
