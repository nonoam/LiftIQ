import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { WeeklyRepsChart } from '@/components/charts/WeeklyRepsChart';
import type { ChartMetric } from '@/components/charts/WeeklyRepsChart';
import {
  padMissingWeeks,
  useRoutineExerciseWeeklyReps,
  useRoutineWeeklyReps,
} from '@/hooks/useRoutineProgress';
import type { WeeklyReps } from '@/hooks/useRoutineProgress';
import { formatWeightValue, kgToDisplay } from '@/lib/units';
import { colors, radius, rirColor, spacing, typography } from '@/theme/tokens';
import type { WeightUnit } from '@/types/models';

const WEEKS = 12;

const METRICS: { key: ChartMetric; label: string }[] = [
  { key: 'reps', label: 'Reps' },
  { key: 'sets', label: 'Series' },
  { key: 'volume', label: 'Volumen' },
];

/**
 * Week-by-week progress for one routine.
 *
 * Reps is the headline number because it is the one being tracked, but sets
 * and volume are a tap away: reps can stay flat while the weight climbs, and
 * reading that as "no progress" would be wrong.
 */
export function WeeklyProgressSection({
  routineId,
  unit,
}: {
  routineId: string;
  unit: WeightUnit;
}) {
  const [metric, setMetric] = useState<ChartMetric>('reps');
  const { data: weeks, isLoading } = useRoutineWeeklyReps(routineId, WEEKS);
  const { data: byExercise } = useRoutineExerciseWeeklyReps(routineId, WEEKS);

  const padded = useMemo(() => padMissingWeeks(weeks ?? [], WEEKS), [weeks]);
  const trained = useMemo(() => [...(weeks ?? [])].reverse(), [weeks]);

  // The most recent week that actually has training in it — the empty weeks
  // padded into the chart have no exercise breakdown to show.
  const latestWeek = trained[0]?.week_start;
  const latestBreakdown = useMemo(
    () => (byExercise ?? []).filter((row) => row.week_start === latestWeek),
    [byExercise, latestWeek],
  );

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} color={colors.primary} />;
  }

  if (!weeks || weeks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Aún no hay historial</Text>
        <Text style={styles.emptyBody}>
          Cuando termines un entreno con esta rutina, aquí verás las repeticiones que has hecho
          semana a semana.
        </Text>
      </View>
    );
  }

  const delta = weekOverWeekDelta(padded, metric);

  return (
    <View style={styles.section}>
      <View style={styles.metricRow}>
        {METRICS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setMetric(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: metric === item.key }}
            style={[styles.metricChip, metric === item.key && styles.metricChipActive]}
          >
            <Text style={[styles.metricLabel, metric === item.key && styles.metricLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <WeeklyRepsChart data={padded} metric={metric} />

      {delta !== null ? (
        <Text style={styles.delta}>
          Esta semana{' '}
          <Text style={{ color: delta >= 0 ? colors.success : colors.warning }}>
            {delta >= 0 ? '+' : ''}
            {delta}
          </Text>{' '}
          respecto a la semana pasada
        </Text>
      ) : null}

      <Text style={styles.subheading}>Semana a semana</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colWeek]}>Semana</Text>
          <Text style={[styles.th, styles.colNum]}>Reps</Text>
          <Text style={[styles.th, styles.colNum]}>Series</Text>
          <Text style={[styles.th, styles.colNum]}>RIR</Text>
          <Text style={[styles.th, styles.colVol]}>Volumen</Text>
        </View>
        {trained.map((week) => (
          <View key={week.week_start} style={styles.tr}>
            <Text style={[styles.td, styles.colWeek]}>{weekLabel(week)}</Text>
            <Text style={[styles.td, styles.colNum, styles.tdStrong]}>{week.total_reps}</Text>
            <Text style={[styles.td, styles.colNum]}>{week.total_sets}</Text>
            <Text
              style={[
                styles.td,
                styles.colNum,
                week.avg_rir != null ? { color: rirColor(Math.round(Number(week.avg_rir))) } : null,
              ]}
            >
              {week.avg_rir != null ? Number(week.avg_rir).toFixed(1) : '—'}
            </Text>
            <Text style={[styles.td, styles.colVol]}>
              {formatWeightValue(Math.round(kgToDisplay(Number(week.total_volume_kg), unit)))}
            </Text>
          </View>
        ))}
      </View>

      {latestBreakdown.length > 0 && latestWeek ? (
        <>
          <Text style={styles.subheading}>
            Por ejercicio · semana del {format(parseISO(latestWeek), 'd MMMM', { locale: es })}
          </Text>
          <View style={styles.table}>
            {latestBreakdown.map((row) => (
              <View key={row.exercise_id} style={styles.tr}>
                <Text style={[styles.td, styles.colExercise]} numberOfLines={1}>
                  {row.exercise_name}
                </Text>
                <Text style={[styles.td, styles.colNum, styles.tdStrong]}>{row.total_reps}</Text>
                <Text style={[styles.td, styles.colNum]}>{row.total_sets}</Text>
                <Text
                  style={[
                    styles.td,
                    styles.colNum,
                    row.avg_rir != null
                      ? { color: rirColor(Math.round(Number(row.avg_rir))) }
                      : null,
                  ]}
                >
                  {row.avg_rir != null ? Number(row.avg_rir).toFixed(1) : '—'}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.legend}>reps · series · RIR medio</Text>
        </>
      ) : null}
    </View>
  );
}

function weekLabel(week: WeeklyReps): string {
  const start = parseISO(week.week_start);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM', { locale: es })}`;
}

/** Change against the previous week, or null when there is nothing to compare. */
function weekOverWeekDelta(weeks: WeeklyReps[], metric: ChartMetric): number | null {
  const current = weeks[weeks.length - 1];
  const previous = weeks[weeks.length - 2];
  if (!current || !previous) return null;

  const value = (week: WeeklyReps) =>
    metric === 'sets'
      ? week.total_sets
      : metric === 'volume'
        ? Math.round(Number(week.total_volume_kg))
        : week.total_reps;

  // Both weeks empty is not a meaningful "no change"; it means untrained.
  if (value(current) === 0 && value(previous) === 0) return null;
  return value(current) - value(previous);
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xl },
  section: { gap: spacing.md },
  empty: {
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  metricChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  metricLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  metricLabelActive: {
    color: colors.primary,
  },
  delta: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  subheading: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  table: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  th: {
    ...typography.caption,
    color: colors.textFaint,
  },
  td: {
    ...typography.caption,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  tdStrong: {
    color: colors.text,
    fontWeight: '600',
  },
  colWeek: { flex: 2.4 },
  colExercise: { flex: 3 },
  colNum: { flex: 1, textAlign: 'right' },
  colVol: { flex: 1.4, textAlign: 'right' },
  legend: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    textAlign: 'right',
  },
});
