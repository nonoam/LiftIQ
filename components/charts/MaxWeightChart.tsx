import { View, Text } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { subWeeks, subMonths, format } from 'date-fns';
import { kgToLbs } from '@/lib/utils';
import type { UserExerciseHistoryRow, WeightUnit } from '@/types/database';
import type { TimeRange } from '@/types';

interface MaxWeightChartProps {
  history: UserExerciseHistoryRow[];
  timeRange: TimeRange;
  weightUnit: WeightUnit;
}

export function MaxWeightChart({ history, timeRange, weightUnit }: MaxWeightChartProps) {
  const now = new Date();
  let cutoff: Date | null = null;
  if (timeRange === 'week')    cutoff = subWeeks(now, 1);
  if (timeRange === 'month')   cutoff = subMonths(now, 1);
  if (timeRange === '3months') cutoff = subMonths(now, 3);

  const filtered = cutoff
    ? history.filter((r) => new Date(r.started_at) >= cutoff!)
    : history;

  const bySession = new Map<string, { date: Date; maxWeight: number }>();
  filtered.forEach((row) => {
    if (!row.weight_kg) return;
    const w = weightUnit === 'lbs' ? kgToLbs(row.weight_kg) : row.weight_kg;
    const existing = bySession.get(row.session_id);
    if (!existing || w > existing.maxWeight) {
      bySession.set(row.session_id, { date: new Date(row.started_at), maxWeight: w });
    }
  });

  const chartData = Array.from(bySession.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((d, i) => ({ x: i, y: d.maxWeight, date: format(d.date, 'MMM d') }));

  if (chartData.length < 2) {
    return (
      <View className="bg-[#18181B] rounded-2xl p-4 items-center justify-center h-40">
        <Text className="text-[#71717A] text-sm">Not enough data for max weight trend</Text>
      </View>
    );
  }

  const maxY = Math.max(...chartData.map((d) => d.y)) * 1.1;
  const minY = Math.min(...chartData.map((d) => d.y)) * 0.9;

  return (
    <View className="bg-[#18181B] rounded-2xl p-4 gap-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-white font-bold text-sm">Max Weight Progression</Text>
        <Text className="text-[#71717A] text-xs">{weightUnit}</Text>
      </View>

      <View style={{ height: 160 }}>
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
              color="#EC4899"
              strokeWidth={2.5}
              curveType="natural"
              animate={{ type: 'spring' }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
