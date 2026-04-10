import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useWorkoutSessions } from '@/hooks/useWorkoutSession';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatSessionDate, formatDuration, formatWeight } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import type { WorkoutSession } from '@/types/database';

function SessionCard({ session }: { session: WorkoutSession }) {
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const totalVolume = session.workout_sets?.reduce(
    (acc, s) => acc + ((s.weight_kg ?? 0) * (s.reps ?? 0)), 0
  ) ?? 0;
  const workingSets = session.workout_sets?.filter((s) => !s.is_warmup).length ?? 0;

  // Unique exercises
  const exercises = new Set(session.workout_sets?.map((s) => s.exercise_id)).size;

  return (
    <TouchableOpacity
      className="bg-[#18181B] rounded-2xl p-4 mb-3"
      activeOpacity={0.85}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-bold text-base" numberOfLines={1}>{session.name}</Text>
          <Text className="text-[#71717A] text-xs mt-0.5">{formatSessionDate(session.started_at)}</Text>
        </View>
        {session.duration_seconds && (
          <Text className="text-[#A1A1AA] text-xs">{formatDuration(session.duration_seconds)}</Text>
        )}
      </View>

      <View className="flex-row gap-4">
        <View>
          <Text className="text-white font-semibold text-sm">{exercises}</Text>
          <Text className="text-[#71717A] text-xs">Exercises</Text>
        </View>
        <View>
          <Text className="text-white font-semibold text-sm">{workingSets}</Text>
          <Text className="text-[#71717A] text-xs">Sets</Text>
        </View>
        <View>
          <Text className="text-white font-semibold text-sm">{formatWeight(totalVolume, weightUnit)}</Text>
          <Text className="text-[#71717A] text-xs">Volume</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { data: sessions, isLoading } = useWorkoutSessions();

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">History</Text>
        {sessions?.length ? (
          <Text className="text-[#71717A] text-sm mt-1">{sessions.length} workouts logged</Text>
        ) : null}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !sessions?.length ? (
        <EmptyState
          icon="📊"
          title="No workouts yet"
          description="Complete your first workout to start seeing your history here."
          actionLabel="Start Workout"
          onAction={() => router.push('/(tabs)/routines')}
        />
      ) : (
        <FlashList
          data={sessions}
          renderItem={({ item }) => (
            <View className="px-4">
              <SessionCard session={item} />
            </View>
          )}
          
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
