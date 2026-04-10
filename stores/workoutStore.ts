// Offline-first active workout state
// All mutations immediately persist to AsyncStorage → sync to Supabase on finish

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import type { ActiveWorkoutState, ActiveExercise, ActiveSet } from '@/types';
import type { RoutineExercise } from '@/types/database';

interface WorkoutStore {
  workout: ActiveWorkoutState | null;
  isRestTimerActive: boolean;
  restSecondsLeft: number;
  restTimerExerciseId: string | null;

  // Session management
  startWorkout: (params: {
    routineId: string | null;
    name: string;
    exercises: RoutineExercise[];
    bodyWeightKg: number | null;
  }) => Promise<void>;
  resumeWorkout: () => Promise<void>;
  finishWorkout: () => ActiveWorkoutState | null;
  discardWorkout: () => Promise<void>;

  // Set management
  logSet: (exerciseIndex: number, setData: Omit<ActiveSet, 'id' | 'completedAt'>) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<ActiveSet>) => void;
  deleteSet: (exerciseIndex: number, setIndex: number) => void;
  addSet: (exerciseIndex: number) => void;

  // Navigation
  setCurrentExercise: (index: number) => void;
  setNotes: (notes: string) => void;

  // Rest timer
  startRestTimer: (seconds: number, exerciseId: string) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
}

let restTimerInterval: ReturnType<typeof setInterval> | null = null;

export const useWorkoutStore = create<WorkoutStore>()(
  subscribeWithSelector((set, get) => ({
    workout: null,
    isRestTimerActive: false,
    restSecondsLeft: 0,
    restTimerExerciseId: null,

    // ─── Session ──────────────────────────────────────────────────────────────

    startWorkout: async ({ routineId, name, exercises: routineExercises, bodyWeightKg }) => {
      const sessionId = generateId();
      const exercises: ActiveExercise[] = routineExercises.map((re) => ({
        routineExerciseId: re.id,
        exerciseId: re.exercise_id,
        exerciseName: re.exercise?.name ?? 'Exercise',
        targetSets: re.target_sets,
        targetRepsMin: re.target_reps_min,
        targetRepsMax: re.target_reps_max,
        targetWeightKg: re.target_weight_kg,
        restSeconds: re.rest_seconds,
        sets: [],
        lastSessionSets: [],
      }));

      const workout: ActiveWorkoutState = {
        sessionId,
        routineId,
        name,
        startedAt: new Date().toISOString(),
        exercises,
        currentExerciseIndex: 0,
        notes: '',
        bodyWeightKg,
      };

      set({ workout });
      await storage.setActiveWorkout(workout);
    },

    resumeWorkout: async () => {
      const saved = await storage.getActiveWorkout<ActiveWorkoutState>();
      if (saved) set({ workout: saved });
    },

    finishWorkout: () => {
      const { workout } = get();
      if (!workout) return null;
      storage.clearActiveWorkout();
      set({ workout: null });
      return workout;
    },

    discardWorkout: async () => {
      await storage.clearActiveWorkout();
      set({ workout: null });
    },

    // ─── Sets ─────────────────────────────────────────────────────────────────

    logSet: (exerciseIndex, setData) => {
      const workout = get().workout;
      if (!workout) return;

      const exercises = [...workout.exercises];
      const exercise = exercises[exerciseIndex];
      if (!exercise) return;

      const newSet: ActiveSet = {
        id: generateId(),
        completedAt: new Date().toISOString(),
        ...setData,
      };

      exercises[exerciseIndex] = {
        ...exercise,
        sets: [...exercise.sets, newSet],
      };

      const updated = { ...workout, exercises };
      set({ workout: updated });
      storage.setActiveWorkout(updated);
    },

    updateSet: (exerciseIndex, setIndex, updates) => {
      const workout = get().workout;
      if (!workout) return;

      const exercises = [...workout.exercises];
      const exercise = exercises[exerciseIndex];
      if (!exercise) return;

      const sets = [...exercise.sets];
      const existing = sets[setIndex];
      if (!existing) return;

      sets[setIndex] = { ...existing, ...updates };
      exercises[exerciseIndex] = { ...exercise, sets };

      const updated = { ...workout, exercises };
      set({ workout: updated });
      storage.setActiveWorkout(updated);
    },

    deleteSet: (exerciseIndex, setIndex) => {
      const workout = get().workout;
      if (!workout) return;

      const exercises = [...workout.exercises];
      const exercise = exercises[exerciseIndex];
      if (!exercise) return;

      const sets = exercise.sets
        .filter((_, i) => i !== setIndex)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));

      exercises[exerciseIndex] = { ...exercise, sets };
      const updated = { ...workout, exercises };
      set({ workout: updated });
      storage.setActiveWorkout(updated);
    },

    addSet: (exerciseIndex) => {
      const workout = get().workout;
      if (!workout) return;

      const exercises = [...workout.exercises];
      const exercise = exercises[exerciseIndex];
      if (!exercise) return;

      const lastSet = exercise.sets[exercise.sets.length - 1];
      const newSet: ActiveSet = {
        id: generateId(),
        exerciseId: exercise.exerciseId,
        setNumber: exercise.sets.length + 1,
        weightKg: lastSet?.weightKg ?? exercise.targetWeightKg ?? null,
        reps: lastSet?.reps ?? exercise.targetRepsMax ?? null,
        rpe: null,
        isWarmup: false,
        isDropset: false,
        isFailure: false,
        notes: '',
        completedAt: null,
      };

      exercises[exerciseIndex] = {
        ...exercise,
        sets: [...exercise.sets, newSet],
      };

      const updated = { ...workout, exercises };
      set({ workout: updated });
      storage.setActiveWorkout(updated);
    },

    // ─── Navigation ────────────────────────────────────────────────────────────

    setCurrentExercise: (index) => {
      const workout = get().workout;
      if (!workout) return;
      const updated = { ...workout, currentExerciseIndex: index };
      set({ workout: updated });
      storage.setActiveWorkout(updated);
    },

    setNotes: (notes) => {
      const workout = get().workout;
      if (!workout) return;
      const updated = { ...workout, notes };
      set({ workout: updated });
      storage.setActiveWorkout(updated);
    },

    // ─── Rest Timer ────────────────────────────────────────────────────────────

    startRestTimer: (seconds, exerciseId) => {
      if (restTimerInterval) clearInterval(restTimerInterval);

      set({ isRestTimerActive: true, restSecondsLeft: seconds, restTimerExerciseId: exerciseId });

      restTimerInterval = setInterval(() => {
        get().tickRestTimer();
      }, 1000);
    },

    stopRestTimer: () => {
      if (restTimerInterval) {
        clearInterval(restTimerInterval);
        restTimerInterval = null;
      }
      set({ isRestTimerActive: false, restSecondsLeft: 0, restTimerExerciseId: null });
    },

    tickRestTimer: () => {
      const { restSecondsLeft } = get();
      if (restSecondsLeft <= 1) {
        get().stopRestTimer();
      } else {
        set({ restSecondsLeft: restSecondsLeft - 1 });
      }
    },
  }))
);
