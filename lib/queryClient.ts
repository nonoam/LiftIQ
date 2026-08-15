import { QueryClient } from '@tanstack/react-query';

/**
 * Query defaults tuned for a phone in a gym: flaky signal, long screen-off
 * gaps between sets, and a strong preference for showing stale data over a
 * spinner.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      // The default doubles up with our own refetch triggers and causes a
      // burst of requests every time the user unlocks the phone mid-workout.
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Logging a set must survive a dropped connection between sets. These
      // are idempotent upserts keyed by client-generated UUIDs, so retrying
      // cannot duplicate rows.
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
  },
});

/** Query key factory. Centralised so invalidation never misses a cache. */
export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  exercises: (search: string, muscle: string | null, equipment: string | null) =>
    ['exercises', { search, muscle, equipment }] as const,
  exercisesAll: ['exercises'] as const,
  routines: ['routines'] as const,
  routine: (id: string) => ['routine', id] as const,
  activeSession: ['session', 'active'] as const,
  session: (id: string) => ['session', id] as const,
  history: ['history'] as const,
  lastPerformance: (exerciseIds: string[]) =>
    ['lastPerformance', [...exerciseIds].sort()] as const,
};
