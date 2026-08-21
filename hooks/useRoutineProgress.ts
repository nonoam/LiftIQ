import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

/**
 * Weekly training volume for a routine.
 *
 * The device timezone is passed to Postgres so that "week" means the week
 * the user actually lived through. Aggregating in UTC would push a Monday
 * 00:30 session in Spain into the previous week, which makes the chart
 * disagree with the user's own memory of when they trained.
 */
function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export type WeeklyReps = {
  week_start: string;
  sessions: number;
  total_reps: number;
  total_sets: number;
  total_volume_kg: number;
  avg_rir: number | null;
};

export type ExerciseWeeklyReps = {
  week_start: string;
  exercise_id: string;
  exercise_name: string;
  total_reps: number;
  total_sets: number;
  avg_rir: number | null;
};

export function useRoutineWeeklyReps(routineId: string | undefined, weeks = 12) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['routineWeeklyReps', routineId, weeks],
    enabled: Boolean(routineId && user),
    queryFn: async (): Promise<WeeklyReps[]> => {
      const { data, error } = await supabase.rpc('get_routine_weekly_reps', {
        p_routine_id: routineId!,
        p_timezone: deviceTimeZone(),
        p_weeks: weeks,
      });
      if (error) throw error;
      return (data ?? []) as WeeklyReps[];
    },
  });
}

export function useRoutineExerciseWeeklyReps(routineId: string | undefined, weeks = 12) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['routineExerciseWeeklyReps', routineId, weeks],
    enabled: Boolean(routineId && user),
    queryFn: async (): Promise<ExerciseWeeklyReps[]> => {
      const { data, error } = await supabase.rpc('get_routine_exercise_weekly_reps', {
        p_routine_id: routineId!,
        p_timezone: deviceTimeZone(),
        p_weeks: weeks,
      });
      if (error) throw error;
      return (data ?? []) as ExerciseWeeklyReps[];
    },
  });
}

/**
 * Fills in the weeks with no training.
 *
 * The database only returns weeks that have sets, but a gap is exactly the
 * thing worth seeing in a progress chart — collapsing it would draw two
 * distant weeks side by side and imply continuity that did not happen.
 */
export function padMissingWeeks(rows: WeeklyReps[], weeks: number): WeeklyReps[] {
  const byWeek = new Map(rows.map((row) => [row.week_start, row]));
  const result: WeeklyReps[] = [];

  const monday = startOfIsoWeek(new Date());

  for (let offset = weeks - 1; offset >= 0; offset--) {
    const date = new Date(monday);
    date.setDate(date.getDate() - offset * 7);
    const key = toDateKey(date);

    result.push(
      byWeek.get(key) ?? {
        week_start: key,
        sessions: 0,
        total_reps: 0,
        total_sets: 0,
        total_volume_kg: 0,
        avg_rir: null,
      },
    );
  }
  return result;
}

/** Monday of the week containing `date`, in local time. */
function startOfIsoWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay() is 0 for Sunday; shift so Monday is the start of the week.
  const daysSinceMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
}

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
