import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import type { Profile, WeightUnit } from '@/types/models';

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.profile(userId ?? 'anonymous'),
    enabled: Boolean(userId),
    // The profile changes only when the user edits it, so keep it warm: it is
    // read by nearly every screen to know whether to render kg or lb.
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * The display unit, with a safe default while the profile loads.
 *
 * Screens need a unit synchronously to render; blocking each of them on the
 * profile query would mean a spinner on every list. kg matches the storage
 * unit, so the fallback is a no-op conversion rather than a wrong number.
 */
export function useWeightUnit(): WeightUnit {
  const { data } = useProfile();
  return data?.weight_unit ?? 'kg';
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'display_name' | 'weight_unit' | 'default_rest_seconds' | 'onboarding_complete'>>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile(profile.id), profile);
    },
  });
}
