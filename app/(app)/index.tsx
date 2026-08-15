import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useWeekStats } from '@/hooks/useHistory';
import { useProfile, useWeightUnit } from '@/hooks/useProfile';
import { useRoutines } from '@/hooks/useRoutines';
import { useActiveSession, useStartSession } from '@/hooks/useWorkoutSession';
import { formatDuration, pluralise } from '@/lib/format';
import { formatWeightValue, kgToDisplay } from '@/lib/units';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const unit = useWeightUnit();
  const { data: profile } = useProfile();
  const { data: activeSession } = useActiveSession();
  const { data: routines } = useRoutines();
  const { data: week } = useWeekStats();
  const startSession = useStartSession();

  const firstName = profile?.display_name?.split(' ')[0];

  function startEmpty() {
    startSession.mutate(
      { name: 'Entreno' },
      { onSuccess: () => router.push('/workout/active') },
    );
  }

  function startFromRoutine(routineId: string, name: string) {
    startSession.mutate(
      { name, routineId },
      { onSuccess: () => router.push('/workout/active') },
    );
  }

  return (
    <Screen
      title={firstName ? `Hola, ${firstName}` : 'Hoy'}
      subtitle="¿Entrenamos?"
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeSession ? (
          <Card style={styles.activeCard} onPress={() => router.push('/workout/active')}>
            <View style={styles.activeHeader}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>En curso</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
            <Text style={styles.activeTitle}>{activeSession.name}</Text>
            <Text style={styles.activeMeta}>
              {pluralise(activeSession.session_exercises.length, 'ejercicio', 'ejercicios')} ·{' '}
              {pluralise(
                activeSession.session_exercises.reduce((n, se) => n + se.workout_sets.length, 0),
                'serie',
                'series',
              )}
            </Text>
            <Text style={styles.activeCta}>Continuar entreno</Text>
          </Card>
        ) : (
          <Button
            label="Empezar entreno vacío"
            size="lg"
            icon={<Ionicons name="add" size={20} color={colors.textOnPrimary} />}
            onPress={startEmpty}
            loading={startSession.isPending}
          />
        )}

        {startSession.isError ? (
          <Text style={styles.error}>
            {startSession.error instanceof Error
              ? startSession.error.message
              : 'No se pudo empezar el entreno.'}
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Esta semana</Text>
          <View style={styles.statRow}>
            <Stat value={String(week?.sessions ?? 0)} label="entrenos" />
            <Stat value={String(week?.sets ?? 0)} label="series" />
            <Stat
              value={
                week ? formatWeightValue(Math.round(kgToDisplay(week.volumeKg, unit))) : '0'
              }
              label={`volumen (${unit})`}
            />
          </View>
        </View>

        {routines && routines.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Empezar desde una rutina</Text>
            <View style={styles.routineList}>
              {routines.slice(0, 4).map((routine) => (
                <Card
                  key={routine.id}
                  style={styles.routineCard}
                  onPress={() =>
                    activeSession ? router.push('/workout/active') : startFromRoutine(routine.id, routine.name)
                  }
                >
                  <View style={styles.routineText}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineMeta}>
                      {pluralise(routine.routine_exercises.length, 'ejercicio', 'ejercicios')}
                      {routine.routine_exercises.length > 0
                        ? ` · ${routine.routine_exercises
                            .slice(0, 3)
                            .map((re) => re.exercise.name)
                            .join(', ')}`
                        : ''}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={26} color={colors.primary} />
                </Card>
              ))}
            </View>
          </View>
        ) : (
          <Card style={styles.hintCard} onPress={() => router.push('/(app)/routines')}>
            <Text style={styles.hintTitle}>Crea tu primera rutina</Text>
            <Text style={styles.hintBody}>
              Guarda los ejercicios que sueles hacer juntos y empieza el entreno con todo
              preparado.
            </Text>
          </Card>
        )}

        {week && week.sessions > 0 ? (
          <Text style={styles.footnote}>
            Tiempo entrenando estos 7 días: {formatDuration(week.durationSeconds)}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  activeCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    gap: spacing.xs,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  liveText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  activeTitle: {
    ...typography.heading,
    color: colors.text,
  },
  activeMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  activeCta: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...typography.title,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  routineList: {
    gap: spacing.sm,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  routineText: {
    flex: 1,
    gap: 2,
  },
  routineName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  routineMeta: {
    ...typography.caption,
    color: colors.textFaint,
  },
  hintCard: {
    gap: spacing.xs,
  },
  hintTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  hintBody: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footnote: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
