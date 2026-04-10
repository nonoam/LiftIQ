import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutSessions } from '@/hooks/useWorkoutSession';
import { formatDuration, formatWeight } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

export default function WorkoutCompleteScreen() {
  const { data: sessions } = useWorkoutSessions();
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const lastSession = sessions?.[0];

  const totalVolume = lastSession?.workout_sets?.reduce(
    (acc, s) => acc + ((s.weight_kg ?? 0) * (s.reps ?? 0)), 0
  ) ?? 0;
  const totalSets = lastSession?.workout_sets?.filter(s => !s.is_warmup).length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <LinearGradient
        colors={['rgba(34,197,94,0.15)', 'transparent']}
        className="absolute top-0 left-0 right-0 h-64"
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="flex-1 items-center pt-16 pb-8 gap-8">
          {/* Trophy */}
          <View className="items-center gap-4">
            <Text className="text-7xl">🏆</Text>
            <Text className="text-white text-3xl font-bold text-center">Workout Complete!</Text>
            <Text className="text-[#22C55E] font-semibold">Great job — keep it up!</Text>
          </View>

          {/* Stats */}
          {lastSession && (
            <View className="w-full bg-[#18181B] rounded-2xl p-5 gap-4">
              <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">Session Summary</Text>

              <View className="flex-row">
                <View className="flex-1 items-center">
                  <Text className="text-white font-bold text-2xl">
                    {lastSession.duration_seconds ? formatDuration(lastSession.duration_seconds) : '—'}
                  </Text>
                  <Text className="text-[#71717A] text-xs mt-1">Duration</Text>
                </View>
                <View className="w-px bg-[#27272A]" />
                <View className="flex-1 items-center">
                  <Text className="text-white font-bold text-2xl">{totalSets}</Text>
                  <Text className="text-[#71717A] text-xs mt-1">Working Sets</Text>
                </View>
                <View className="w-px bg-[#27272A]" />
                <View className="flex-1 items-center">
                  <Text className="text-white font-bold text-2xl">{formatWeight(totalVolume, weightUnit)}</Text>
                  <Text className="text-[#71717A] text-xs mt-1">Volume</Text>
                </View>
              </View>
            </View>
          )}

          {/* PRs */}
          <View className="w-full items-center gap-2">
            <Text className="text-[#22C55E] font-semibold">Keep tracking to unlock progress insights!</Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View className="px-6 pb-8 gap-3">
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3 items-center"
          onPress={() => router.replace('/(tabs)/history')}
        >
          <Text className="text-[#A1A1AA] text-sm">View full history</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
