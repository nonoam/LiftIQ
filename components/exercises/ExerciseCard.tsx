import { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { EQUIPMENT_LABELS, MUSCLE_META } from '@/constants/muscles';
import type { Exercise } from '@/types/database';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  compact?: boolean;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise, onSelect, compact = false,
}: ExerciseCardProps) {
  const primaryGif = exercise.media?.find((m) => m.is_primary && m.media_type === 'gif');
  const primaryImage = exercise.media?.find((m) => m.is_primary);
  const muscleSlug = exercise.primary_muscle_group?.slug;
  const muscleMeta = muscleSlug ? MUSCLE_META[muscleSlug] : null;

  function handlePress() {
    if (onSelect) {
      onSelect(exercise);
    } else {
      router.push(`/exercise/${exercise.id}`);
    }
  }

  if (compact) {
    return (
      <TouchableOpacity
        className="flex-row items-center gap-3 bg-[#18181B] rounded-2xl p-3"
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Thumbnail */}
        <View className="w-12 h-12 rounded-xl bg-[#27272A] items-center justify-center overflow-hidden">
          {primaryImage ? (
            <Image source={{ uri: primaryImage.url }} className="w-12 h-12" resizeMode="cover" />
          ) : (
            <Text className="text-xl">🏋️</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>{exercise.name}</Text>
          <Text className="text-[#71717A] text-xs mt-0.5">{muscleMeta?.label ?? 'Muscle'}</Text>
        </View>

        <Badge
          label={exercise.movement_type === 'compound' ? 'C' : 'I'}
          color={exercise.movement_type === 'compound' ? 'primary' : 'neutral'}
          size="sm"
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="bg-[#18181B] rounded-2xl overflow-hidden mb-3"
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View className="flex-row">
        {/* GIF / Image */}
        <View className="w-20 h-20 bg-[#27272A] items-center justify-center">
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage.url }}
              className="w-20 h-20"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-3xl">🏋️</Text>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 px-4 py-3 gap-1.5">
          <Text className="text-white font-bold text-sm" numberOfLines={2}>{exercise.name}</Text>

          <View className="flex-row gap-2 flex-wrap">
            {muscleMeta && (
              <Badge
                label={muscleMeta.label}
                color="primary"
                size="sm"
              />
            )}
            <Badge
              label={exercise.movement_type}
              color={exercise.movement_type === 'compound' ? 'success' : 'neutral'}
              size="sm"
            />
          </View>

          <Text className="text-[#71717A] text-xs">
            {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});
