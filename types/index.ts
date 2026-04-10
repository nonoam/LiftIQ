// App-level types (not tied to DB schema)

export interface ActiveSet {
  id: string;               // local UUID
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  isDropset: boolean;
  isFailure: boolean;
  notes: string;
  completedAt: string | null;  // ISO string, null = not yet logged
}

export interface ActiveExercise {
  routineExerciseId: string | null;
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetWeightKg: number | null;
  restSeconds: number;
  sets: ActiveSet[];
  // Previous session reference
  lastSessionSets: PreviousSetRef[];
}

export interface PreviousSetRef {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
}

export interface ActiveWorkoutState {
  sessionId: string;
  routineId: string | null;
  name: string;
  startedAt: string;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  notes: string;
  bodyWeightKg: number | null;
}

export interface ExerciseFilters {
  muscleGroupId: string | null;
  equipment: string | null;
  movementType: 'compound' | 'isolation' | null;
  searchQuery: string;
}

export interface ChartDataPoint {
  x: Date;
  y: number;
  label?: string;
}

export interface MuscleFrequency {
  muscleGroupId: string;
  slug: string;
  setsThisWeek: number;
  volumeThisWeek: number;
  trainingDays: number;
  frequencyLevel: 0 | 1 | 2 | 3 | 4;  // 0=none, 4=high
}

export type TimeRange = 'week' | 'month' | '3months' | 'all';

export type WeightUnit = 'kg' | 'lbs';
