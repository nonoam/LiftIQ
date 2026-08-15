import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { RirPicker } from '@/components/workout/RirPicker';
import {
  useRemoveRoutineExercise,
  useReorderRoutineExercises,
  useRoutine,
  useUpdateRoutineExercise,
} from '@/hooks/useRoutines';
import { useActiveSession, useStartSession } from '@/hooks/useWorkoutSession';
import { pluralise } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { MUSCLE_GROUP_LABEL } from '@/types/models';
import type { MuscleGroup } from '@/types/models';

const SET_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function RoutineEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: routine, isLoading } = useRoutine(id);
  const { data: activeSession } = useActiveSession();
  const updateExercise = useUpdateRoutineExercise();
  const removeExercise = useRemoveRoutineExercise();
  const reorder = useReorderRoutineExercises();
  const startSession = useStartSession();

  if (isLoading || !routine) {
    return (
      <Screen title="Rutina">
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </Screen>
    );
  }

  const exercises = routine.routine_exercises;

  /**
   * Move by one place instead of drag-and-drop: reordering happens rarely and
   * at a desk, not mid-set, and arrows avoid pulling in a gesture-handler
   * dependency plus its native build for a once-in-a-while action.
   */
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= exercises.length) return;

    const ordered = exercises.map((re) => re.id);
    const moved = ordered[index]!;
    ordered[index] = ordered[target]!;
    ordered[target] = moved;

    reorder.mutate({ routineId: routine!.id, orderedIds: ordered });
  }

  return (
    <Screen
      title={routine.name}
      subtitle={pluralise(exercises.length, 'ejercicio', 'ejercicios')}
      right={
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" style={styles.close}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <EmptyState
            title="Rutina vacía"
            message="Añade ejercicios y fija cuántas series y con qué RIR quieres hacerlos."
            actionLabel="Añadir ejercicio"
            onAction={() =>
              router.push(`/exercise-picker?target=routine&routineId=${routine.id}`)
            }
          />
        ) : (
          exercises.map((routineExercise, index) => (
            <Card key={routineExercise.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardText}>
                  <Text style={styles.name}>{routineExercise.exercise.name}</Text>
                  <Text style={styles.meta}>
                    {MUSCLE_GROUP_LABEL[routineExercise.exercise.muscle_group as MuscleGroup]}
                  </Text>
                </View>
                <View style={styles.moveButtons}>
                  <Pressable
                    onPress={() => move(index, -1)}
                    disabled={index === 0}
                    accessibilityLabel="Subir ejercicio"
                    style={[styles.moveButton, index === 0 && styles.moveDisabled]}
                  >
                    <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={() => move(index, 1)}
                    disabled={index === exercises.length - 1}
                    accessibilityLabel="Bajar ejercicio"
                    style={[
                      styles.moveButton,
                      index === exercises.length - 1 && styles.moveDisabled,
                    ]}
                  >
                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Series objetivo</Text>
              <View style={styles.chipRow}>
                {SET_OPTIONS.map((count) => (
                  <Pressable
                    key={count}
                    onPress={() =>
                      updateExercise.mutate({
                        id: routineExercise.id,
                        routineId: routine.id,
                        patch: { target_sets: count },
                      })
                    }
                    style={[
                      styles.chip,
                      routineExercise.target_sets === count && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        routineExercise.target_sets === count && styles.chipLabelActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>RIR objetivo</Text>
              <RirPicker
                value={routineExercise.target_rir}
                onChange={(value) =>
                  updateExercise.mutate({
                    id: routineExercise.id,
                    routineId: routine.id,
                    patch: { target_rir: value },
                  })
                }
                compact
              />

              <Pressable
                onPress={() =>
                  Alert.alert('Quitar ejercicio', `Quitar ${routineExercise.exercise.name} de la rutina.`, [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Quitar',
                      style: 'destructive',
                      onPress: () =>
                        removeExercise.mutate({ id: routineExercise.id, routineId: routine.id }),
                    },
                  ])
                }
                style={styles.removeRow}
              >
                <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
                <Text style={styles.removeLabel}>Quitar de la rutina</Text>
              </Pressable>
            </Card>
          ))
        )}

        {exercises.length > 0 ? (
          <Button
            label="Añadir ejercicio"
            variant="secondary"
            icon={<Ionicons name="add" size={20} color={colors.text} />}
            onPress={() =>
              router.push(`/exercise-picker?target=routine&routineId=${routine.id}`)
            }
          />
        ) : null}

        {exercises.length > 0 ? (
          <Button
            label={activeSession ? 'Ya tienes un entreno abierto' : 'Empezar este entreno'}
            size="lg"
            disabled={Boolean(activeSession)}
            loading={startSession.isPending}
            onPress={() =>
              startSession.mutate(
                { name: routine.name, routineId: routine.id },
                { onSuccess: () => router.replace('/workout/active') },
              )
            }
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textFaint,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveDisabled: {
    opacity: 0.35,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    width: 40,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.bodyStrong,
    color: colors.textMuted,
  },
  chipLabelActive: {
    color: colors.primary,
  },
  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  removeLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
