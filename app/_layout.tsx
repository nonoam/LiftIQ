import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, initialising } = useAuth();

  // Hold the splash screen until the persisted session has been read. Routing
  // before that is a guess, and guessing wrong flashes the login screen at
  // users who are already signed in.
  useEffect(() => {
    if (!initialising) void SplashScreen.hideAsync();
  }, [initialising]);

  if (initialising) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="workout/active" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="workout/[id]" />
        <Stack.Screen name="routine/[id]" />
        <Stack.Screen
          name="exercise-picker"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
