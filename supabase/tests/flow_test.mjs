/**
 * ═══════════════════════════════════════════════════════════════════════
 * LiftIQ — prueba del flujo completo con el cliente real de Supabase.
 *
 *   npx supabase start
 *   npm run test:flow
 *
 * Ejecuta exactamente las mismas consultas que los hooks de la app
 * (hooks/useWorkoutSession.ts, useRoutines.ts, useHistory.ts), así que
 * valida lo que el typecheck no puede: que los selects anidados, los
 * upserts y las vistas devuelven lo que las pantallas esperan.
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
  const ok = JSON.stringify(expected) === JSON.stringify(actual);
  if (ok) {
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

const supabase = createClient(API, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Mirrors SESSION_SELECT in hooks/useWorkoutSession.ts.
const SESSION_SELECT = `
  *,
  session_exercises (
    *,
    exercise:exercises (*),
    workout_sets (*)
  )
`;

const email = `flow_${Date.now()}@test.local`;
const { data: signUp, error: signUpError } = await supabase.auth.signUp({
  email,
  password: 'Password123!',
});
if (signUpError) throw signUpError;
const userId = signUp.user.id;
console.log(`Usuario ${email}\n`);

// ── 1. Catálogo ────────────────────────────────────────────────────────
console.log('-- 1. Catalogo de ejercicios ----------------------------------');
const allExercises = must(
  'catalogo',
  await supabase.from('exercises').select('*').eq('is_active', true).limit(200),
);
check('el seed carga el catalogo', true, allExercises.length >= 80);

const search = must(
  'busqueda',
  await supabase.from('exercises').select('*').ilike('name', '%press%'),
);
check('la busqueda ilike encuentra "press"', true, search.length >= 5);

const byMuscle = must(
  'filtro',
  await supabase.from('exercises').select('*').eq('muscle_group', 'hamstrings'),
);
check('el filtro por grupo muscular funciona', true, byMuscle.length >= 5);

const squat = allExercises.find((e) => e.name === 'Sentadilla con barra');
const bench = allExercises.find((e) => e.name === 'Press de banca con barra');
check('encuentra sentadilla y press', true, Boolean(squat && bench));

// ── 2. Rutina ──────────────────────────────────────────────────────────
console.log('\n-- 2. Rutina como plantilla -----------------------------------');
const routineId = randomUUID();
must(
  'crear rutina',
  await supabase.from('routines').insert({ id: routineId, user_id: userId, name: 'Pierna A' }),
);
must(
  'anadir ejercicios a la rutina',
  await supabase.from('routine_exercises').insert([
    { id: randomUUID(), routine_id: routineId, user_id: userId, exercise_id: squat.id, position: 0, target_sets: 3, target_rir: 2 },
    { id: randomUUID(), routine_id: routineId, user_id: userId, exercise_id: bench.id, position: 1, target_sets: 3, target_rir: 1 },
  ]),
);

// Reordenar: depende de que el UNIQUE (routine_id, position) sea DEFERRABLE.
const current = must(
  'leer rutina',
  await supabase.from('routine_exercises').select('*').eq('routine_id', routineId).order('position'),
);
const swapped = [current[1], current[0]].map((row, index) => ({ ...row, position: index }));
const reorderResult = await supabase.from('routine_exercises').upsert(swapped, { onConflict: 'id' });
check('reordenar no viola el unique (DEFERRABLE)', null, reorderResult.error);

const reordered = must(
  'releer rutina',
  await supabase.from('routine_exercises').select('exercise_id, position').eq('routine_id', routineId).order('position'),
);
check('el orden queda invertido', [bench.id, squat.id], reordered.map((r) => r.exercise_id));

// ── 3. Sesión desde rutina ─────────────────────────────────────────────
console.log('\n-- 3. Sesion desde la rutina ----------------------------------');
const session1Id = randomUUID();
must(
  'crear sesion',
  await supabase.from('workout_sessions').insert({
    id: session1Id, user_id: userId, name: 'Pierna A', routine_id: routineId,
  }),
);
const template = must(
  'leer plantilla',
  await supabase.from('routine_exercises').select('exercise_id, position').eq('routine_id', routineId).order('position'),
);
must(
  'copiar plantilla a la sesion',
  await supabase.from('session_exercises').insert(
    template.map((row) => ({
      id: randomUUID(), session_id: session1Id, user_id: userId,
      exercise_id: row.exercise_id, position: row.position,
    })),
  ),
);

const active = must(
  'sesion activa',
  await supabase.from('workout_sessions').select(SESSION_SELECT).is('finished_at', null).maybeSingle(),
);
check('la sesion activa es unica y se encuentra', session1Id, active.id);
check('trae los 2 ejercicios de la rutina anidados', 2, active.session_exercises.length);
check('el select anidado trae el ejercicio', true, Boolean(active.session_exercises[0].exercise?.name));

// ── 4. Registrar series con RIR ────────────────────────────────────────
console.log('\n-- 4. Registrar series con RIR --------------------------------');
const benchSe = active.session_exercises.find((se) => se.exercise_id === bench.id);
const setId = randomUUID();

const logged = must(
  'registrar serie',
  await supabase.from('workout_sets').upsert({
    id: setId, session_exercise_id: benchSe.id, user_id: userId,
    set_number: 1, weight_kg: 80, reps: 8, rir: 2,
  }, { onConflict: 'id' }).select().single(),
);
check('la serie guarda el RIR', 2, logged.rir);

// El upsert con el mismo id es lo que hace seguro el reintento automatico.
must(
  'reintento idempotente',
  await supabase.from('workout_sets').upsert({
    id: setId, session_exercise_id: benchSe.id, user_id: userId,
    set_number: 1, weight_kg: 80, reps: 8, rir: 2,
  }, { onConflict: 'id' }),
);
const afterRetry = must(
  'contar series',
  await supabase.from('workout_sets').select('id').eq('session_exercise_id', benchSe.id),
);
check('reintentar el mismo id NO duplica la serie', 1, afterRetry.length);

must('serie 2', await supabase.from('workout_sets').insert({
  id: randomUUID(), session_exercise_id: benchSe.id, user_id: userId,
  set_number: 2, weight_kg: 80, reps: 7, rir: 1,
}));
must('calentamiento', await supabase.from('workout_sets').insert({
  id: randomUUID(), session_exercise_id: benchSe.id, user_id: userId,
  set_number: 3, weight_kg: 40, reps: 10, rir: 5, set_type: 'warmup',
}));

// ── 5. Terminar e historial ────────────────────────────────────────────
console.log('\n-- 5. Terminar el entreno -------------------------------------');
const startedAt = new Date(Date.now() - 3600_000).toISOString();
must('ajustar inicio', await supabase.from('workout_sessions').update({ started_at: startedAt }).eq('id', session1Id));

// Se manda una hora de fin DELIBERADAMENTE mala (10 minutos en el pasado,
// como haria un movil con el reloj atrasado). El trigger la debe corregir.
const finished = must('terminar', await supabase.from('workout_sessions').update({
  finished_at: new Date(Date.now() - 600_000).toISOString(),
}).eq('id', session1Id).select().single());

check('el trigger corrige un reloj atrasado (fin >= inicio)', true,
  new Date(finished.finished_at) >= new Date(finished.started_at));
check('y calcula la duracion en el servidor (~3600s)', true,
  finished.duration_seconds >= 3595 && finished.duration_seconds <= 3610);

const noActive = must(
  'sin sesion activa',
  await supabase.from('workout_sessions').select('id').is('finished_at', null).maybeSingle(),
);
check('ya no hay sesion abierta', null, noActive);

const summary = must(
  'resumen',
  await supabase.from('v_session_summary').select('*').eq('session_id', session1Id).single(),
);
check('el resumen cuenta 2 series efectivas (excluye calentamiento)', 2, summary.working_set_count);
check('el volumen ignora el calentamiento (80x8 + 80x7 = 1200)', 1200, Number(summary.total_volume_kg));
check('cuenta los 2 ejercicios', 2, summary.exercise_count);

const history = must(
  'historial',
  await supabase.from('v_session_summary').select('*').not('finished_at', 'is', null).order('started_at', { ascending: false }),
);
check('el historial devuelve la sesion', 1, history.length);

// ── 6. Autorrelleno de la siguiente sesión ─────────────────────────────
console.log('\n-- 6. Autorrelleno desde la ultima vez ------------------------');
const lastPerf = must(
  'ultima vez',
  await supabase.from('v_exercise_last_performance').select('*').in('exercise_id', [bench.id, squat.id]),
);
check('solo el press tiene historico (la sentadilla no se hizo)', 1, lastPerf.length);

const benchPerf = lastPerf[0];
check('el press es el que tiene historico', bench.id, benchPerf.exercise_id);
check('devuelve las 3 series en jsonb', 3, benchPerf.sets.length);
check('la serie 1 conserva peso, reps y RIR', { weight_kg: 80, reps: 8, rir: 2 }, {
  weight_kg: Number(benchPerf.sets[0].weight_kg), reps: benchPerf.sets[0].reps, rir: benchPerf.sets[0].rir,
});
check('las series vienen ordenadas por set_number', [1, 2, 3], benchPerf.sets.map((s) => s.set_number));
check('working_sets excluye el calentamiento', 2, benchPerf.working_sets);

// Esto es lo que la pantalla de entreno usa para prerrellenar la fila abierta.
const prefillForSet2 = benchPerf.sets.find((s) => s.set_number === 2);
check('el prefill de la serie 2 es 80x7 @ RIR 1', { weight_kg: 80, reps: 7, rir: 1 }, {
  weight_kg: Number(prefillForSet2.weight_kg), reps: prefillForSet2.reps, rir: prefillForSet2.rir,
});

// ── 7. Un ejercicio anadido y no ejecutado no cuenta ───────────────────
console.log('\n-- 7. Casos limite --------------------------------------------');
const session2Id = randomUUID();
must('segunda sesion', await supabase.from('workout_sessions').insert({ id: session2Id, user_id: userId, name: 'Vacio' }));
must('anadir sin series', await supabase.from('session_exercises').insert({
  id: randomUUID(), session_id: session2Id, user_id: userId, exercise_id: squat.id, position: 0,
}));
// Una sesion que empieza y termina en el mismo instante: es el caso que
// rompia antes de que el servidor fuese dueno de las marcas de tiempo.
const instant = must('terminar vacia', await supabase.from('workout_sessions').update({
  finished_at: new Date().toISOString(),
}).eq('id', session2Id).select().single());
check('una sesion instantanea se cierra sin violar el CHECK', true, instant.duration_seconds >= 0);

const squatPerf = must(
  'ultima vez sentadilla',
  await supabase.from('v_exercise_last_performance').select('*').eq('exercise_id', squat.id),
);
check('un ejercicio sin series no genera "ultima vez"', 0, squatPerf.length);

// Borrar la rutina no debe llevarse por delante el historial.
must('borrar rutina', await supabase.from('routines').delete().eq('id', routineId));
const survivor = must(
  'sesion tras borrar rutina',
  await supabase.from('workout_sessions').select('id, routine_id').eq('id', session1Id).single(),
);
check('borrar la rutina conserva el entreno', session1Id, survivor.id);
check('y deja routine_id a null (ON DELETE SET NULL)', null, survivor.routine_id);

// Un ejercicio del catalogo no se puede borrar si tiene historial.
const delExercise = await supabase.from('exercises').delete().eq('id', bench.id);
const stillThere = must('press sigue', await supabase.from('exercises').select('id').eq('id', bench.id));
check('el catalogo global no lo puede borrar un usuario', 1, stillThere.length);

console.log('\n================================================');
console.log(`   PASS: ${pass}    FAIL: ${fail}`);
console.log('================================================');
process.exit(fail === 0 ? 0 : 1);
