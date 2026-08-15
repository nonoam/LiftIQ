import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/uuid';
import type { Exercise, Routine, RoutineExercise } from '@/types/models';

export type RoutineWithExercises = Routine & {
  routine_exercises: (RoutineExercise & { exercise: Exercise })[];
};

const ROUTINE_SELECT = `
  *,
  routine_exercises (
    *,
    exercise:exercises (*)
  )
`;

function sortExercises(routine: RoutineWithExercises): RoutineWithExercises {
  return {
    ...routine,
    routine_exercises: [...routine.routine_exercises].sort((a, b) => a.position - b.position),
  };
}

export function useRoutines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.routines,
    enabled: Boolean(user),
    queryFn: async (): Promise<RoutineWithExercises[]> => {
      const { data, error } = await supabase
        .from('routines')
        .select(ROUTINE_SELECT)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as RoutineWithExercises[]).map(sortExercises);
    },
  });
}

export function useRoutine(routineId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.routine(routineId ?? ''),
    enabled: Boolean(routineId),
    queryFn: async (): Promise<RoutineWithExercises> => {
      const { data, error } = await supabase
        .from('routines')
        .select(ROUTINE_SELECT)
        .eq('id', routineId!)
        .single();
      if (error) throw error;
      return sortExercises(data as RoutineWithExercises);
    },
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string): Promise<Routine> => {
      const { data, error } = await supabase
        .from('routines')
        .insert({ id: newId(), user_id: user!.id, name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; name?: string; notes?: string | null }) => {
      const { error } = await supabase
        .from('routines')
        .update({
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routine(variables.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routineId: string) => {
      const { error } = await supabase.from('routines').delete().eq('id', routineId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
}

export function useAddExerciseToRoutine() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { routineId: string; exerciseId: string; position: number }) => {
      const { error } = await supabase.from('routine_exercises').insert({
        id: newId(),
        routine_id: input.routineId,
        user_id: user!.id,
        exercise_id: input.exerciseId,
        position: input.position,
        target_sets: 3,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routine(variables.routineId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
}

export function useUpdateRoutineExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      routineId: string;
      patch: Partial<
        Pick<
          RoutineExercise,
          'target_sets' | 'target_reps_min' | 'target_reps_max' | 'target_rir' | 'rest_seconds' | 'notes'
        >
      >;
    }) => {
      const { error } = await supabase.from('routine_exercises').update(input.patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routine(variables.routineId) });
    },
  });
}

export function useRemoveRoutineExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; routineId: string }) => {
      const { error } = await supabase.from('routine_exercises').delete().eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routine(variables.routineId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines });
    },
  });
}

/**
 * Reorder by rewriting every position in one request.
 *
 * The (routine_id, position) unique constraint is DEFERRABLE, so the
 * intermediate states inside this transaction — where two rows briefly share
 * a position — are allowed. Without that, a simple swap would fail.
 */
export function useReorderRoutineExercises() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { routineId: string; orderedIds: string[] }) => {
      const { data: existing, error: readError } = await supabase
        .from('routine_exercises')
        .select('*')
        .eq('routine_id', input.routineId);
      if (readError) throw readError;

      const byId = new Map(existing.map((row) => [row.id, row]));
      const rows = input.orderedIds
        .map((id, index) => {
          const row = byId.get(id);
          return row ? { ...row, position: index, user_id: user!.id } : null;
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const { error } = await supabase.from('routine_exercises').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routine(variables.routineId) });
    },
  });
}
