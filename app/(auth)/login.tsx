import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { captureError } from '@/lib/sentry';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err) {
      captureError(err);
      Alert.alert('Login failed', err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'liftiq://auth/callback' },
      });
      if (error) throw error;
    } catch (err) {
      captureError(err);
      Alert.alert('Error', 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: 'liftiq://auth/callback' },
      });
      if (error) throw error;
    } catch (err) {
      captureError(err);
      Alert.alert('Error', 'Apple sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-8 pb-8 gap-8">
            {/* Header */}
            <View className="gap-2">
              <TouchableOpacity onPress={() => router.back()} className="self-start mb-2">
                <Text className="text-[#A1A1AA] text-base">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-white">Welcome back</Text>
              <Text className="text-[#A1A1AA]">Sign in to continue your journey</Text>
            </View>

            {/* Social Auth */}
            <View className="gap-3">
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-3 bg-white rounded-2xl py-4"
                  onPress={handleAppleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text className="text-black font-semibold text-base">Sign in with Apple</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="flex-row items-center justify-center gap-3 bg-[#27272A] rounded-2xl py-4"
                onPress={handleGoogleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text className="text-white font-semibold text-base">Sign in with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center gap-4">
              <View className="flex-1 h-px bg-[#27272A]" />
              <Text className="text-[#71717A] text-sm">or</Text>
              <View className="flex-1 h-px bg-[#27272A]" />
            </View>

            {/* Email/Password */}
            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-[#A1A1AA] text-sm font-medium">Email</Text>
                <TextInput
                  className="bg-[#27272A] rounded-xl px-4 py-3.5 text-white text-base"
                  placeholder="you@example.com"
                  placeholderTextColor="#52525B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View className="gap-2">
                <Text className="text-[#A1A1AA] text-sm font-medium">Password</Text>
                <TextInput
                  className="bg-[#27272A] rounded-xl px-4 py-3.5 text-white text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#52525B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                />
              </View>

              <TouchableOpacity
                className={`rounded-2xl py-4 items-center ${loading ? 'bg-primary/50' : 'bg-primary'}`}
                onPress={handleEmailLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-base">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <View className="flex-row justify-center gap-1 mt-auto">
              <Text className="text-[#A1A1AA]">Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="text-primary font-semibold">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
