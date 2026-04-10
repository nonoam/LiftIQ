import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { useWorkoutSessions } from '@/hooks/useWorkoutSession';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { MUSCLE_META, setsToFrequencyLevel, FREQUENCY_COLORS } from '@/constants/muscles';
import { formatSessionDate, formatDuration, formatWeight } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import type { WeeklyVolumeByMuscleRow } from '@/types/database';
import { CartesianChart, Bar } from 'victory-native';

function WeeklyVolumeChart({ data }: { data: WeeklyVolumeByMuscleRow[] }) {
  if (!data.length) return null;

  const chartData = data.map((row, i) => ({
    x: i,
    y: Math.round(row.total_volume_kg),
    label: MUSCLE_META[row.muscle_group_slug]?.label?.slice(0, 6) ?? row.muscle_group_slug,
  }));

  return (
    <View style={{ height: 140 }}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={["y"]}
        domain={{ y: [0, Math.max(...chartData.map((d) => d.y)) * 1.2] }}
        axisOptions={{
          font: undefined,
          labelColor: '#71717A',
          lineColor: '#27272A',
          tickCount: { x: Math.min(data.length, 8), y: 3 },
          formatXLabel: (v) => chartData[Math.round(v)]?.label ?? '',
          formatYLabel: (v) => `${Math.round(v / 1000)}k`,
        }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.y}
            chartBounds={chartBounds}
            color="#6366F1"
            roundedCorners={{ topLeft: 4, topRight: 4 }}
            animate={{ type: 'spring' }}
          />
        )}
      </CartesianChart>
    </View>
  );
}

export default function DashboardScreen() {
  const { profile } = useAuthStore();
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const { data: sessions, isLoading: sessionsLoading } = useWorkoutSessions();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

  const { data: weeklyVolume, isLoading: volumeLoading } = useQuery({
    queryKey: queryKeys.weeklyVolume(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_volume_by_muscle')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start', weekStart)
        .order('total_volume_kg', { ascending: false });
      if (error) throw error;
      return data as WeeklyVolumeByMuscleRow[];
    },
    enabled: !!userId,
  });

  const weekSessions = sessions?.filter(
    (s) => s.started_at >= weekStart
  ) ?? [];

  const totalWeekVolume = weeklyVolume?.reduce((acc, r) => acc + r.total_volume_kg, 0) ?? 0;
  const totalWeekSets = weeklyVolume?.reduce((acc, r) => acc + r.total_sets, 0) ?? 0;
  const recentSessions = sessions?.slice(0, 5) ?? [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-[#A1A1AA] text-base">{greeting()},</Text>
          <Text className="text-white text-2xl font-bold">{profile?.display_name ?? 'Athlete'} 👋</Text>
        </View>

        {/* Quick-start workout */}
        <TouchableOpacity
          className="mx-4 mt-2 bg-primary rounded-2xl p-4 flex-row items-center justify-between"
          onPress={() => router.push('/(tabs)/routines')}
          activeOpacity={0.85}
        >
          <View>
            <Text className="text-white font-bold text-base">Start a Workout</Text>
            <Text className="text-white/70 text-sm mt-0.5">Pick a routine or go free-form</Text>
          </View>
          <Text className="text-3xl">▶</Text>
        </TouchableOpacity>

        {/* This week stats */}
        <View className="mx-4 mt-4">
          <Text className="text-white font-bold text-base mb-3">This Week</Text>
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center py-3">
              <Text className="text-white font-bold text-2xl">{weekSessions.length}</Text>
              <Text className="text-[#71717A] text-xs mt-0.5">Workouts</Text>
            </Card>
            <Card className="flex-1 items-center py-3">
              <Text className="text-white font-bold text-2xl">{totalWeekSets}</Text>
              <Text className="text-[#71717A] text-xs mt-0.5">Sets</Text>
            </Card>
            <Card className="flex-1 items-center py-3">
              <Text className="text-white font-bold text-xl">{formatWeight(totalWeekVolume, weightUnit)}</Text>
              <Text className="text-[#71717A] text-xs mt-0.5">Volume</Text>
            </Card>
          </View>
        </View>

        {/* Weekly volume by muscle */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold text-base">Volume by Muscle</Text>
            <TouchableOpacity onPress={() => router.push('/muscle-map')}>
              <Text className="text-primary text-sm">Muscle Map →</Text>
            </TouchableOpacity>
          </View>

          <Card>
            {volumeLoading ? (
              <LoadingSpinner size="small" fullScreen={false} />
            ) : !weeklyVolume?.length ? (
              <View className="items-center py-4">
                <Text className="text-[#71717A] text-sm">No training data this week</Text>
              </View>
            ) : (
              <>
                <WeeklyVolumeChart data={weeklyVolume} />

                {/* Muscle frequency dots */}
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {weeklyVolume.slice(0, 8).map((row) => {
                    const level = setsToFrequencyLevel(row.total_sets);
                    const meta = MUSCLE_META[row.muscle_group_slug];
                    return (
                      <View key={row.muscle_group_id} className="flex-row items-center gap-1.5 bg-[#27272A] rounded-lg px-2 py-1">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: FREQUENCY_COLORS[level] }}
                        />
                        <Text className="text-[#A1A1AA] text-xs">{meta?.label ?? row.muscle_group_name}</Text>
                        <Text className="text-[#52525B] text-xs">{row.total_sets}s</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Recent sessions */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold text-base">Recent Workouts</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text className="text-primary text-sm">See all →</Text>
            </TouchableOpacity>
          </View>

          {sessionsLoading ? (
            <LoadingSpinner size="small" fullScreen={false} />
          ) : !recentSessions.length ? (
            <Card>
              <View className="items-center py-4">
                <Text className="text-[#71717A] text-sm">No workouts yet — start your first!</Text>
              </View>
            </Card>
          ) : (
            <View className="gap-2">
              {recentSessions.map((session) => {
                const totalVol = session.workout_sets?.reduce(
                  (acc, s) => acc + ((s.weight_kg ?? 0) * (s.reps ?? 0)), 0
                ) ?? 0;
                return (
                  <Card key={session.id} padding="md">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                          {session.name}
                        </Text>
                        <Text className="text-[#71717A] text-xs mt-0.5">
                          {formatSessionDate(session.started_at)}
                          {session.duration_seconds ? ` · ${formatDuration(session.duration_seconds)}` : ''}
                        </Text>
                      </View>
                      <Text className="text-[#A1A1AA] text-xs">
                        {formatWeight(totalVol, weightUnit)}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        {/* Training streak placeholder */}
        <View className="mx-4 mt-5">
          <Text className="text-white font-bold text-base mb-3">Training Frequency</Text>
          <Card>
            <View className="flex-row gap-1 flex-wrap">
              {Array.from({ length: 28 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const hasSession = sessions?.some(
                  (s) => format(new Date(s.started_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                );
                return (
                  <View
                    key={i}
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: hasSession ? '#6366F1' : '#27272A' }}
                  />
                );
              })}
            </View>
            <Text className="text-[#71717A] text-xs mt-2">Last 28 days</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
