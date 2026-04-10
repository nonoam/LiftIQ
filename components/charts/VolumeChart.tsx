import { View, Text } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { subWeeks, subMonths, format } from 'date-fns';
import { kgToLbs } from '@/lib/utils';
import type { UserExerciseHistoryRow, WeightUnit } from '@/types/database';
import type { TimeRange } from '@/types';

interface VolumeChartProps {
  history: UserExerciseHistoryRow[];
  timeRange: TimeRange;
  weightUnit: WeightUnit;
}

export function VolumeChart({ history, timeRange, weightUnit }: VolumeChartProps) {
  const now = new Date();
  let cutoff: Date | null = null;
  if (timeRange === 'week')    cutoff = subWeeks(now, 1);
  if (timeRange === 'month')   cutoff = subMonths(now, 1);
  if (timeRange === '3months') cutoff = subMonths(now, 3);

  const filtered = cutoff
    ? history.filter((r) => new Date(r.started_at) >= cutoff!)
    : history;

  // Volume per session
  const bySession = new Map<string, { date: Date; volume: number }>();
  filtered.forEach((row) => {
    if (!row.set_volume_kg) return;
    const existing = bySession.get(row.session_id);
    const v = weightUnit === 'lbs' ? kgToLbs(row.set_volume_kg) : row.set_volume_kg;
    if (!existing) {
      bySession.set(row.session_id, { date: new Date(row.started_at), volume: v });
    } else {
      existing.volume += v;
    }
  });

  const chartData = Array.from(bySession.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((d, i) => ({ x: i, y: Math.round(d.volume), date: format(d.date, 'MMM d') }));

  if (chartData.length < 1) {
    return (
      <View className="bg-[#18181B] rounded-2xl p-4 items-center justify-center h-40">
        <Text className="text-[#71717A] text-sm">No volume data for this period</Text>
      </View>
    );
  }

  return (
    <View className="bg-[#18181B] rounded-2xl p-4 gap-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-white font-bold text-sm">Volume per Session</Text>
        <Text className="text-[#71717A] text-xs">{weightUnit}</Text>
      </View>

      <View style={{ height: 160 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domain={{ y: [0, Math.max(...chartData.map((d) => d.y)) * 1.15] }}
          axisOptions={{
            font: undefined,
            labelColor: '#71717A',
            lineColor: '#27272A',
            tickCount: { x: Math.min(chartData.length, 5), y: 4 },
            formatXLabel: (v) => chartData[Math.round(v)]?.date ?? '',
            formatYLabel: (v) => `${Math.round(v / 1000)}k`,
          }}
        >
          {({ points, chartBounds }) => (
            <Bar
              points={points.y}
              chartBounds={chartBounds}
              color="#6366F1"
              roundedCorners={{ topLeft: 4, topRight: 4 }}
              animate={{ type: 'spring' }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
