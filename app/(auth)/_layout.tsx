import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

// Without this the group's entry point depends on file ordering, and a cold
// start can land on the login form instead of the welcome screen.
export const unstable_settings = {
  initialRouteName: 'welcome',
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
