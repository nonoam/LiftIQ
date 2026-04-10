import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import type { Routine, RoutineExercise } from '@/types/database';

export function useRoutines() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: queryKeys.routines.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*, routine_exercises(*, exercise:exercises(*, primary_muscle_group:muscle_groups(*), media:exercise_media(*)))')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Routine[];
    },
    enabled: !!userId,
  });
}

export function useRoutine(id: string) {
  return useQuery({
    queryKey: queryKeys.routines.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*, routine_exercises(*, exercise:exercises(*, primary_muscle_group:muscle_groups(*), media:exercise_media(*)))')
        .eq('id', id)
        .single();
      if (error) throw error;
      const routine = data as unknown as Routine;
      if (routine.routine_exercises) {
        routine.routine_exercises.sort((a: RoutineExercise, b: RoutineExercise) => a.position - b.position);
      }
      return routine;
    },
    enabled: !!id,
  });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('routines')
        .insert({ name, user_id: userId } as never)
        .select()
        .single();
      if (error) throw error;
      return data as Routine;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.routines.all(userId) }),
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Routine> & { id: string }) => {
      const { data, error } = await supabase
        .from('routines')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.routines.all(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.routines.detail(vars.id) });
    },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.routines.all(userId) }),
  });
}

export function useDuplicateRoutine() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useMutation({
    mutationFn: async (routineId: string) => {
      // Fetch original
      const { data: originalData, error: fetchError } = await supabase
        .from('routines')
        .select('*, routine_exercises(*)')
        .eq('id', routineId)
        .single();
      if (fetchError) throw fetchError;
      const original = originalData as unknown as Routine;

      // Create copy
      const { data: newRoutineData, error: createError } = await supabase
        .from('routines')
        .insert({ name: `${original.name} (Copy)`, user_id: userId, description: original.description } as never)
        .select()
        .single();
      if (createError) throw createError;
      const newRoutine = newRoutineData as unknown as Routine;

      // Copy exercises
      if (original.routine_exercises?.length) {
        const exercisesToInsert = original.routine_exercises.map((re: RoutineExercise) => ({
          routine_id: newRoutine.id,
          exercise_id: re.exercise_id,
          position: re.position,
          target_sets: re.target_sets,
          target_reps_min: re.target_reps_min,
          target_reps_max: re.target_reps_max,
          target_weight_kg: re.target_weight_kg,
          rest_seconds: re.rest_seconds,
          notes: re.notes,
        }));
        const { error: exError } = await supabase.from('routine_exercises').insert(exercisesToInsert as never);
        if (exError) throw exError;
      }

      return newRoutine;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.routines.all(userId) }),
  });
}

export function useAddExerciseToRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      routineId, exerciseId, position, targetSets = 3, restSeconds = 90,
    }: {
      routineId: string; exerciseId: string; position: number;
      targetSets?: number; restSeconds?: number;
    }) => {
      const { data, error } = await supabase
        .from('routine_exercises')
        .insert({ routine_id: routineId, exercise_id: exerciseId, position, target_sets: targetSets, rest_seconds: restSeconds } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.routines.detail(vars.routineId) });
    },
  });
}

export function useUpdateRoutineExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, routineId, ...updates
    }: Partial<RoutineExercise> & { id: string; routineId: string }) => {
      const { data, error } = await supabase
        .from('routine_exercises')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.routines.detail(vars.routineId) });
    },
  });
}

export function useRemoveExerciseFromRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, routineId }: { id: string; routineId: string }) => {
      const { error } = await supabase.from('routine_exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.routines.detail(vars.routineId) });
    },
  });
}

/** Reorder exercises: update positions for all affected items */
export function useReorderRoutineExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      routineId, exercises,
    }: { routineId: string; exercises: { id: string; position: number }[] }) => {
      const updates = exercises.map(({ id, position }) =>
        supabase.from('routine_exercises').update({ position } as never).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.routines.detail(vars.routineId) });
    },
  });
}
