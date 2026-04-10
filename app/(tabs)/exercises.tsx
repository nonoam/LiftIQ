import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useExercises, useMuscleGroups } from '@/hooks/useExercises';
import { ExerciseCard } from '@/components/exercises/ExerciseCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { EQUIPMENT_LABELS } from '@/constants/muscles';
import type { ExerciseFilters } from '@/types';
import type { Exercise } from '@/types/database';

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'resistance_band', 'ez_bar', 'trap_bar', 'pull_up_bar',
] as const;

export default function ExercisesScreen() {
  const [filters, setFilters] = useState<ExerciseFilters>({
    muscleGroupId: null,
    equipment: null,
    movementType: null,
    searchQuery: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: exercises, isLoading } = useExercises(filters);
  const { data: muscleGroups } = useMuscleGroups();

  const updateFilter = useCallback(<K extends keyof ExerciseFilters>(
    key: K, value: ExerciseFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const renderItem = useCallback(({ item }: { item: Exercise }) => (
    <View className="px-4">
      <ExerciseCard exercise={item} />
    </View>
  ), []);

  const activeFilterCount = [
    filters.muscleGroupId, filters.equipment, filters.movementType,
  ].filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Exercises</Text>
          <TouchableOpacity
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl ${showFilters ? 'bg-primary' : 'bg-[#27272A]'}`}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text className="text-white text-sm">Filter</Text>
            {activeFilterCount > 0 && (
              <View className="w-4 h-4 rounded-full bg-[#EF4444] items-center justify-center">
                <Text className="text-white text-[10px] font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          className="bg-[#18181B] rounded-xl px-4 py-3 text-white text-sm"
          placeholder="Search exercises..."
          placeholderTextColor="#52525B"
          value={filters.searchQuery}
          onChangeText={(q) => updateFilter('searchQuery', q)}
          returnKeyType="search"
        />
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View className="px-4 pb-3 gap-3 bg-[#18181B] mx-4 rounded-2xl mb-2 p-4">
          {/* Movement Type */}
          <View className="gap-2">
            <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">Movement</Text>
            <View className="flex-row gap-2">
              {(['compound', 'isolation'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-4 py-2 rounded-xl ${filters.movementType === type ? 'bg-primary' : 'bg-[#27272A]'}`}
                  onPress={() => updateFilter('movementType', filters.movementType === type ? null : type)}
                >
                  <Text className="text-white text-sm capitalize">{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Muscle Group */}
          <View className="gap-2">
            <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">Muscle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {muscleGroups?.map((mg) => (
                  <TouchableOpacity
                    key={mg.id}
                    className={`px-3 py-2 rounded-xl ${filters.muscleGroupId === mg.id ? 'bg-primary' : 'bg-[#27272A]'}`}
                    onPress={() => updateFilter('muscleGroupId', filters.muscleGroupId === mg.id ? null : mg.id)}
                  >
                    <Text className="text-white text-xs">{mg.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Equipment */}
          <View className="gap-2">
            <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">Equipment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    className={`px-3 py-2 rounded-xl ${filters.equipment === eq ? 'bg-primary' : 'bg-[#27272A]'}`}
                    onPress={() => updateFilter('equipment', filters.equipment === eq ? null : eq)}
                  >
                    <Text className="text-white text-xs">{EQUIPMENT_LABELS[eq]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={() => setFilters({ muscleGroupId: null, equipment: null, movementType: null, searchQuery: '' })}
              className="self-start"
            >
              <Text className="text-[#EF4444] text-sm">Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Count */}
      {exercises && (
        <View className="px-4 pb-2">
          <Text className="text-[#71717A] text-xs">{exercises.length} exercises</Text>
        </View>
      )}

      {/* Exercise List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !exercises?.length ? (
        <EmptyState
          icon="🔍"
          title="No exercises found"
          description="Try adjusting your filters or search query."
          actionLabel="Clear Filters"
          onAction={() => setFilters({ muscleGroupId: null, equipment: null, movementType: null, searchQuery: '' })}
        />
      ) : (
        <FlashList
          data={exercises}
          renderItem={renderItem}
          
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
