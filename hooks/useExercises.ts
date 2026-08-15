import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import type { Equipment, Exercise, MuscleGroup } from '@/types/models';

type Filters = {
  search: string;
  muscleGroup: MuscleGroup | null;
  equipment: Equipment | null;
};

export function useExercises({ search, muscleGroup, equipment }: Filters) {
  return useQuery({
    queryKey: queryKeys.exercises(search.trim(), muscleGroup, equipment),
    // The catalogue is ~85 static rows plus the user's own; there is no point
    // refetching it every time the picker opens.
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Exercise[]> => {
      let query = supabase.from('exercises').select('*').eq('is_active', true);

      const term = search.trim();
      if (term) {
        // Backed by the gin_trgm_ops index on name, so this stays fast and
        // tolerates partial words ("press incl").
        query = query.ilike('name', `%${term}%`);
      }
      if (muscleGroup) query = query.eq('muscle_group', muscleGroup);
      if (equipment) query = query.eq('equipment', equipment);

      // Custom exercises first: if the user bothered to create one, it is the
      // one they are looking for.
      const { data, error } = await query
        .order('is_custom', { ascending: false })
        .order('name', { ascending: true })
        .limit(200);

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      muscleGroup: MuscleGroup;
      equipment: Equipment;
    }): Promise<Exercise> => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: input.name.trim(),
          muscle_group: input.muscleGroup,
          equipment: input.equipment,
          is_custom: true,
          owner_id: user!.id,
        })
        .select()
        .single();

      if (error) {
        // The partial unique index on (owner_id, lower(name)) surfaces as a
        // raw Postgres error; turn it into something a human can act on.
        if (error.code === '23505') {
          throw new Error('Ya tienes un ejercicio con ese nombre.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercisesAll });
    },
  });
}
