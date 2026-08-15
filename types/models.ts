/**
 * Friendly aliases over the generated database types.
 *
 * Import from here in app code so a schema change surfaces as one broken
 * alias rather than dozens of broken `Database['public']['Tables'][...]`
 * lookups scattered across screens.
 */
import type { Database, Tables, TablesInsert } from '@/types/database';

export type Profile = Tables<'profiles'>;
export type Exercise = Tables<'exercises'>;
export type Routine = Tables<'routines'>;
export type RoutineExercise = Tables<'routine_exercises'>;
export type WorkoutSession = Tables<'workout_sessions'>;
export type SessionExercise = Tables<'session_exercises'>;
export type WorkoutSet = Tables<'workout_sets'>;

export type WorkoutSetInsert = TablesInsert<'workout_sets'>;
export type SessionExerciseInsert = TablesInsert<'session_exercises'>;

export type MuscleGroup = Database['public']['Enums']['muscle_group'];
export type Equipment = Database['public']['Enums']['equipment'];
export type SetType = Database['public']['Enums']['set_type'];
export type WeightUnit = Database['public']['Enums']['weight_unit'];

/** Shape of the `sets` jsonb column in v_exercise_last_performance. */
export type LastPerformanceSet = {
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
  set_type: SetType;
};

export type LastPerformance = {
  exercise_id: string;
  session_id: string;
  performed_at: string;
  working_sets: number;
  top_weight_kg: number | null;
  sets: LastPerformanceSet[];
};

export type SessionSummary = Tables<'v_session_summary'>;

/** Spanish labels for the enums. The UI is Spanish-only for now. */
export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebrazo',
  quads: 'Cuádriceps',
  hamstrings: 'Isquios',
  glutes: 'Glúteos',
  calves: 'Gemelos',
  core: 'Core',
  full_body: 'Cuerpo completo',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  machine: 'Máquina',
  cable: 'Polea',
  bodyweight: 'Peso corporal',
  kettlebell: 'Kettlebell',
  band: 'Goma',
  other: 'Otro',
};

export const SET_TYPE_LABEL: Record<SetType, string> = {
  working: 'Efectiva',
  warmup: 'Calentamiento',
  dropset: 'Dropset',
  failure: 'Al fallo',
};
