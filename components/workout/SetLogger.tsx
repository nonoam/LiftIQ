import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { estimated1RM, formatWeight, rpeLabel } from '@/lib/utils';
import type { ActiveExercise, ActiveSet, PreviousSetRef } from '@/types';

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

interface SetLoggerProps {
  exercise: ActiveExercise;
  exerciseIndex: number;
}

export function SetLogger({ exercise, exerciseIndex }: SetLoggerProps) {
  const { logSet, updateSet, deleteSet, addSet, startRestTimer } = useWorkoutStore();
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const haptic = useSettingsStore((s) => s.hapticFeedback);

  const [inputWeight, setInputWeight] = useState<string>(
    exercise.targetWeightKg?.toString() ?? ''
  );
  const [inputReps, setInputReps] = useState<string>(
    exercise.targetRepsMax?.toString() ?? ''
  );
  const [inputRpe, setInputRpe] = useState<number | null>(null);
  const [isWarmup, setIsWarmup] = useState(false);
  const [showRpePicker, setShowRpePicker] = useState(false);

  function handleLogSet() {
    const weight = parseFloat(inputWeight) || null;
    const reps = parseInt(inputReps) || null;
    const nextSetNumber = exercise.sets.length + 1;

    logSet(exerciseIndex, {
      exerciseId: exercise.exerciseId,
      setNumber: nextSetNumber,
      weightKg: weight,
      reps,
      rpe: inputRpe,
      isWarmup,
      isDropset: false,
      isFailure: false,
      notes: '',
    });

    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start rest timer (skip for warmup sets)
    if (!isWarmup) {
      startRestTimer(exercise.restSeconds, exercise.exerciseId);
    }

    // Update input for next set (keep weight, clear RPE)
    setInputRpe(null);
  }

  function getLastSetRef(setNum: number): PreviousSetRef | undefined {
    return exercise.lastSessionSets.find((s) => s.setNumber === setNum);
  }

  const completedSets = exercise.sets.filter((s) => s.completedAt !== null);

  return (
    <View className="gap-4">
      {/* Previous session reference */}
      {exercise.lastSessionSets.length > 0 && (
        <View className="bg-[#27272A] rounded-xl p-3">
          <Text className="text-[#71717A] text-xs font-semibold mb-2 uppercase tracking-wider">Last session</Text>
          <View className="flex-row flex-wrap gap-2">
            {exercise.lastSessionSets.map((ref) => (
              <View key={ref.setNumber} className="bg-[#3F3F46] rounded-lg px-2 py-1">
                <Text className="text-[#A1A1AA] text-xs">
                  #{ref.setNumber}: {ref.weightKg ? formatWeight(ref.weightKg, weightUnit) : '—'} × {ref.reps ?? '—'}
                  {ref.rpe ? ` @${ref.rpe}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Completed sets */}
      {completedSets.length > 0 && (
        <View className="gap-2">
          <Text className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">Completed</Text>
          {completedSets.map((set, idx) => {
            const rm = set.weightKg && set.reps ? estimated1RM(set.weightKg, set.reps) : null;
            const lastRef = getLastSetRef(set.setNumber);
            const improved = rm && lastRef?.weightKg && lastRef.reps
              ? rm > estimated1RM(lastRef.weightKg, lastRef.reps)
              : false;

            return (
              <View key={set.id} className="flex-row items-center gap-3 bg-[#18181B] rounded-xl p-3">
                <View className={`w-7 h-7 rounded-full items-center justify-center ${set.isWarmup ? 'bg-[#F59E0B]/20' : 'bg-[#22C55E]/20'}`}>
                  <Text className={`text-xs font-bold ${set.isWarmup ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
                    {set.isWarmup ? 'W' : set.setNumber}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-white text-sm">
                    {set.weightKg ? formatWeight(set.weightKg, weightUnit) : '—'} × {set.reps ?? '—'} reps
                    {set.rpe ? ` · RPE ${set.rpe}` : ''}
                  </Text>
                  {rm && (
                    <Text className={`text-xs ${improved ? 'text-[#22C55E]' : 'text-[#71717A]'}`}>
                      {improved ? '↑ ' : ''}1RM ~{formatWeight(rm, weightUnit)}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => deleteSet(exerciseIndex, idx)}
                  className="p-1"
                >
                  <Text className="text-[#52525B] text-xs">✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* New set input */}
      <View className="bg-[#18181B] rounded-2xl p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-semibold">
            Set {completedSets.length + 1}
            {exercise.targetSets > 0 ? ` / ${exercise.targetSets}` : ''}
          </Text>
          <TouchableOpacity
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${isWarmup ? 'bg-[#F59E0B]/20' : 'bg-[#3F3F46]'}`}
            onPress={() => setIsWarmup(!isWarmup)}
          >
            <Text className={`text-xs font-semibold ${isWarmup ? 'text-[#F59E0B]' : 'text-[#A1A1AA]'}`}>
              {isWarmup ? '🔥 Warmup' : 'Warmup'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-[#71717A] text-xs">Weight ({weightUnit})</Text>
            <TextInput
              className="bg-[#27272A] rounded-xl px-3 py-3 text-white text-base text-center font-bold"
              value={inputWeight}
              onChangeText={setInputWeight}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#52525B"
            />
          </View>
          <View className="items-center justify-end pb-3">
            <Text className="text-[#52525B]">×</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-[#71717A] text-xs">Reps</Text>
            <TextInput
              className="bg-[#27272A] rounded-xl px-3 py-3 text-white text-base text-center font-bold"
              value={inputReps}
              onChangeText={setInputReps}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#52525B"
            />
          </View>
        </View>

        {/* RPE Picker */}
        <TouchableOpacity
          className="bg-[#27272A] rounded-xl px-4 py-2.5 flex-row items-center justify-between"
          onPress={() => setShowRpePicker(!showRpePicker)}
        >
          <Text className="text-[#A1A1AA] text-sm">
            {inputRpe ? `RPE ${inputRpe} — ${rpeLabel(inputRpe)}` : 'Add RPE (optional)'}
          </Text>
          <Text className="text-[#52525B] text-xs">{showRpePicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showRpePicker && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {RPE_VALUES.map((val) => (
                <TouchableOpacity
                  key={val}
                  className={`px-3 py-2 rounded-xl ${inputRpe === val ? 'bg-primary' : 'bg-[#27272A]'}`}
                  onPress={() => { setInputRpe(val === inputRpe ? null : val); setShowRpePicker(false); }}
                >
                  <Text className="text-white text-sm font-bold">{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        <TouchableOpacity
          className="bg-primary rounded-2xl py-3.5 items-center"
          onPress={handleLogSet}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">✓ Log Set</Text>
        </TouchableOpacity>
      </View>

      {/* Add set manually */}
      <TouchableOpacity
        className="items-center py-2"
        onPress={() => addSet(exerciseIndex)}
      >
        <Text className="text-primary text-sm">+ Add set slot</Text>
      </TouchableOpacity>
    </View>
  );
}
