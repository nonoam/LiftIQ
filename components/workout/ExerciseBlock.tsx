import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SetRow } from '@/components/workout/SetRow';
import { formatSet } from '@/lib/format';
import { displayToKg, formatWeightValue, kgToDisplay, parseIntInput, parseWeightInput } from '@/lib/units';
import { draftKey, useActiveWorkoutStore } from '@/stores/activeWorkout';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { ActiveSessionExercise } from '@/hooks/useWorkoutSession';
import type { LastPerformance, MuscleGroup, WeightUnit } from '@/types/models';
import { MUSCLE_GROUP_LABEL } from '@/types/models';

type Props = {
  sessionExercise: ActiveSessionExercise;
  lastPerformance: LastPerformance | undefined;
  unit: WeightUnit;
  savingSetNumber: number | null;
  onLogSet: (input: {
    id?: string;
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    rir: number | null;
  }) => void;
  onDeleteSet: (setId: string) => void;
  onRemoveExercise: () => void;
};

export function ExerciseBlock({
  sessionExercise,
  lastPerformance,
  unit,
  savingSetNumber,
  onLogSet,
  onDeleteSet,
  onRemoveExercise,
}: Props) {
  const drafts = useActiveWorkoutStore((s) => s.drafts);
  const setDraft = useActiveWorkoutStore((s) => s.setDraft);
  const clearDraft = useActiveWorkoutStore((s) => s.clearDraft);

  const committed = sessionExercise.workout_sets;
  // Exactly one open row at a time: ticking it opens the next. There is no
  // "add set" button because a workout is never done deciding how many sets
  // it has until it is over.
  const pendingSetNumber = committed.length + 1;
  const pendingKey = draftKey(sessionExercise.id, pendingSetNumber);
  const pendingDraft = drafts[pendingKey];

  const reference = referenceFor(lastPerformance, committed, pendingSetNumber);

  // Prefill the open row from the reference so the common case — repeating
  // last week's numbers — is a single tap on the tick.
  useEffect(() => {
    if (pendingDraft !== undefined) return;
    setDraft(pendingKey, {
      weight: reference.weightKg != null ? formatWeightValue(kgToDisplay(reference.weightKg, unit)) : '',
      reps: reference.reps != null ? String(reference.reps) : '',
      rir: reference.rir,
    });
  }, [pendingKey, pendingDraft, reference.weightKg, reference.reps, reference.rir, unit, setDraft]);

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {sessionExercise.exercise.name}
          </Text>
          <Text style={styles.meta}>
            {MUSCLE_GROUP_LABEL[sessionExercise.exercise.muscle_group as MuscleGroup]}
            {lastPerformance
              ? ` · La última vez: ${formatSet(
                  lastPerformance.sets[0]?.weight_kg ?? null,
                  lastPerformance.sets[0]?.reps ?? null,
                  lastPerformance.sets[0]?.rir ?? null,
                  unit,
                )}`
              : ' · Primera vez'}
          </Text>
        </View>
        <Pressable
          onPress={onRemoveExercise}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${sessionExercise.exercise.name} del entreno`}
          style={styles.remove}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textFaint} />
        </Pressable>
      </View>

      {committed.map((set) => (
        <SetRow
          key={set.id}
          setNumber={set.set_number}
          weight={set.weight_kg != null ? formatWeightValue(kgToDisplay(Number(set.weight_kg), unit)) : ''}
          reps={set.reps != null ? String(set.reps) : ''}
          rir={set.rir}
          weightPlaceholder={null}
          repsPlaceholder={null}
          unit={unit}
          completed
          onChangeWeight={() => {}}
          onChangeReps={() => {}}
          onChangeRir={() => {}}
          onComplete={() => {}}
          onReopen={() => {
            // Re-opening pulls the stored values back into the draft so the
            // row can be corrected, then re-saved under the same id.
            setDraft(draftKey(sessionExercise.id, set.set_number), {
              weight: set.weight_kg != null ? formatWeightValue(kgToDisplay(Number(set.weight_kg), unit)) : '',
              reps: set.reps != null ? String(set.reps) : '',
              rir: set.rir,
            });
            onDeleteSet(set.id);
          }}
          onDelete={() => onDeleteSet(set.id)}
        />
      ))}

      <SetRow
        setNumber={pendingSetNumber}
        weight={pendingDraft?.weight ?? ''}
        reps={pendingDraft?.reps ?? ''}
        rir={pendingDraft?.rir ?? null}
        weightPlaceholder={reference.weightKg != null ? kgToDisplay(reference.weightKg, unit) : null}
        repsPlaceholder={reference.reps}
        unit={unit}
        completed={false}
        saving={savingSetNumber === pendingSetNumber}
        onChangeWeight={(value) => setDraft(pendingKey, { weight: value })}
        onChangeReps={(value) => setDraft(pendingKey, { reps: value })}
        onChangeRir={(value) => setDraft(pendingKey, { rir: value })}
        onComplete={() => {
          const weightValue = parseWeightInput(pendingDraft?.weight ?? '');
          onLogSet({
            setNumber: pendingSetNumber,
            weightKg: weightValue != null ? displayToKg(weightValue, unit) : null,
            reps: parseIntInput(pendingDraft?.reps ?? ''),
            rir: pendingDraft?.rir ?? null,
          });
          clearDraft(pendingKey);
        }}
        onReopen={() => {}}
        onDelete={() => clearDraft(pendingKey)}
      />
    </View>
  );
}

/**
 * What to prefill the open row with, in order of usefulness:
 *   1. the same set number from the last time this exercise was trained,
 *   2. failing that, the previous set of the current session,
 *   3. failing that, nothing.
 */
function referenceFor(
  lastPerformance: LastPerformance | undefined,
  committed: ActiveSessionExercise['workout_sets'],
  setNumber: number,
): { weightKg: number | null; reps: number | null; rir: number | null } {
  const historical = lastPerformance?.sets.find((s) => s.set_number === setNumber);
  if (historical) {
    return {
      weightKg: historical.weight_kg != null ? Number(historical.weight_kg) : null,
      reps: historical.reps,
      rir: historical.rir,
    };
  }

  const previous = committed[committed.length - 1];
  if (previous) {
    return {
      weightKg: previous.weight_kg != null ? Number(previous.weight_kg) : null,
      reps: previous.reps,
      rir: previous.rir,
    };
  }

  return { weightKg: null, reps: null, rir: null };
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.heading,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
