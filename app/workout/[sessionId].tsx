import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSyncWorkout } from '@/hooks/useWorkoutSession';
import { SetLogger } from '@/components/workout/SetLogger';
import { RestTimer } from '@/components/workout/RestTimer';
import { formatDuration } from '@/lib/utils';

export default function ActiveWorkoutScreen() {
  const {
    workout, setCurrentExercise, setNotes, finishWorkout, discardWorkout,
  } = useWorkoutStore();
  const syncWorkout = useSyncWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!workout) {
    router.replace('/(tabs)/routines');
    return null;
  }

  const currentIndex = workout.currentExerciseIndex;
  const currentExercise = workout.exercises[currentIndex];
  const totalExercises = workout.exercises.length;

  async function handleFinish() {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            const completed = finishWorkout();
            if (completed) {
              await syncWorkout.mutateAsync(completed);
              router.replace('/workout/complete');
            }
          },
        },
      ]
    );
  }

  function handleDiscard() {
    Alert.alert(
      'Discard Workout',
      'All progress will be lost. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await discardWorkout();
            router.back();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#18181B]">
        <View>
          <Text className="text-white font-bold text-lg" numberOfLines={1}>{workout.name}</Text>
          <Text className="text-[#71717A] text-xs">⏱ {formatDuration(elapsed)}</Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="bg-[#27272A] rounded-xl px-3 py-2"
            onPress={() => setShowNotes(true)}
          >
            <Text className="text-white text-sm">📝</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#EF4444]/20 rounded-xl px-3 py-2"
            onPress={handleDiscard}
          >
            <Text className="text-[#EF4444] text-sm">✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#22C55E] rounded-xl px-4 py-2"
            onPress={handleFinish}
          >
            <Text className="text-white font-bold text-sm">Finish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest Timer */}
      <View className="mt-3">
        <RestTimer />
      </View>

      {/* Exercise Navigator */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {workout.exercises.map((ex, idx) => {
          const completedSets = ex.sets.filter((s) => s.completedAt !== null).length;
          const isCurrent = idx === currentIndex;
          return (
            <TouchableOpacity
              key={ex.exerciseId + idx}
              className={`px-3 py-2 rounded-xl border ${isCurrent ? 'bg-primary border-primary' : 'bg-[#18181B] border-[#27272A]'}`}
              onPress={() => setCurrentExercise(idx)}
            >
              <Text className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-[#A1A1AA]'}`} numberOfLines={1}>
                {ex.exerciseName}
              </Text>
              <Text className={`text-xs text-center mt-0.5 ${isCurrent ? 'text-white/70' : 'text-[#52525B]'}`}>
                {completedSets}/{ex.targetSets}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Content */}
      <ScrollView
        className="flex-1 mt-4"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {currentExercise ? (
          <View className="gap-4">
            {/* Exercise header */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white font-bold text-xl">{currentExercise.exerciseName}</Text>
                {currentExercise.targetRepsMin && (
                  <Text className="text-[#A1A1AA] text-sm mt-0.5">
                    Target: {currentExercise.targetSets} × {currentExercise.targetRepsMin}–{currentExercise.targetRepsMax} reps
                    {currentExercise.targetWeightKg ? ` @ ${currentExercise.targetWeightKg}kg` : ''}
                  </Text>
                )}
              </View>

              {/* Prev/Next */}
              <View className="flex-row gap-2">
                {currentIndex > 0 && (
                  <TouchableOpacity
                    className="bg-[#27272A] rounded-xl px-3 py-2"
                    onPress={() => setCurrentExercise(currentIndex - 1)}
                  >
                    <Text className="text-white">←</Text>
                  </TouchableOpacity>
                )}
                {currentIndex < totalExercises - 1 && (
                  <TouchableOpacity
                    className="bg-primary rounded-xl px-3 py-2"
                    onPress={() => setCurrentExercise(currentIndex + 1)}
                  >
                    <Text className="text-white">→</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Set Logger */}
            <SetLogger exercise={currentExercise} exerciseIndex={currentIndex} />
          </View>
        ) : (
          /* Empty workout — add exercises */
          <View className="items-center py-8 gap-4">
            <Text className="text-4xl">⚡</Text>
            <Text className="text-white font-bold text-lg">Free workout</Text>
            <Text className="text-[#A1A1AA] text-sm text-center">
              Add exercises to track your sets
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Session notes modal */}
      <Modal visible={showNotes} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <SafeAreaView className="bg-[#18181B] rounded-t-3xl p-6 gap-4">
            <Text className="text-white font-bold text-lg">Session Notes</Text>
            <TextInput
              className="bg-[#27272A] rounded-xl px-4 py-3 text-white text-sm min-h-[80px]"
              value={workout.notes}
              onChangeText={setNotes}
              placeholder="How's this workout going?"
              placeholderTextColor="#52525B"
              multiline
              autoFocus
            />
            <TouchableOpacity
              className="bg-primary rounded-2xl py-3 items-center"
              onPress={() => setShowNotes(false)}
            >
              <Text className="text-white font-bold">Done</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
