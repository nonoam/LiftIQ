import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import {
  useRoutine, useUpdateRoutine, useAddExerciseToRoutine,
  useUpdateRoutineExercise, useRemoveExerciseFromRoutine, useReorderRoutineExercises,
} from '@/hooks/useRoutines';
import { useExercises, useMuscleGroups } from '@/hooks/useExercises';
import { ExerciseCard } from '@/components/exercises/ExerciseCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FlashList } from '@shopify/flash-list';
import type { RoutineExercise, Exercise } from '@/types/database';
import type { ExerciseFilters } from '@/types';

export default function RoutineDetailScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const { data: routine, isLoading } = useRoutine(routineId);
  const updateRoutine = useUpdateRoutine();
  const addExercise = useAddExerciseToRoutine();
  const updateExercise = useUpdateRoutineExercise();
  const removeExercise = useRemoveExerciseFromRoutine();
  const reorderExercises = useReorderRoutineExercises();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [exerciseFilters] = useState<ExerciseFilters>({
    muscleGroupId: null, equipment: null, movementType: null, searchQuery: '',
  });

  const { data: allExercises } = useExercises(exerciseFilters);

  const orderedExercises = routine?.routine_exercises?.slice().sort((a, b) => a.position - b.position) ?? [];

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    await updateRoutine.mutateAsync({ id: routineId, name: nameInput.trim() });
    setEditingName(false);
  }

  async function handleAddExercise(exercise: Exercise) {
    await addExercise.mutateAsync({
      routineId,
      exerciseId: exercise.id,
      position: orderedExercises.length,
    });
    setShowPicker(false);
  }

  async function handleDragEnd({ data }: { data: RoutineExercise[] }) {
    const reordered = data.map((item, index) => ({ id: item.id, position: index }));
    await reorderExercises.mutateAsync({ routineId, exercises: reordered });
  }

  function handleDeleteExercise(re: RoutineExercise) {
    Alert.alert(
      'Remove Exercise',
      `Remove ${re.exercise?.name ?? 'this exercise'} from routine?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeExercise.mutate({ id: re.id, routineId }),
        },
      ]
    );
  }

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<RoutineExercise>) => (
    <ScaleDecorator>
      <View className={`bg-[#18181B] rounded-2xl p-4 mb-3 ${isActive ? 'opacity-70' : ''}`}>
        <View className="flex-row items-center gap-3">
          {/* Drag handle */}
          <TouchableOpacity onLongPress={drag} className="p-2">
            <Text className="text-[#52525B] text-lg">☰</Text>
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">{item.exercise?.name ?? '—'}</Text>
            <Text className="text-[#71717A] text-xs mt-0.5">
              {item.target_sets} sets
              {item.target_reps_min ? ` × ${item.target_reps_min}–${item.target_reps_max} reps` : ''}
              {item.target_weight_kg ? ` @ ${item.target_weight_kg}kg` : ''}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleDeleteExercise(item)}
            className="p-2"
          >
            <Text className="text-[#EF4444]">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Set targets */}
        <View className="flex-row gap-3 mt-3 pl-10">
          <View className="flex-1">
            <Text className="text-[#71717A] text-xs mb-1">Sets</Text>
            <TextInput
              className="bg-[#27272A] rounded-lg px-2 py-1.5 text-white text-sm text-center"
              value={String(item.target_sets)}
              keyboardType="numeric"
              onEndEditing={(e) =>
                updateExercise.mutate({ id: item.id, routineId, target_sets: parseInt(e.nativeEvent.text) || 3 })
              }
            />
          </View>
          <View className="flex-1">
            <Text className="text-[#71717A] text-xs mb-1">Reps min</Text>
            <TextInput
              className="bg-[#27272A] rounded-lg px-2 py-1.5 text-white text-sm text-center"
              value={item.target_reps_min ? String(item.target_reps_min) : ''}
              placeholder="—"
              placeholderTextColor="#52525B"
              keyboardType="numeric"
              onEndEditing={(e) =>
                updateExercise.mutate({ id: item.id, routineId, target_reps_min: parseInt(e.nativeEvent.text) || null })
              }
            />
          </View>
          <View className="flex-1">
            <Text className="text-[#71717A] text-xs mb-1">Reps max</Text>
            <TextInput
              className="bg-[#27272A] rounded-lg px-2 py-1.5 text-white text-sm text-center"
              value={item.target_reps_max ? String(item.target_reps_max) : ''}
              placeholder="—"
              placeholderTextColor="#52525B"
              keyboardType="numeric"
              onEndEditing={(e) =>
                updateExercise.mutate({ id: item.id, routineId, target_reps_max: parseInt(e.nativeEvent.text) || null })
              }
            />
          </View>
          <View className="flex-1">
            <Text className="text-[#71717A] text-xs mb-1">Rest (s)</Text>
            <TextInput
              className="bg-[#27272A] rounded-lg px-2 py-1.5 text-white text-sm text-center"
              value={String(item.rest_seconds)}
              keyboardType="numeric"
              onEndEditing={(e) =>
                updateExercise.mutate({ id: item.id, routineId, rest_seconds: parseInt(e.nativeEvent.text) || 90 })
              }
            />
          </View>
        </View>
      </View>
    </ScaleDecorator>
  ), [routineId]);

  if (isLoading || !routine) return <LoadingSpinner />;

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <ScreenHeader
        title={routine.name}
        showBack
        rightAction={{ label: '+ Exercise', onPress: () => setShowPicker(true) }}
      />

      {/* Routine name edit */}
      {editingName ? (
        <View className="flex-row gap-2 px-4 mb-3">
          <TextInput
            className="flex-1 bg-[#27272A] rounded-xl px-4 py-2 text-white"
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            onSubmitEditing={handleSaveName}
          />
          <TouchableOpacity className="bg-primary rounded-xl px-4 py-2" onPress={handleSaveName}>
            <Text className="text-white font-bold">Save</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity className="px-4 mb-3" onPress={() => { setNameInput(routine.name); setEditingName(true); }}>
          <Text className="text-[#A1A1AA] text-sm">Tap to rename</Text>
        </TouchableOpacity>
      )}

      {/* Draggable Exercise List */}
      {orderedExercises.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-4xl">📋</Text>
          <Text className="text-white font-bold text-lg">No exercises yet</Text>
          <Text className="text-[#A1A1AA] text-sm">Add exercises to build your routine</Text>
          <TouchableOpacity
            className="bg-primary rounded-2xl px-6 py-3"
            onPress={() => setShowPicker(true)}
          >
            <Text className="text-white font-bold">Add Exercise</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <DraggableFlatList
          data={orderedExercises}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        />
      )}

      {/* Exercise Picker Modal */}
      <Modal visible={showPicker} animationType="slide">
        <SafeAreaView className="flex-1 bg-[#09090B]">
          <View className="flex-row items-center justify-between px-4 py-4">
            <Text className="text-white text-xl font-bold">Add Exercise</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text className="text-[#A1A1AA] text-base">✕ Close</Text>
            </TouchableOpacity>
          </View>
          <FlashList
            data={allExercises ?? []}
            renderItem={({ item }) => (
              <View className="px-4 mb-2">
                <ExerciseCard
                  exercise={item}
                  onSelect={handleAddExercise}
                  compact
                />
              </View>
            )}
            
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
