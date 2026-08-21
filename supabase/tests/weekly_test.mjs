/**
 * ═══════════════════════════════════════════════════════════════════════
 * LiftIQ — prueba del progreso semanal por rutina.
 *
 *   npx supabase start
 *   npm run test:weekly
 *
 * Monta tres semanas reales de entrenos sobre una rutina y comprueba que
 * get_routine_weekly_reps / get_routine_exercise_weekly_reps agregan las
 * repeticiones como espera la pantalla de progreso.
 * ═══════════════════════════════════════════════════════════════════════
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const API = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  JSON.parse(execSync('npx --yes supabase@latest status -o json', { encoding: 'utf8' })).ANON_KEY;

let pass = 0;
let fail = 0;
function check(desc, expected, actual) {
  if (JSON.stringify(expected) === JSON.stringify(actual)) {
    console.log(`  PASS  ${desc}`);
    pass++;
  } else {
    console.log(`  FAIL  ${desc}`);
    console.log(`        esperado: ${JSON.stringify(expected)}`);
    console.log(`        obtenido: ${JSON.stringify(actual)}`);
    fail++;
  }
}
function must(label, { data, error }) {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

function client() {
  return createClient(API, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
}

const supabase = client();
const stamp = Date.now();
const { data: signUp, error: signUpError } = await supabase.auth.signUp({
  email: `weekly_${stamp}@test.local`,
  password: 'Password123!',
});
if (signUpError) throw signUpError;
const userId = signUp.user.id;

const catalog = must('catalogo', await supabase.from('exercises').select('id, name').is('owner_id', null));
const bench = catalog.find((e) => e.name === 'Press de banca con barra');
const squat = catalog.find((e) => e.name === 'Sentadilla con barra');

// ── Rutina ─────────────────────────────────────────────────────────────
const routineId = randomUUID();
must('rutina', await supabase.from('routines').insert({ id: routineId, user_id: userId, name: 'Full body' }));
must('objetivos', await supabase.from('routine_exercises').insert([
  {
    id: randomUUID(), routine_id: routineId, user_id: userId, exercise_id: bench.id,
    position: 0, target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_rir: 2,
  },
  {
    id: randomUUID(), routine_id: routineId, user_id: userId, exercise_id: squat.id,
    position: 1, target_sets: 3, target_reps_min: 6, target_reps_max: 10, target_rir: 1,
  },
]));

/** Un entreno completo situado `daysAgo` dias atras. */
async function logWeek({ daysAgo, benchReps, squatReps, rir, warmupReps }) {
  const sessionId = randomUUID();
  const startedAt = new Date(Date.now() - daysAgo * 86400_000);

  must('sesion', await supabase.from('workout_sessions').insert({
    id: sessionId, user_id: userId, name: 'Full body', routine_id: routineId,
  }));
  // La fecha real del entreno: por defecto seria NOW().
  must('backdate', await supabase.from('workout_sessions')
    .update({ started_at: startedAt.toISOString() }).eq('id', sessionId));

  const plan = [[bench, benchReps], [squat, squatReps]];
  for (let position = 0; position < plan.length; position++) {
    const [exercise, reps] = plan[position];
    const seId = randomUUID();
    must('session_exercise', await supabase.from('session_exercises').insert({
      id: seId, session_id: sessionId, user_id: userId, exercise_id: exercise.id, position,
    }));

    // set_type va explicito en TODAS las filas: en un insert masivo,
    // PostgREST une las claves de todos los objetos y rellena las que
    // falten con NULL en vez de con el DEFAULT de la columna.
    const sets = [1, 2, 3].map((n) => ({
      id: randomUUID(), session_exercise_id: seId, user_id: userId,
      set_number: n, weight_kg: 80, reps, rir, set_type: 'working',
    }));

    // Un calentamiento solo en el press, para comprobar que se excluye.
    if (warmupReps && exercise.id === bench.id) {
      sets.push({
        id: randomUUID(), session_exercise_id: seId, user_id: userId,
        set_number: 4, weight_kg: 20, reps: warmupReps, rir: 8, set_type: 'warmup',
      });
    }
    must('series', await supabase.from('workout_sets').insert(sets));
  }

  must('terminar', await supabase.from('workout_sessions')
    .update({ finished_at: new Date().toISOString() }).eq('id', sessionId));
  return sessionId;
}

console.log('Montando 3 semanas de entrenos...\n');
await logWeek({ daysAgo: 14, benchReps: 10, squatReps: 8, rir: 3 });
await logWeek({ daysAgo: 7, benchReps: 11, squatReps: 9, rir: 2 });
await logWeek({ daysAgo: 0, benchReps: 12, squatReps: 10, rir: 1, warmupReps: 20 });

// ── 1. Agregado semanal ────────────────────────────────────────────────
console.log('-- 1. Repeticiones por semana ---------------------------------');
const weekly = must('weekly', await supabase.rpc('get_routine_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'Europe/Madrid', p_weeks: 12,
}));

check('devuelve exactamente 3 semanas', 3, weekly.length);
check('vienen ordenadas de mas antigua a mas reciente', true,
  weekly[0].week_start < weekly[1].week_start && weekly[1].week_start < weekly[2].week_start);
check('semana -2: 3x10 + 3x8 = 54 reps', 54, Number(weekly[0].total_reps));
check('semana -1: 3x11 + 3x9 = 60 reps', 60, Number(weekly[1].total_reps));
check('semana actual: 3x12 + 3x10 = 66 reps (sin calentamiento)', 66, Number(weekly[2].total_reps));
check('el calentamiento NO suma a las series', 6, Number(weekly[2].total_sets));
check('una sesion por semana', [1, 1, 1], weekly.map((w) => Number(w.sessions)));
check('el RIR medio de la semana actual es 1', 1, Number(weekly[2].avg_rir));
check('volumen semana actual: 80x(36+30) = 5280', 5280, Number(weekly[2].total_volume_kg));

// Las semanas son lunes-domingo y estan separadas exactamente 7 dias.
const gaps = [1, 2].map((i) =>
  (new Date(weekly[i].week_start) - new Date(weekly[i - 1].week_start)) / 86400_000);
check('las semanas van de 7 en 7 dias', [7, 7], gaps);
check('cada semana empieza en lunes', [1, 1, 1],
  weekly.map((w) => new Date(`${w.week_start}T12:00:00Z`).getUTCDay()));

// ── 2. Desglose por ejercicio ──────────────────────────────────────────
console.log('\n-- 2. Desglose por ejercicio ----------------------------------');
const byExercise = must('by exercise', await supabase.rpc('get_routine_exercise_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'Europe/Madrid', p_weeks: 12,
}));

check('3 semanas x 2 ejercicios = 6 filas', 6, byExercise.length);
const currentWeek = weekly[2].week_start;
const thisWeek = byExercise.filter((r) => r.week_start === currentWeek);
check('la semana actual tiene 2 ejercicios', 2, thisWeek.length);

const benchRow = thisWeek.find((r) => r.exercise_id === bench.id);
const squatRow = thisWeek.find((r) => r.exercise_id === squat.id);
check('press: 3x12 = 36 reps efectivas', 36, Number(benchRow.total_reps));
check('press: el calentamiento no cuenta como serie', 3, Number(benchRow.total_sets));
check('sentadilla: 3x10 = 30 reps', 30, Number(squatRow.total_reps));
check('trae el nombre del ejercicio', 'Press de banca con barra', benchRow.exercise_name);

// La suma del desglose debe cuadrar con el total de la semana.
check('el desglose cuadra con el total semanal', 66,
  thisWeek.reduce((sum, r) => sum + Number(r.total_reps), 0));

// ── 3. Zona horaria ────────────────────────────────────────────────────
console.log('\n-- 3. Zona horaria --------------------------------------------');
const utc = must('utc', await supabase.rpc('get_routine_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'UTC', p_weeks: 12,
}));
check('el total de reps no depende de la zona', 180,
  utc.reduce((sum, w) => sum + Number(w.total_reps), 0));
check('y coincide con el total en Madrid', 180,
  weekly.reduce((sum, w) => sum + Number(w.total_reps), 0));

// ── 4. Ventana de semanas ──────────────────────────────────────────────
console.log('\n-- 4. Ventana p_weeks -----------------------------------------');
const lastTwo = must('2 semanas', await supabase.rpc('get_routine_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'Europe/Madrid', p_weeks: 2,
}));
check('p_weeks=2 recorta el historial', true, lastTwo.length <= 2);
check('y conserva la semana actual', 66, Number(lastTwo[lastTwo.length - 1].total_reps));

// ── 5. Aislamiento entre usuarios ──────────────────────────────────────
console.log('\n-- 5. Aislamiento -------------------------------------------');
const other = client();
const { error: otherError } = await other.auth.signUp({
  email: `weekly_other_${stamp}@test.local`, password: 'Password123!',
});
if (otherError) throw otherError;

const intruder = must('rpc ajena', await other.rpc('get_routine_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'Europe/Madrid', p_weeks: 12,
}));
check('otro usuario no ve el progreso de esta rutina', 0, intruder.length);

const intruderDetail = must('rpc ajena detalle', await other.rpc('get_routine_exercise_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'Europe/Madrid', p_weeks: 12,
}));
check('ni el desglose por ejercicio', 0, intruderDetail.length);

// ── 6. Sesiones sueltas ────────────────────────────────────────────────
console.log('\n-- 6. Casos limite --------------------------------------------');
// Un entreno en blanco (sin rutina) no debe contaminar el progreso.
const looseId = randomUUID();
must('suelta', await supabase.from('workout_sessions').insert({ id: looseId, user_id: userId, name: 'Suelto' }));
const looseSe = randomUUID();
must('suelta se', await supabase.from('session_exercises').insert({
  id: looseSe, session_id: looseId, user_id: userId, exercise_id: bench.id, position: 0,
}));
must('suelta set', await supabase.from('workout_sets').insert({
  id: randomUUID(), session_exercise_id: looseSe, user_id: userId, set_number: 1, weight_kg: 100, reps: 99,
}));
must('suelta fin', await supabase.from('workout_sessions')
  .update({ finished_at: new Date().toISOString() }).eq('id', looseId));

const afterLoose = must('recheck', await supabase.rpc('get_routine_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'Europe/Madrid', p_weeks: 12,
}));
check('un entreno sin rutina no suma a la rutina', 66,
  Number(afterLoose[afterLoose.length - 1].total_reps));

// Una sesion aun abierta tampoco cuenta: el progreso es de lo terminado.
const openId = randomUUID();
must('abierta', await supabase.from('workout_sessions').insert({
  id: openId, user_id: userId, name: 'En curso', routine_id: routineId,
}));
const openSe = randomUUID();
must('abierta se', await supabase.from('session_exercises').insert({
  id: openSe, session_id: openId, user_id: userId, exercise_id: bench.id, position: 0,
}));
must('abierta set', await supabase.from('workout_sets').insert({
  id: randomUUID(), session_exercise_id: openSe, user_id: userId, set_number: 1, weight_kg: 80, reps: 50,
}));

const afterOpen = must('recheck 2', await supabase.rpc('get_routine_weekly_reps', {
  p_routine_id: routineId, p_timezone: 'Europe/Madrid', p_weeks: 12,
}));
check('un entreno sin terminar no suma todavia', 66,
  Number(afterOpen[afterOpen.length - 1].total_reps));

console.log('\n================================================');
console.log(`   PASS: ${pass}    FAIL: ${fail}`);
console.log('================================================');
process.exit(fail === 0 ? 0 : 1);
