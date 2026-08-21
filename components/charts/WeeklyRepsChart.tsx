import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { StyleSheet, Text, View } from 'react-native';

import type { WeeklyReps } from '@/hooks/useRoutineProgress';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const CHART_HEIGHT = 132;
/** Weeks with no training still need to be visible as a stub, not vanish. */
const EMPTY_BAR_HEIGHT = 3;

export type ChartMetric = 'reps' | 'sets' | 'volume';

type Props = {
  data: WeeklyReps[];
  metric?: ChartMetric;
};

const METRIC_LABEL: Record<ChartMetric, string> = {
  reps: 'repeticiones',
  sets: 'series',
  volume: 'kg de volumen',
};

export function WeeklyRepsChart({ data, metric = 'reps' }: Props) {
  const values = data.map((week) => valueFor(week, metric));
  const max = Math.max(...values, 1);

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.chart}
        accessibilityRole="image"
        accessibilityLabel={summaryLabel(data, metric)}
      >
        {data.map((week, index) => {
          const value = values[index] ?? 0;
          const isCurrent = index === data.length - 1;
          // Scale against the tallest bar rather than a fixed ceiling: the
          // question this chart answers is "more or less than other weeks",
          // not "how close to some absolute target".
          const height = value > 0 ? Math.max(6, (value / max) * CHART_HEIGHT) : EMPTY_BAR_HEIGHT;

          return (
            <View key={week.week_start} style={styles.column}>
              <Text style={[styles.value, isCurrent && styles.valueCurrent]} numberOfLines={1}>
                {value > 0 ? formatValue(value, metric) : ''}
              </Text>
              <View
                style={[
                  styles.bar,
                  { height },
                  value === 0 && styles.barEmpty,
                  isCurrent && value > 0 && styles.barCurrent,
                ]}
              />
              <Text style={[styles.week, isCurrent && styles.weekCurrent]} numberOfLines={1}>
                {/* Only every other label, otherwise 12 dates collide. */}
                {index % 2 === data.length % 2
                  ? format(parseISO(week.week_start), 'd MMM', { locale: es })
                  : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.caption}>
        {METRIC_LABEL[metric]} por semana · máximo {formatValue(max, metric)}
      </Text>
    </View>
  );
}

function valueFor(week: WeeklyReps, metric: ChartMetric): number {
  if (metric === 'sets') return week.total_sets;
  if (metric === 'volume') return Math.round(Number(week.total_volume_kg));
  return week.total_reps;
}

function formatValue(value: number, metric: ChartMetric): string {
  // Volume reaches five figures fast and would not fit above a bar.
  if (metric === 'volume' && value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(value);
}

function summaryLabel(data: WeeklyReps[], metric: ChartMetric): string {
  const current = data[data.length - 1];
  if (!current) return 'Sin datos';
  return `Gráfico de ${METRIC_LABEL[metric]} por semana. Esta semana: ${valueFor(current, metric)}.`;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 34,
    gap: 3,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  bar: {
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    opacity: 0.75,
  },
  barCurrent: {
    opacity: 1,
    backgroundColor: colors.success,
  },
  barEmpty: {
    backgroundColor: colors.borderStrong,
    opacity: 1,
  },
  value: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textFaint,
    fontVariant: ['tabular-nums'],
  },
  valueCurrent: {
    color: colors.success,
    fontWeight: '700',
  },
  week: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textFaint,
  },
  weekCurrent: {
    color: colors.textMuted,
  },
  caption: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
