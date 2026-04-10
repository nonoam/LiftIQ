import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes
      gcTime: 1000 * 60 * 30,      // 30 minutes
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query key factories (type-safe, prevents key collisions)
export const queryKeys = {
  muscleGroups: ['muscleGroups'] as const,

  exercises: {
    all:    () => ['exercises'] as const,
    list:   (filters: Record<string, unknown>) => ['exercises', 'list', filters] as const,
    detail: (id: string) => ['exercises', 'detail', id] as const,
    media:  (id: string) => ['exercises', 'media', id] as const,
    history:(id: string, userId: string) => ['exercises', 'history', id, userId] as const,
  },

  routines: {
    all:    (userId: string) => ['routines', userId] as const,
    detail: (id: string)    => ['routines', 'detail', id] as const,
  },

  sessions: {
    all:    (userId: string) => ['sessions', userId] as const,
    detail: (id: string)    => ['sessions', 'detail', id] as const,
    recent: (userId: string) => ['sessions', 'recent', userId] as const,
  },

  profile:       (userId: string) => ['profile', userId] as const,
  bodyWeight:    (userId: string) => ['bodyWeight', userId] as const,
  predictions:   (userId: string, exerciseId: string) => ['predictions', userId, exerciseId] as const,
  weeklyVolume:  (userId: string) => ['weeklyVolume', userId] as const,
  muscleFrequency:(userId: string) => ['muscleFrequency', userId] as const,
} as const;
