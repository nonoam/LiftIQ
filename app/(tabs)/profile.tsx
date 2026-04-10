import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { queryKeys } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { clearSentryUser } from '@/lib/sentry';
import { cancelTrainingReminders, scheduleTrainingReminder } from '@/lib/notifications';
import { formatWeight } from '@/lib/utils';
import type { BodyWeightEntry } from '@/types/database';

export default function ProfileScreen() {
  const { user, profile, setProfile, signOut } = useAuthStore();
  const {
    weightUnit, theme, defaultRestSeconds, progressionType, hapticFeedback,
    setWeightUnit, setTheme, setDefaultRestSeconds, setProgressionType, setHapticFeedback,
  } = useSettingsStore();
  const qc = useQueryClient();

  const [showBodyWeightInput, setShowBodyWeightInput] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  const { data: weightHistory } = useQuery({
    queryKey: queryKeys.bodyWeight(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_weight_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('recorded_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as BodyWeightEntry[];
    },
    enabled: !!user?.id,
  });

  const logWeight = useMutation({
    mutationFn: async (weight: number) => {
      const { error } = await supabase
        .from('body_weight_history')
        .upsert({
          user_id: user!.id,
          weight_kg: weight,
          recorded_at: new Date().toISOString().slice(0, 10),
        } as never, { onConflict: 'user_id,recorded_at' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bodyWeight(user?.id ?? '') });
      setShowBodyWeightInput(false);
      setNewWeight('');
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates as never)
        .eq('id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => setProfile(data),
  });

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          clearSentryUser();
          signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  if (!profile) return <LoadingSpinner />;

  const latestWeight = weightHistory?.[0];

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-white text-2xl font-bold">Profile</Text>
        </View>

        {/* User card */}
        <View className="mx-4 mb-4 bg-[#18181B] rounded-2xl p-5">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center">
              <Text className="text-3xl">👤</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">{profile.display_name ?? 'Athlete'}</Text>
              <Text className="text-[#A1A1AA] text-sm">{user?.email}</Text>
              <View className="flex-row gap-2 mt-1">
                {profile.goal && (
                  <View className="bg-primary/20 rounded-lg px-2 py-0.5">
                    <Text className="text-primary text-xs capitalize">{profile.goal}</Text>
                  </View>
                )}
                {profile.experience_level && (
                  <View className="bg-[#27272A] rounded-lg px-2 py-0.5">
                    <Text className="text-[#A1A1AA] text-xs capitalize">{profile.experience_level}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Body Weight */}
        <View className="mx-4 mb-4">
          <Text className="text-white font-bold text-base mb-3">Body Weight</Text>
          <Card>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-white font-bold text-2xl">
                  {latestWeight ? formatWeight(latestWeight.weight_kg, weightUnit) : '—'}
                </Text>
                <Text className="text-[#71717A] text-xs">
                  {latestWeight ? `Last logged: ${latestWeight.recorded_at}` : 'Not logged yet'}
                </Text>
              </View>
              <TouchableOpacity
                className="bg-primary rounded-xl px-4 py-2"
                onPress={() => setShowBodyWeightInput(!showBodyWeightInput)}
              >
                <Text className="text-white text-sm font-bold">Log</Text>
              </TouchableOpacity>
            </View>

            {showBodyWeightInput && (
              <View className="flex-row gap-2 mt-2">
                <TextInput
                  className="flex-1 bg-[#27272A] rounded-xl px-4 py-2.5 text-white text-base"
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="decimal-pad"
                  placeholder={`Weight in ${weightUnit}`}
                  placeholderTextColor="#52525B"
                  autoFocus
                />
                <TouchableOpacity
                  className="bg-[#22C55E] rounded-xl px-4 py-2.5"
                  onPress={() => {
                    const w = parseFloat(newWeight);
                    if (!w || w <= 0) return;
                    const kgWeight = weightUnit === 'lbs' ? w / 2.20462 : w;
                    logWeight.mutate(kgWeight);
                  }}
                >
                  <Text className="text-white font-bold">✓</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Weight history mini-list */}
            {weightHistory && weightHistory.length > 1 && (
              <View className="mt-3 gap-1">
                {weightHistory.slice(1, 4).map((entry) => (
                  <View key={entry.id} className="flex-row justify-between">
                    <Text className="text-[#71717A] text-xs">{entry.recorded_at}</Text>
                    <Text className="text-[#A1A1AA] text-xs">{formatWeight(entry.weight_kg, weightUnit)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>

        {/* Training Preferences */}
        <View className="mx-4 mb-4">
          <Text className="text-white font-bold text-base mb-3">Training Preferences</Text>
          <Card padding="none">
            {/* Goal */}
            <View className="px-4 py-4 border-b border-[#27272A]">
              <Text className="text-[#A1A1AA] text-xs mb-2">Training Goal</Text>
              <View className="flex-row gap-2">
                {(['strength', 'hypertrophy', 'endurance'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    className={`flex-1 py-2 rounded-xl items-center ${profile.goal === g ? 'bg-primary' : 'bg-[#27272A]'}`}
                    onPress={() => updateProfile.mutate({ goal: g })}
                  >
                    <Text className={`text-xs capitalize font-semibold ${profile.goal === g ? 'text-white' : 'text-[#A1A1AA]'}`}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Progression type */}
            <View className="px-4 py-4 border-b border-[#27272A]">
              <Text className="text-[#A1A1AA] text-xs mb-2">Progression Type</Text>
              <View className="flex-row gap-2">
                {(['linear', 'double', 'undulating'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    className={`flex-1 py-2 rounded-xl items-center ${progressionType === p ? 'bg-primary' : 'bg-[#27272A]'}`}
                    onPress={() => {
                      setProgressionType(p);
                      updateProfile.mutate({ progression_type: p });
                    }}
                  >
                    <Text className={`text-xs capitalize font-semibold ${progressionType === p ? 'text-white' : 'text-[#A1A1AA]'}`}>
                      {p === 'undulating' ? 'Wave' : p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Default rest */}
            <View className="px-4 py-4 border-b border-[#27272A]">
              <Text className="text-[#A1A1AA] text-xs mb-2">Default Rest (seconds)</Text>
              <View className="flex-row gap-2">
                {[60, 90, 120, 180, 240].map((s) => (
                  <TouchableOpacity
                    key={s}
                    className={`flex-1 py-2 rounded-xl items-center ${defaultRestSeconds === s ? 'bg-primary' : 'bg-[#27272A]'}`}
                    onPress={() => setDefaultRestSeconds(s)}
                  >
                    <Text className={`text-xs font-semibold ${defaultRestSeconds === s ? 'text-white' : 'text-[#A1A1AA]'}`}>{s}s</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Weight unit */}
            <View className="px-4 py-4">
              <Text className="text-[#A1A1AA] text-xs mb-2">Weight Unit</Text>
              <View className="flex-row gap-2 w-40">
                {(['kg', 'lbs'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    className={`flex-1 py-2 rounded-xl items-center ${weightUnit === u ? 'bg-primary' : 'bg-[#27272A]'}`}
                    onPress={() => setWeightUnit(u)}
                  >
                    <Text className={`text-sm font-bold ${weightUnit === u ? 'text-white' : 'text-[#A1A1AA]'}`}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </View>

        {/* App Settings */}
        <View className="mx-4 mb-4">
          <Text className="text-white font-bold text-base mb-3">App Settings</Text>
          <Card padding="none">
            <View className="px-4 py-4 flex-row justify-between items-center border-b border-[#27272A]">
              <View>
                <Text className="text-white text-sm">Haptic Feedback</Text>
                <Text className="text-[#71717A] text-xs mt-0.5">Vibration on set log</Text>
              </View>
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                thumbColor="white"
              />
            </View>

            <TouchableOpacity
              className="px-4 py-4 flex-row justify-between items-center border-b border-[#27272A]"
              onPress={() => router.push('/muscle-map')}
            >
              <Text className="text-white text-sm">Muscle Map</Text>
              <Text className="text-[#71717A]">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="px-4 py-4 flex-row justify-between items-center">
              <Text className="text-white text-sm">Notifications</Text>
              <Text className="text-[#71717A]">→</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Sign out */}
        <View className="mx-4 mb-4">
          <TouchableOpacity
            className="bg-[#EF4444]/20 border border-[#EF4444]/30 rounded-2xl py-4 items-center"
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <Text className="text-[#EF4444] font-bold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text className="text-[#52525B] text-xs text-center pb-4">LiftIQ v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
