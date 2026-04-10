import { View, Text } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { subWeeks, subMonths, format } from 'date-fns';
import { estimated1RM, kgToLbs } from '@/lib/utils';
import type { UserExerciseHistoryRow } from '@/types/database';
import type { TimeRange, ChartDataPoint } from '@/types';
import type { WeightUnit } from '@/types/database';

interface OneRMChartProps {
  history: UserExerciseHistoryRow[];
  timeRange: TimeRange;
  weightUnit: WeightUnit;
}

function filterByRange(data: UserExerciseHistoryRow[], range: TimeRange): UserExerciseHistoryRow[] {
  const now = new Date();
  let cutoff: Date | null = null;
  if (range === 'week')    cutoff = subWeeks(now, 1);
  if (range === 'month')   cutoff = subMonths(now, 1);
  if (range === '3months') cutoff = subMonths(now, 3);
  if (!cutoff) return data;
  return data.filter((r) => new Date(r.started_at) >= cutoff!);
}

function buildChartData(history: UserExerciseHistoryRow[], range: TimeRange, unit: WeightUnit): ChartDataPoint[] {
  const filtered = filterByRange(history, range);
  // Group by session, take max 1RM per session
  const bySession = new Map<string, { date: Date; max1RM: number }>();
  filtered.forEach((row) => {
    if (!row.weight_kg || !row.reps) return;
    const rm = estimated1RM(row.weight_kg, row.reps);
    const existing = bySession.get(row.session_id);
    if (!existing || rm > existing.max1RM) {
      bySession.set(row.session_id, { date: new Date(row.started_at), max1RM: rm });
    }
  });

  return Array.from(bySession.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((d) => ({
      x: d.date,
      y: unit === 'lbs' ? kgToLbs(d.max1RM) : d.max1RM,
      label: format(d.date, 'MMM d'),
    }));
}

export function OneRMChart({ history, timeRange, weightUnit }: OneRMChartProps) {
  const data = buildChartData(history, timeRange, weightUnit);

  if (data.length < 2) {
    return (
      <View className="bg-[#18181B] rounded-2xl p-4 items-center justify-center h-40">
        <Text className="text-[#71717A] text-sm">Not enough data to show 1RM trend</Text>
        <Text className="text-[#52525B] text-xs mt-1">Log at least 2 sessions</Text>
      </View>
    );
  }

  const chartData = data.map((d, i) => ({ x: i, y: d.y, date: d.label ?? '' }));
  const maxY = Math.max(...data.map((d) => d.y)) * 1.1;
  const minY = Math.min(...data.map((d) => d.y)) * 0.95;

  return (
    <View className="bg-[#18181B] rounded-2xl p-4 gap-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-white font-bold text-sm">Estimated 1RM</Text>
        <Text className="text-[#71717A] text-xs">{weightUnit}</Text>
      </View>

      <View style={{ height: 180 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domain={{ y: [minY, maxY] }}
          axisOptions={{
            font: undefined,
            labelColor: '#71717A',
            lineColor: '#27272A',
            tickCount: { x: 4, y: 4 },
            formatXLabel: (v) => chartData[Math.round(v)]?.date ?? '',
            formatYLabel: (v) => `${Math.round(v)}`,
          }}
        >
          {({ points }) => (
            <Line
              points={points.y}
              color="#6366F1"
              strokeWidth={2.5}
              animate={{ type: 'spring' }}
              curveType="natural"
            />
          )}
        </CartesianChart>
      </View>

      {/* Best label */}
      <View className="flex-row justify-between">
        <Text className="text-[#71717A] text-xs">Best: {Math.max(...data.map(d => d.y)).toFixed(1)} {weightUnit}</Text>
        <Text className="text-[#71717A] text-xs">{data.length} sessions</Text>
      </View>
    </View>
  );
}
