import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useWeightUnit } from '@/hooks/useProfile';
import { useDiscardSession, useSession } from '@/hooks/useWorkoutSession';
import { formatDayHeading, formatDuration, formatSet, formatTime, pluralise } from '@/lib/format';
import { estimate1RM, formatWeightValue, kgToDisplay, setVolumeKg } from '@/lib/units';
import { colors, rirColor, spacing, typography } from '@/theme/tokens';
import { MUSCLE_GROUP_LABEL } from '@/types/models';
import type { MuscleGroup } from '@/types/models';

export default function SessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = useWeightUnit();
  const { data: session, isLoading } = useSession(id);
  const deleteSession = useDiscardSession();

  if (isLoading || !session) {
    return (
      <Screen title="Entreno">
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </Screen>
    );
  }

  const workingSets = session.session_exercises.flatMap((se) =>
    se.workout_sets.filter((s) => s.set_type !== 'warmup'),
  );
  const totalVolume = workingSets.reduce(
    (sum, s) => sum + setVolumeKg(s.weight_kg != null ? Number(s.weight_kg) : null, s.reps),
    0,
  );

  return (
    <Screen
      title={session.name}
      subtitle={`${formatDayHeading(session.started_at)} · ${formatTime(session.started_at)}`}
      right={
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" style={styles.close}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.summary}>
          <Summary value={formatDuration(session.duration_seconds)} label="duración" />
          <View style={styles.divider} />
          <Summary value={String(workingSets.length)} label="series" />
          <View style={styles.divider} />
          <Summary
            value={`${formatWeightValue(Math.round(kgToDisplay(totalVolume, unit)))} ${unit}`}
            label="volumen"
          />
        </Card>

        {session.session_exercises.map((sessionExercise) => (
          <View key={sessionExercise.id} style={styles.exercise}>
            <Text style={styles.exerciseName}>{sessionExercise.exercise.name}</Text>
            <Text style={styles.exerciseMeta}>
              {MUSCLE_GROUP_LABEL[sessionExercise.exercise.muscle_group as MuscleGroup]} ·{' '}
              {pluralise(sessionExercise.workout_sets.length, 'serie', 'series')}
            </Text>

            {sessionExercise.workout_sets.length === 0 ? (
              <Text style={styles.noSets}>Sin series registradas.</Text>
            ) : (
              sessionExercise.workout_sets.map((set) => {
                const oneRm = estimate1RM(
                  set.weight_kg != null ? Number(set.weight_kg) : null,
                  set.reps,
                  set.rir,
                );
                return (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{set.set_number}</Text>
                    <Text style={styles.setValue}>
                      {formatSet(
                        set.weight_kg != null ? Number(set.weight_kg) : null,
                        set.reps,
                        null,
                        unit,
                      )}
                    </Text>
                    {set.rir != null ? (
                      <Text style={[styles.setRir, { color: rirColor(set.rir) }]}>
                        RIR {set.rir}
                      </Text>
                    ) : null}
                    {oneRm != null ? (
                      <Text style={styles.setOneRm}>
                        ~{formatWeightValue(Math.round(kgToDisplay(oneRm, unit)))} {unit}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ))}

        <Text style={styles.footnote}>
          El valor de la derecha es el 1RM estimado, ajustado por RIR: una serie con
          repeticiones en reserva se trata como si fueran reps + RIR repeticiones al fallo.
        </Text>

        <Button
          label="Eliminar entreno"
          variant="danger"
          onPress={() =>
            Alert.alert('Eliminar entreno', 'Se borrará esta sesión y todas sus series.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => deleteSession.mutate(session.id, { onSuccess: () => router.back() }),
              },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
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
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: colors.text,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  exercise: {
    gap: spacing.xs,
  },
  exerciseName: {
    ...typography.heading,
    color: colors.text,
  },
  exerciseMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  noSets: {
    ...typography.caption,
    color: colors.textFaint,
    fontStyle: 'italic',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  setNumber: {
    ...typography.caption,
    color: colors.textFaint,
    width: 16,
  },
  setValue: {
    ...typography.numeric,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  setRir: {
    ...typography.label,
    fontWeight: '600',
  },
  setOneRm: {
    ...typography.caption,
    color: colors.textFaint,
    width: 74,
    textAlign: 'right',
  },
  footnote: {
    ...typography.caption,
    color: colors.textFaint,
    lineHeight: 17,
  },
});
