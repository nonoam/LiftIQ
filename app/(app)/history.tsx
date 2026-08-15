import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useHistory } from '@/hooks/useHistory';
import { useWeightUnit } from '@/hooks/useProfile';
import { formatDayHeading, formatDuration, formatTime, pluralise } from '@/lib/format';
import { formatWeightValue, kgToDisplay } from '@/lib/units';
import { colors, spacing, typography } from '@/theme/tokens';
import type { SessionSummary } from '@/types/models';

export default function HistoryScreen() {
  const router = useRouter();
  const unit = useWeightUnit();
  const { data: sessions, isLoading, refetch, isRefetching } = useHistory();

  // Group by calendar day so the list reads as a training log rather than an
  // undifferentiated stream of rows.
  const sections = useMemo(() => {
    if (!sessions) return [];
    const byDay = new Map<string, SessionSummary[]>();

    for (const session of sessions) {
      if (!session.started_at) continue;
      const day = session.started_at.slice(0, 10);
      const bucket = byDay.get(day);
      if (bucket) bucket.push(session);
      else byDay.set(day, [session]);
    }

    return [...byDay.entries()].map(([day, data]) => ({
      title: formatDayHeading(data[0]!.started_at!),
      day,
      data,
    }));
  }, [sessions]);

  if (isLoading) {
    return (
      <Screen title="Historial">
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="Historial" subtitle={sessions ? pluralise(sessions.length, 'entreno', 'entrenos') : undefined}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.session_id!}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            title="Aún no hay entrenos"
            message="Cuando termines tu primera sesión aparecerá aquí, con sus series y su volumen."
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.session_id! } })}
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {formatTime(item.started_at!)} · {formatDuration(item.duration_seconds)} ·{' '}
                {pluralise(item.working_set_count ?? 0, 'serie', 'series')}
              </Text>
              <Text style={styles.cardVolume}>
                {formatWeightValue(Math.round(kgToDisplay(Number(item.total_volume_kg ?? 0), unit)))}{' '}
                {unit} de volumen
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cardVolume: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
