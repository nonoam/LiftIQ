import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () => set({ session: null, user: null, profile: null }),
}));

// Selector helpers
export const selectUser = (s: AuthState) => s.user;
export const selectUserId = (s: AuthState) => s.user?.id ?? null;
export const selectProfile = (s: AuthState) => s.profile;
export const selectIsPremium = (s: AuthState) => s.profile?.is_premium ?? false;
