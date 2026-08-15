import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Local state for the workout in progress.
 *
 * Division of responsibility with the server:
 *
 *   · Supabase owns the *committed* workout — the session row, its exercises,
 *     and every set the user has ticked. That is what makes the history
 *     correct and what another device would see.
 *
 *   · This store owns the *uncommitted* text in the input boxes, plus the id
 *     of the session being edited. It is persisted to AsyncStorage on every
 *     keystroke so that killing the app mid-set loses nothing.
 *
 * Drafts are strings, not numbers, on purpose: "82," is a legitimate
 * intermediate state while typing and parsing it early would fight the user.
 */

export type SetDraft = {
  weight: string;
  reps: string;
  rir: number | null;
};

/** Stable key for a set row, independent of database ids. */
export function draftKey(sessionExerciseId: string, setNumber: number): string {
  return `${sessionExerciseId}:${setNumber}`;
}

type ActiveWorkoutState = {
  sessionId: string | null;
  drafts: Record<string, SetDraft>;
  /** Epoch ms when the current rest ends, or null when no timer is running. */
  restEndsAt: number | null;

  startSession: (sessionId: string) => void;
  clearSession: () => void;
  setDraft: (key: string, patch: Partial<SetDraft>) => void;
  getDraft: (key: string) => SetDraft | undefined;
  clearDraft: (key: string) => void;
  startRest: (seconds: number) => void;
  stopRest: () => void;
};

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      drafts: {},
      restEndsAt: null,

      startSession: (sessionId) => set({ sessionId, drafts: {}, restEndsAt: null }),

      clearSession: () => set({ sessionId: null, drafts: {}, restEndsAt: null }),

      setDraft: (key, patch) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: { weight: '', reps: '', rir: null, ...state.drafts[key], ...patch },
          },
        })),

      getDraft: (key) => get().drafts[key],

      clearDraft: (key) =>
        set((state) => {
          const next = { ...state.drafts };
          delete next[key];
          return { drafts: next };
        }),

      startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000 }),

      stopRest: () => set({ restEndsAt: null }),
    }),
    {
      name: 'liftiq.active-workout',
      storage: createJSONStorage(() => AsyncStorage),
      // restEndsAt is intentionally persisted: an absolute timestamp survives
      // the app being backgrounded, which a countdown in seconds would not.
    },
  ),
);
