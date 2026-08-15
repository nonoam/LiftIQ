import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExerciseBlock } from '@/components/workout/ExerciseBlock';
import { useWeightUnit } from '@/hooks/useProfile';
import {
  useActiveSession,
  useDeleteSet,
  useDiscardSession,
  useFinishSession,
  useLastPerformance,
  useLogSet,
  useRemoveExerciseFromSession,
} from '@/hooks/useWorkoutSession';
import { formatClock } from '@/lib/format';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const unit = useWeightUnit();

  const { data: session, isLoading } = useActiveSession();
  const logSet = useLogSet();
  const deleteSet = useDeleteSet();
  const removeExercise = useRemoveExerciseFromSession();
  const finishSession = useFinishSession();
  const discardSession = useDiscardSession();

  const [savingKey, setSavingKey] = useState<string | null>(null);

  const exerciseIds = useMemo(
    () => session?.session_exercises.map((se) => se.exercise_id) ?? [],
    [session],
  );
  const { data: lastPerformance } = useLastPerformance(exerciseIds);

  const elapsed = useElapsedSeconds(session?.started_at);

  // If the workout was finished or discarded elsewhere, do not strand the user
  // on a screen with nothing to edit.
  useEffect(() => {
    if (!isLoading && !session) router.replace('/(app)');
  }, [isLoading, session, router]);

  if (!session) return null;

  const totalSets = session.session_exercises.reduce(
    (sum, se) => sum + se.workout_sets.length,
    0,
  );

  function handleFinish() {
    if (!session) return;
    if (totalSets === 0) {
      Alert.alert(
        'Entreno vacío',
        'No has registrado ninguna serie. ¿Quieres descartarlo?',
        [
          { text: 'Seguir entrenando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => discardSession.mutate(session.id, { onSuccess: () => router.replace('/(app)') }),
          },
        ],
      );
      return;
    }

    Alert.alert('Terminar entreno', `Vas a guardar ${totalSets} series.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Terminar',
        onPress: () =>
          finishSession.mutate(
            { sessionId: session.id },
            { onSuccess: () => router.replace('/(app)') },
          ),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Minimizar entreno"
          style={styles.headerButton}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textMuted} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session.name}
          </Text>
          <Text style={styles.clock}>{formatClock(elapsed)}</Text>
        </View>

        <Pressable
          onPress={handleFinish}
          accessibilityRole="button"
          accessibilityLabel="Terminar entreno"
          style={styles.finishButton}
        >
          <Text style={styles.finishLabel}>Terminar</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {session.session_exercises.length === 0 ? (
            <EmptyState
              title="Entreno vacío"
              message="Añade el primer ejercicio para empezar a registrar series."
              actionLabel="Añadir ejercicio"
              onAction={() => router.push('/exercise-picker?target=session')}
            />
          ) : (
            session.session_exercises.map((sessionExercise) => (
              <ExerciseBlock
                key={sessionExercise.id}
                sessionExercise={sessionExercise}
                lastPerformance={lastPerformance?.[sessionExercise.exercise_id]}
                unit={unit}
                savingSetNumber={
                  savingKey?.startsWith(sessionExercise.id)
                    ? Number(savingKey.split(':')[1])
                    : null
                }
                onLogSet={(input) => {
                  const key = `${sessionExercise.id}:${input.setNumber}`;
                  setSavingKey(key);
                  logSet.mutate(
                    { ...input, sessionExerciseId: sessionExercise.id },
                    { onSettled: () => setSavingKey((current) => (current === key ? null : current)) },
                  );
                }}
                onDeleteSet={(setId) => deleteSet.mutate(setId)}
                onRemoveExercise={() => {
                  Alert.alert(
                    'Quitar ejercicio',
                    `Se eliminarán las series registradas de ${sessionExercise.exercise.name}.`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Quitar',
                        style: 'destructive',
                        onPress: () => removeExercise.mutate(sessionExercise.id),
                      },
                    ],
                  );
                }}
              />
            ))
          )}

          {session.session_exercises.length > 0 ? (
            <Button
              label="Añadir ejercicio"
              variant="secondary"
              size="lg"
              icon={<Ionicons name="add" size={20} color={colors.text} />}
              onPress={() => router.push('/exercise-picker?target=session')}
            />
          ) : null}

          <Button
            label="Descartar entreno"
            variant="ghost"
            onPress={() =>
              Alert.alert('Descartar entreno', 'Se perderá todo lo registrado en esta sesión.', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Descartar',
                  style: 'destructive',
                  onPress: () =>
                    discardSession.mutate(session.id, { onSuccess: () => router.replace('/(app)') }),
                },
              ])
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Ticks once a second, derived from started_at so it stays right after a
 *  background/foreground cycle instead of drifting. */
function useElapsedSeconds(startedAt: string | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  clock: {
    ...typography.caption,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  finishButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  finishLabel: {
    ...typography.bodyStrong,
    color: colors.success,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
