import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import type { ExerciseFilters } from '@/types';
import type { Exercise, MuscleGroup } from '@/types/database';

export function useExercises(filters: ExerciseFilters) {
  return useQuery({
    queryKey: queryKeys.exercises.list({
      muscleGroupId: filters.muscleGroupId,
      equipment:     filters.equipment,
      movementType:  filters.movementType,
      searchQuery:   filters.searchQuery,
    }),
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select(`
          *,
          primary_muscle_group:muscle_groups!exercises_primary_muscle_group_id_fkey(*),
          media:exercise_media(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (filters.muscleGroupId) {
        query = query.eq('primary_muscle_group_id', filters.muscleGroupId);
      }
      if (filters.equipment) {
        query = query.eq('equipment', filters.equipment);
      }
      if (filters.movementType) {
        query = query.eq('movement_type', filters.movementType);
      }
      if (filters.searchQuery.trim()) {
        query = query.ilike('name', `%${filters.searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Exercise[];
    },
    staleTime: 1000 * 60 * 10, // 10 min — catalog rarely changes
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: queryKeys.exercises.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          primary_muscle_group:muscle_groups!exercises_primary_muscle_group_id_fkey(*),
          media:exercise_media(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    enabled: !!id,
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: queryKeys.muscleGroups,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as MuscleGroup[];
    },
    staleTime: Infinity,
  });
}

export function useCreateCustomExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      primary_muscle_group_id: string;
      secondary_muscle_group_ids: string[];
      movement_type: 'compound' | 'isolation';
      equipment: string;
      instructions?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('exercises')
        .insert({ ...payload, is_custom: true, created_by: user.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises.all() });
    },
  });
}
