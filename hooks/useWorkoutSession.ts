import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/uuid';
import { useActiveWorkoutStore } from '@/stores/activeWorkout';
import type {
  Exercise,
  LastPerformance,
  SessionExercise,
  SetType,
  WorkoutSession,
  WorkoutSet,
} from '@/types/models';

export type ActiveSessionExercise = SessionExercise & {
  exercise: Exercise;
  workout_sets: WorkoutSet[];
};

export type ActiveSession = WorkoutSession & {
  session_exercises: ActiveSessionExercise[];
};

const SESSION_SELECT = `
  *,
  session_exercises (
    *,
    exercise:exercises (*),
    workout_sets (*)
  )
`;

/** Sort nested rows client-side: PostgREST cannot order two levels down. */
function normalise(session: ActiveSession): ActiveSession {
  const exercises = [...session.session_exercises]
    .sort((a, b) => a.position - b.position)
    .map((se) => ({
      ...se,
      workout_sets: [...se.workout_sets].sort((a, b) => a.set_number - b.set_number),
    }));
  return { ...session, session_exercises: exercises };
}

/**
 * The workout in progress, if any.
 *
 * A partial unique index guarantees at most one session with finished_at NULL
 * per user, so this is unambiguous — that is what makes "continuar entreno"
 * a single button rather than a list to choose from.
 */
export function useActiveSession() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.activeSession,
    enabled: Boolean(user),
    // Always refetch on mount: coming back to a workout after the app was
    // killed must show the server's truth, not a stale cache.
    staleTime: 0,
    queryFn: async (): Promise<ActiveSession | null> => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(SESSION_SELECT)
        .is('finished_at', null)
        .maybeSingle();

      if (error) throw error;
      return data ? normalise(data as ActiveSession) : null;
    },
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.session(sessionId ?? ''),
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<ActiveSession> => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(SESSION_SELECT)
        .eq('id', sessionId!)
        .single();
      if (error) throw error;
      return normalise(data as ActiveSession);
    },
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const startLocalSession = useActiveWorkoutStore((s) => s.startSession);

  return useMutation({
    mutationFn: async (input: { name?: string; routineId?: string | null }) => {
      const sessionId = newId();

      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          id: sessionId,
          user_id: user!.id,
          name: input.name?.trim() || 'Entreno',
          routine_id: input.routineId ?? null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya tienes un entreno abierto. Continúalo o termínalo antes.');
        }
        throw error;
      }

      // Starting from a routine copies its exercises across, in order, so the
      // user opens the screen with the workout already laid out.
      if (input.routineId) {
        const { data: template, error: templateError } = await supabase
          .from('routine_exercises')
          .select('exercise_id, position')
          .eq('routine_id', input.routineId)
          .order('position');

        if (templateError) throw templateError;

        if (template && template.length > 0) {
          const { error: copyError } = await supabase.from('session_exercises').insert(
            template.map((row) => ({
              id: newId(),
              session_id: sessionId,
              user_id: user!.id,
              exercise_id: row.exercise_id,
              position: row.position,
            })),
          );
          if (copyError) throw copyError;
        }
      }

      return session;
    },
    onSuccess: (session) => {
      startLocalSession(session.id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
    },
  });
}

export function useAddExerciseToSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { sessionId: string; exerciseId: string; position: number }) => {
      const { data, error } = await supabase
        .from('session_exercises')
        .insert({
          id: newId(),
          session_id: input.sessionId,
          user_id: user!.id,
          exercise_id: input.exerciseId,
          position: input.position,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
    },
  });
}

export function useRemoveExerciseFromSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionExerciseId: string) => {
      const { error } = await supabase
        .from('session_exercises')
        .delete()
        .eq('id', sessionExerciseId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
    },
  });
}

/**
 * Record a set.
 *
 * Upsert on a client-generated id rather than insert: the mutation is retried
 * automatically on failure (see queryClient defaults) and a gym connection
 * drops often enough that a retry re-inserting the same set is a real risk.
 */
export function useLogSet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      sessionExerciseId: string;
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
      rir: number | null;
      setType?: SetType;
    }) => {
      const { data, error } = await supabase
        .from('workout_sets')
        .upsert(
          {
            id: input.id ?? newId(),
            session_exercise_id: input.sessionExerciseId,
            user_id: user!.id,
            set_number: input.setNumber,
            weight_kg: input.weightKg,
            reps: input.reps,
            rir: input.rir,
            set_type: input.setType ?? 'working',
          },
          { onConflict: 'id' },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase.from('workout_sets').delete().eq('id', setId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
    },
  });
}

export function useFinishSession() {
  const queryClient = useQueryClient();
  const clearLocalSession = useActiveWorkoutStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async (input: { sessionId: string; notes?: string }) => {
      // Setting finished_at is only the signal to close the session: the
      // trg_workout_sessions_finalise trigger overwrites it with the server
      // clock and computes duration_seconds from it, so a phone whose clock
      // has drifted cannot record a negative or wildly wrong duration.
      const { error } = await supabase
        .from('workout_sessions')
        .update({
          finished_at: new Date().toISOString(),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        })
        .eq('id', input.sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      clearLocalSession();
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
      void queryClient.invalidateQueries({ queryKey: queryKeys.history });
      // The finished workout becomes the new "last time" reference.
      void queryClient.invalidateQueries({ queryKey: ['lastPerformance'] });
    },
  });
}

/** Discards an in-progress workout entirely. Sets cascade. */
export function useDiscardSession() {
  const queryClient = useQueryClient();
  const clearLocalSession = useActiveWorkoutStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      clearLocalSession();
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
    },
  });
}

/**
 * What the user did the last time they trained each of these exercises.
 *
 * One request for the whole screen rather than one per exercise, and the view
 * does the "most recent finished session" work in Postgres.
 */
export function useLastPerformance(exerciseIds: string[]) {
  return useQuery({
    queryKey: queryKeys.lastPerformance(exerciseIds),
    enabled: exerciseIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Record<string, LastPerformance>> => {
      const { data, error } = await supabase
        .from('v_exercise_last_performance')
        .select('*')
        .in('exercise_id', exerciseIds);

      if (error) throw error;

      const byExercise: Record<string, LastPerformance> = {};
      for (const row of data ?? []) {
        if (row.exercise_id) byExercise[row.exercise_id] = row as unknown as LastPerformance;
      }
      return byExercise;
    },
  });
}
