import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY!;

// SecureStore adapter for Supabase Auth token persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Storage helpers
export const STORAGE_BUCKETS = {
  exerciseMedia: 'exercises-media',
  avatars: 'avatars',
} as const;

export function getExerciseMediaUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.exerciseMedia)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export function getAvatarUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.avatars)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
