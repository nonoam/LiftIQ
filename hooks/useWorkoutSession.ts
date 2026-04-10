import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { captureError } from '@/lib/sentry';
import type { ActiveWorkoutState } from '@/types';
import type { WorkoutSession } from '@/types/database';

export function useWorkoutSessions() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: queryKeys.sessions.recent(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*, workout_sets(*)')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as WorkoutSession[];
    },
    enabled: !!userId,
  });
}

/** Sync a finished offline workout to Supabase */
export function useSyncWorkout() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useMutation({
    mutationFn: async (workout: ActiveWorkoutState) => {
      const finishedAt = new Date().toISOString();
      const durationSeconds = Math.floor(
        (new Date(finishedAt).getTime() - new Date(workout.startedAt).getTime()) / 1000
      );

      // 1. Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          id: workout.sessionId,
          user_id: userId,
          routine_id: workout.routineId,
          name: workout.name,
          notes: workout.notes || null,
          started_at: workout.startedAt,
          finished_at: finishedAt,
          duration_seconds: durationSeconds,
          body_weight_kg: workout.bodyWeightKg,
          is_synced: true,
        } as never)
        .select()
        .single();

      if (sessionError) throw sessionError;
      const session = sessionData as unknown as WorkoutSession;

      // 2. Insert all sets
      const sets = workout.exercises.flatMap((ex) =>
        ex.sets
          .filter((s) => s.completedAt !== null)
          .map((s) => ({
            id: s.id,
            session_id: session.id,
            exercise_id: s.exerciseId,
            set_number: s.setNumber,
            weight_kg: s.weightKg,
            reps: s.reps,
            rpe: s.rpe,
            is_warmup: s.isWarmup,
            is_dropset: s.isDropset,
            is_failure: s.isFailure,
            notes: s.notes || null,
            completed_at: s.completedAt,
          }))
      );

      if (sets.length > 0) {
        const { error: setsError } = await supabase.from('workout_sets').insert(sets as never);
        if (setsError) throw setsError;
      }

      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.recent(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.weeklyVolume(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.muscleFrequency(userId) });
    },
    onError: async (error, workout) => {
      captureError(error, { workoutId: workout.sessionId });
      // Store offline for retry
      await storage.addPendingSession(workout);
    },
  });
}

/** Sync any pending offline sessions when connectivity returns */
export function useSyncPendingSessions() {
  const syncWorkout = useSyncWorkout();
  return async () => {
    const pending = await storage.getPendingSessions<ActiveWorkoutState>();
    for (const session of pending) {
      try {
        await syncWorkout.mutateAsync(session);
        await storage.clearPendingSession(session.sessionId);
      } catch (err) {
        captureError(err, { sessionId: session.sessionId });
      }
    }
  };
}

/** Get the last session data for a specific exercise (for reference during active workout) */
export async function getLastSessionForExercise(exerciseId: string, userId: string) {
  const { data } = await supabase
    .from('workout_sets')
    .select('*, session:workout_sessions!inner(user_id, finished_at)')
    .eq('exercise_id', exerciseId)
    .eq('workout_sessions.user_id', userId)
    .not('workout_sessions.finished_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10);

  return data ?? [];
}
