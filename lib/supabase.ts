import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Supabase client.
 *
 * Session storage is AsyncStorage, deliberately NOT expo-secure-store:
 * SecureStore caps values at 2048 bytes on Android and a Supabase JWT with
 * claims can exceed that, which shows up as users being silently logged out
 * at random. The token is a short-lived bearer credential on a device the
 * user already controls, and every table is guarded by RLS.
 *
 * detectSessionInUrl is off because that is a browser-only OAuth flow; on
 * native we complete sign-in with an id_token instead (see lib/auth.ts).
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Refreshing tokens on a timer while the app is backgrounded burns battery and
 * the OS throttles it anyway. Drive the refresh loop off foreground state.
 */
let appStateSubscription: { remove: () => void } | null = null;

export function startSupabaseAutoRefresh() {
  if (appStateSubscription) return;

  if (AppState.currentState === 'active') {
    void supabase.auth.startAutoRefresh();
  }

  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
