import { useState } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryClient';
import { MuscleMapSVG } from '@/components/muscle-map/MuscleMapSVG';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { MUSCLE_META, setsToFrequencyLevel, FREQUENCY_COLORS } from '@/constants/muscles';
import { formatWeight } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import type { MuscleFrequency } from '@/types';
import type { WeeklyVolumeByMuscleRow } from '@/types/database';
import { startOfWeek } from 'date-fns';

export default function MuscleMapScreen() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const { data: weeklyVolume, isLoading } = useQuery({
    queryKey: queryKeys.muscleFrequency(userId),
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      const { data, error } = await supabase
        .from('weekly_volume_by_muscle')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start', weekStart);
      if (error) throw error;
      return data as WeeklyVolumeByMuscleRow[];
    },
    enabled: !!userId,
  });

  const muscleFrequency: MuscleFrequency[] = weeklyVolume?.map((row) => ({
    muscleGroupId: row.muscle_group_id,
    slug: row.muscle_group_slug,
    setsThisWeek: row.total_sets,
    volumeThisWeek: row.total_volume_kg,
    trainingDays: row.training_days,
    frequencyLevel: setsToFrequencyLevel(row.total_sets),
  })) ?? [];

  const selectedData = selectedMuscle
    ? weeklyVolume?.find((r) => r.muscle_group_slug === selectedMuscle)
    : null;
  const selectedMeta = selectedMuscle ? MUSCLE_META[selectedMuscle] : null;

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <ScreenHeader title="Muscle Map" subtitle="This week's frequency" showBack />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <MuscleMapSVG
            muscleFrequency={muscleFrequency}
            onMusclePress={setSelectedMuscle}
          />

          {/* Summary table */}
          <View className="mx-4 mt-6 gap-2">
            <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-2">
              This Week's Volume
            </Text>
            {Object.entries(MUSCLE_META).map(([slug, meta]) => {
              const data = weeklyVolume?.find((r) => r.muscle_group_slug === slug);
              const sets = data?.total_sets ?? 0;
              const level = setsToFrequencyLevel(sets);
              if (sets === 0) return null;
              return (
                <TouchableOpacity
                  key={slug}
                  className="flex-row items-center gap-3 bg-[#18181B] rounded-xl p-3"
                  onPress={() => setSelectedMuscle(slug)}
                >
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <Text className="text-white text-sm flex-1">{meta.label}</Text>
                  <Text className="text-[#A1A1AA] text-xs">{sets} sets</Text>
                  <View
                    className="w-16 h-2 rounded-full"
                    style={{ backgroundColor: FREQUENCY_COLORS[level] }}
                  />
                </TouchableOpacity>
              );
            })}
            {muscleFrequency.length === 0 && (
              <View className="items-center py-4">
                <Text className="text-[#71717A] text-sm">No training recorded this week</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Muscle detail sheet */}
      <Modal visible={!!selectedMuscle} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setSelectedMuscle(null)}
        />
        <View className="bg-[#18181B] rounded-t-3xl p-6 gap-4 pb-10">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedMeta?.color ?? '#6366F1' }}
              />
              <Text className="text-white font-bold text-lg">{selectedMeta?.label ?? '—'}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedMuscle(null)}>
              <Text className="text-[#A1A1AA]">✕</Text>
            </TouchableOpacity>
          </View>

          {selectedData ? (
            <View className="flex-row gap-4">
              <View className="flex-1 bg-[#27272A] rounded-xl p-3 items-center">
                <Text className="text-white font-bold text-xl">{selectedData.total_sets}</Text>
                <Text className="text-[#71717A] text-xs mt-0.5">Sets</Text>
              </View>
              <View className="flex-1 bg-[#27272A] rounded-xl p-3 items-center">
                <Text className="text-white font-bold text-xl">{selectedData.training_days}</Text>
                <Text className="text-[#71717A] text-xs mt-0.5">Days trained</Text>
              </View>
              <View className="flex-1 bg-[#27272A] rounded-xl p-3 items-center">
                <Text className="text-white font-bold text-xl">
                  {formatWeight(selectedData.total_volume_kg, weightUnit)}
                </Text>
                <Text className="text-[#71717A] text-xs mt-0.5">Volume</Text>
              </View>
            </View>
          ) : (
            <Text className="text-[#71717A] text-sm">No training for this muscle this week.</Text>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
