import '~/global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { initSentry, setSentryUser, clearSentryUser } from '@/lib/sentry';
import { registerForPushNotifications } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();
initSentry();

export default function RootLayout() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setLoading(false);

        if (session?.user) {
          setSentryUser(session.user.id, session.user.email);
          await registerForPushNotifications();
          // Fetch profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) useAuthStore.getState().setProfile(profile);
        } else {
          clearSentryUser();
        }

        SplashScreen.hideAsync();
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090B' } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="workout/[sessionId]"
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="workout/complete"
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="exercise/[exerciseId]" />
            <Stack.Screen name="routine/[routineId]" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
