import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useExercise } from '@/hooks/useExercises';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OneRMChart } from '@/components/charts/OneRMChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { MaxWeightChart } from '@/components/charts/MaxWeightChart';
import { EQUIPMENT_LABELS, MUSCLE_META } from '@/constants/muscles';
import { estimated1RM, formatWeight } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import type { TimeRange } from '@/types';
import type { UserExerciseHistoryRow } from '@/types/database';

type Tab = 'about' | 'history' | 'charts';

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const userId = useAuthStore(s => s.user?.id ?? '');
  const weightUnit = useSettingsStore(s => s.weightUnit);
  const [tab, setTab] = useState<Tab>('about');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const { data: exercise, isLoading } = useExercise(exerciseId);

  const { data: history } = useQuery({
    queryKey: queryKeys.exercises.history(exerciseId, userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_exercise_history')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', userId)
        .order('started_at', { ascending: true });
      if (error) throw error;
      return data as UserExerciseHistoryRow[];
    },
    enabled: !!exerciseId && !!userId,
  });

  const { data: prediction } = useQuery({
    queryKey: queryKeys.predictions(userId, exerciseId),
    queryFn: async () => {
      const { data } = await supabase
        .from('progress_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as import('@/types/database').ProgressPrediction | null;
    },
    enabled: !!userId && !!exerciseId,
  });

  if (isLoading || !exercise) return <LoadingSpinner />;

  const primaryMedia = exercise.media?.find(m => m.is_primary);
  const muscleSlug = exercise.primary_muscle_group?.slug;
  const muscleMeta = muscleSlug ? MUSCLE_META[muscleSlug] : null;

  // Best 1RM from history
  const best1RM = history?.reduce((max, row) => {
    const rm = estimated1RM(row.weight_kg ?? 0, row.reps ?? 0);
    return rm > max ? rm : max;
  }, 0) ?? 0;

  // Plateau detection: last 3 weeks
  const hasHistory = (history?.length ?? 0) > 0;

  // Session summaries (unique sessions)
  const sessionMap = new Map<string, UserExerciseHistoryRow[]>();
  history?.forEach(row => {
    const existing = sessionMap.get(row.session_id) ?? [];
    sessionMap.set(row.session_id, [...existing, row]);
  });
  const sessions = Array.from(sessionMap.entries()).slice(-20);

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <ScreenHeader title={exercise.name} showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Media */}
        {primaryMedia && (
          <View className="mx-4 mb-4 rounded-2xl overflow-hidden bg-[#18181B]">
            <Image
              source={{ uri: primaryMedia.url }}
              className="w-full h-48"
              resizeMode="cover"
            />
          </View>
        )}

        {/* Metadata chips */}
        <View className="flex-row gap-2 px-4 flex-wrap mb-4">
          {muscleMeta && <Badge label={muscleMeta.label} color="primary" />}
          <Badge label={exercise.movement_type} color={exercise.movement_type === 'compound' ? 'success' : 'neutral'} />
          <Badge label={EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment} color="neutral" />
          {exercise.is_custom && <Badge label="Custom" color="warning" />}
        </View>

        {/* Stats bar */}
        {hasHistory && (
          <View className="mx-4 mb-4 bg-[#18181B] rounded-2xl p-4 flex-row">
            <View className="flex-1 items-center">
              <Text className="text-white font-bold text-lg">{formatWeight(best1RM, weightUnit)}</Text>
              <Text className="text-[#A1A1AA] text-xs mt-0.5">Best 1RM</Text>
            </View>
            <View className="w-px bg-[#27272A] mx-4" />
            <View className="flex-1 items-center">
              <Text className="text-white font-bold text-lg">{sessions.length}</Text>
              <Text className="text-[#A1A1AA] text-xs mt-0.5">Sessions</Text>
            </View>
            <View className="w-px bg-[#27272A] mx-4" />
            <View className="flex-1 items-center">
              <Text className="text-white font-bold text-lg">
                {history?.[history.length - 1]?.weight_kg
                  ? formatWeight(history[history.length - 1]!.weight_kg!, weightUnit)
                  : '—'}
              </Text>
              <Text className="text-[#A1A1AA] text-xs mt-0.5">Last weight</Text>
            </View>
          </View>
        )}

        {/* Progression Suggestion */}
        {prediction && (
          <View className="mx-4 mb-4 bg-primary/10 border border-primary/30 rounded-2xl p-4 gap-2">
            <Text className="text-primary font-bold text-sm">🎯 Suggested for next session</Text>
            <View className="flex-row gap-4">
              {prediction.suggested_weight_kg && (
                <View>
                  <Text className="text-white font-bold text-lg">
                    {formatWeight(prediction.suggested_weight_kg, weightUnit)}
                  </Text>
                  <Text className="text-[#A1A1AA] text-xs">Weight</Text>
                </View>
              )}
              {prediction.suggested_reps_min && (
                <View>
                  <Text className="text-white font-bold text-lg">
                    {prediction.suggested_reps_min}–{prediction.suggested_reps_max}
                  </Text>
                  <Text className="text-[#A1A1AA] text-xs">Reps</Text>
                </View>
              )}
              {prediction.suggested_sets && (
                <View>
                  <Text className="text-white font-bold text-lg">{prediction.suggested_sets}</Text>
                  <Text className="text-[#A1A1AA] text-xs">Sets</Text>
                </View>
              )}
            </View>
            {prediction.plateau_detected && (
              <Text className="text-[#F59E0B] text-xs">⚠️ Plateau detected — consider varying stimulus or deloading</Text>
            )}
            {prediction.is_deload_suggested && (
              <Text className="text-[#EF4444] text-xs">🔄 Deload week recommended</Text>
            )}
            <Text className="text-[#71717A] text-xs italic">{prediction.reasoning}</Text>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row mx-4 mb-4 bg-[#18181B] rounded-2xl p-1">
          {(['about', 'history', 'charts'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              className={`flex-1 py-2 rounded-xl items-center ${tab === t ? 'bg-primary' : ''}`}
              onPress={() => setTab(t)}
            >
              <Text className={`text-sm font-semibold capitalize ${tab === t ? 'text-white' : 'text-[#71717A]'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'about' && (
          <View className="px-4 gap-4">
            {exercise.instructions && (
              <View className="bg-[#18181B] rounded-2xl p-4 gap-2">
                <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">Instructions</Text>
                <Text className="text-white text-sm leading-relaxed">{exercise.instructions}</Text>
              </View>
            )}
            {exercise.primary_muscle_group && (
              <View className="bg-[#18181B] rounded-2xl p-4 gap-2">
                <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">Primary Muscle</Text>
                <Text className="text-white font-semibold">{exercise.primary_muscle_group.name}</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'history' && (
          <View className="px-4 gap-3">
            {sessions.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-[#71717A] text-sm">No history yet. Start training!</Text>
              </View>
            ) : (
              sessions.slice().reverse().map(([sessionId, sets]) => {
                const date = new Date(sets[0]!.started_at);
                const maxWeight = Math.max(...sets.map(s => s.weight_kg ?? 0));
                const totalVol = sets.reduce((acc, s) => acc + (s.set_volume_kg ?? 0), 0);
                const best = Math.max(...sets.map(s => estimated1RM(s.weight_kg ?? 0, s.reps ?? 0)));
                return (
                  <View key={sessionId} className="bg-[#18181B] rounded-2xl p-4 gap-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white font-semibold text-sm">
                        {date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      <Text className="text-[#71717A] text-xs">{sets.length} sets</Text>
                    </View>
                    <View className="flex-row gap-4">
                      <View>
                        <Text className="text-white font-bold">{formatWeight(maxWeight, weightUnit)}</Text>
                        <Text className="text-[#71717A] text-xs">Max weight</Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold">{formatWeight(best, weightUnit)}</Text>
                        <Text className="text-[#71717A] text-xs">Est. 1RM</Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold">{formatWeight(totalVol, weightUnit)}</Text>
                        <Text className="text-[#71717A] text-xs">Volume</Text>
                      </View>
                    </View>
                    {/* Sets breakdown */}
                    <View className="gap-1">
                      {sets.map((s) => (
                        <View key={s.set_id} className="flex-row gap-2">
                          <Text className="text-[#52525B] text-xs w-8">#{s.set_number}</Text>
                          <Text className="text-[#A1A1AA] text-xs">
                            {s.weight_kg ? formatWeight(s.weight_kg, weightUnit) : '—'} × {s.reps ?? '—'} reps
                            {s.rpe ? ` @ RPE ${s.rpe}` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === 'charts' && (
          <View className="px-4 gap-4">
            {/* Time range selector */}
            <View className="flex-row bg-[#18181B] rounded-2xl p-1">
              {(['week', 'month', '3months', 'all'] as TimeRange[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  className={`flex-1 py-2 rounded-xl items-center ${timeRange === r ? 'bg-primary' : ''}`}
                  onPress={() => setTimeRange(r)}
                >
                  <Text className={`text-xs font-semibold ${timeRange === r ? 'text-white' : 'text-[#71717A]'}`}>
                    {r === '3months' ? '3M' : r === 'all' ? 'All' : r === 'week' ? '1W' : '1M'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <OneRMChart history={history ?? []} timeRange={timeRange} weightUnit={weightUnit} />
            <MaxWeightChart history={history ?? []} timeRange={timeRange} weightUnit={weightUnit} />
            <VolumeChart history={history ?? []} timeRange={timeRange} weightUnit={weightUnit} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
