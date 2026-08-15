import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import type { SessionSummary } from '@/types/models';

/**
 * Finished sessions, newest first.
 *
 * Reads the v_session_summary view so the totals (volume, set count) are
 * computed in Postgres. Pulling every set to the phone to add them up would
 * grow linearly with training history for no benefit.
 */
export function useHistory(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.history, limit],
    enabled: Boolean(user),
    queryFn: async (): Promise<SessionSummary[]> => {
      const { data, error } = await supabase
        .from('v_session_summary')
        .select('*')
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

/** Sessions completed in the last 7 days — the "this week" counter on Home. */
export function useWeekStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.history, 'week'],
    enabled: Boolean(user),
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const { data, error } = await supabase
        .from('v_session_summary')
        .select('session_id, working_set_count, total_volume_kg, duration_seconds')
        .not('finished_at', 'is', null)
        .gte('started_at', since.toISOString());

      if (error) throw error;

      return {
        sessions: data.length,
        sets: data.reduce((sum, row) => sum + (row.working_set_count ?? 0), 0),
        volumeKg: data.reduce((sum, row) => sum + Number(row.total_volume_kg ?? 0), 0),
        durationSeconds: data.reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0),
      };
    },
  });
}
