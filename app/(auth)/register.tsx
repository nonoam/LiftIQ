import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { captureError } from '@/lib/sentry';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;
      // Profile is auto-created by DB trigger
      router.replace('/(auth)/onboarding');
    } catch (err) {
      captureError(err);
      Alert.alert('Registration failed', err instanceof Error ? err.message : 'An error occurred.');
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
            <View className="gap-2">
              <TouchableOpacity onPress={() => router.back()} className="self-start mb-2">
                <Text className="text-[#A1A1AA] text-base">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-white">Create account</Text>
              <Text className="text-[#A1A1AA]">Start tracking your progress today</Text>
            </View>

            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-[#A1A1AA] text-sm font-medium">Full name</Text>
                <TextInput
                  className="bg-[#27272A] rounded-xl px-4 py-3.5 text-white text-base"
                  placeholder="Your name"
                  placeholderTextColor="#52525B"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                />
              </View>

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
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#52525B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <TouchableOpacity
                className={`rounded-2xl py-4 items-center mt-2 ${loading ? 'bg-primary/50' : 'bg-primary'}`}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-base">
                  {loading ? 'Creating account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center gap-1 mt-auto">
              <Text className="text-[#A1A1AA]">Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-primary font-semibold">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
