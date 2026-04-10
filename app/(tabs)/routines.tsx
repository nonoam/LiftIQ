import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useRoutines, useCreateRoutine, useDeleteRoutine, useDuplicateRoutine } from '@/hooks/useRoutines';
import { useWorkoutStore } from '@/stores/workoutStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { MUSCLE_META } from '@/constants/muscles';
import type { Routine } from '@/types/database';

function RoutineCard({ routine, onDelete, onDuplicate, onStartWorkout }: {
  routine: Routine;
  onDelete: () => void;
  onDuplicate: () => void;
  onStartWorkout: () => void;
}) {
  const exerciseCount = routine.routine_exercises?.length ?? 0;
  const muscles = new Set(
    routine.routine_exercises?.map((re) =>
      re.exercise?.primary_muscle_group?.slug
    ).filter(Boolean) ?? []
  );
  const muscleLabels = Array.from(muscles).slice(0, 3).map(s => MUSCLE_META[s!]?.label).filter(Boolean);

  return (
    <View className="bg-[#18181B] rounded-2xl p-4 mb-3">
      <TouchableOpacity onPress={() => router.push(`/routine/${routine.id}`)}>
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-white font-bold text-base flex-1 mr-2" numberOfLines={1}>{routine.name}</Text>
          <Text className="text-[#71717A] text-xs">{exerciseCount} exercises</Text>
        </View>
        {routine.description && (
          <Text className="text-[#A1A1AA] text-sm mb-2" numberOfLines={2}>{routine.description}</Text>
        )}
        {muscleLabels.length > 0 && (
          <Text className="text-[#71717A] text-xs mb-3">{muscleLabels.join(' · ')}</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-xl py-2.5 items-center"
          onPress={onStartWorkout}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-sm">▶ Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#27272A] rounded-xl px-3 py-2.5"
          onPress={() => router.push(`/routine/${routine.id}`)}
        >
          <Text className="text-white text-sm">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#27272A] rounded-xl px-3 py-2.5"
          onPress={onDuplicate}
        >
          <Text className="text-white text-sm">⧉</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#27272A] rounded-xl px-3 py-2.5"
          onPress={onDelete}
        >
          <Text className="text-[#EF4444] text-sm">🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RoutinesScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: routines, isLoading } = useRoutines();
  const createRoutine  = useCreateRoutine();
  const deleteRoutine  = useDeleteRoutine();
  const duplicateRoutine = useDuplicateRoutine();
  const { startWorkout } = useWorkoutStore();

  async function handleCreate() {
    if (!newName.trim()) return;
    await createRoutine.mutateAsync(newName.trim());
    setNewName('');
    setShowCreate(false);
  }

  async function handleStartWorkout(routine: Routine) {
    if (!routine.routine_exercises?.length) {
      Alert.alert('Empty routine', 'Add exercises to this routine before starting.');
      return;
    }
    await startWorkout({
      routineId: routine.id,
      name: routine.name,
      exercises: routine.routine_exercises ?? [],
      bodyWeightKg: null,
    });
    router.push(`/workout/${routine.id}`);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRoutine.mutate(id),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Routines</Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-2"
          onPress={() => setShowCreate(true)}
        >
          <Text className="text-white font-bold">+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Quick-start freeform workout */}
      <TouchableOpacity
        className="mx-4 mb-3 bg-[#27272A] border border-dashed border-[#52525B] rounded-2xl p-4 flex-row items-center gap-3"
        onPress={async () => {
          await startWorkout({ routineId: null, name: 'Quick Workout', exercises: [], bodyWeightKg: null });
          router.push('/workout/new');
        }}
      >
        <Text className="text-2xl">⚡</Text>
        <View>
          <Text className="text-white font-semibold">Quick Workout</Text>
          <Text className="text-[#71717A] text-xs">Start without a routine</Text>
        </View>
      </TouchableOpacity>

      {isLoading ? (
        <LoadingSpinner />
      ) : !routines?.length ? (
        <EmptyState
          icon="📅"
          title="No routines yet"
          description="Create your first routine to start planning your training program."
          actionLabel="Create Routine"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <FlashList
          data={routines}
          renderItem={({ item }) => (
            <View className="px-4">
              <RoutineCard
                routine={item}
                onDelete={() => handleDelete(item.id, item.name)}
                onDuplicate={() => duplicateRoutine.mutate(item.id)}
                onStartWorkout={() => handleStartWorkout(item)}
              />
            </View>
          )}
          
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Routine Modal */}
      <Modal visible={showCreate} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-[#18181B] rounded-2xl p-6 w-full gap-4">
            <Text className="text-white text-lg font-bold">New Routine</Text>
            <TextInput
              className="bg-[#27272A] rounded-xl px-4 py-3 text-white text-base"
              placeholder="Routine name (e.g. Push Day A)"
              placeholderTextColor="#52525B"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleCreate}
            />
            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => { setShowCreate(false); setNewName(''); }}
                className="flex-1"
              />
              <Button
                title="Create"
                onPress={handleCreate}
                loading={createRoutine.isPending}
                disabled={!newName.trim()}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
