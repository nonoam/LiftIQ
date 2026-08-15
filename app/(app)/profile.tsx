import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/hooks/useAuth';
import { useHistory } from '@/hooks/useHistory';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { signOut } from '@/lib/auth';
import { formatDuration, pluralise } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { Constants } from '@/types/database';
import type { WeightUnit } from '@/types/models';

const REST_OPTIONS = [60, 90, 120, 180, 240];

export default function ProfileScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: history } = useHistory(500);
  const updateProfile = useUpdateProfile();

  const totalSessions = history?.length ?? 0;
  const totalSeconds = history?.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) ?? 0;

  return (
    <Screen title="Perfil" subtitle={user?.email ?? undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>entrenos</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(totalSeconds)}</Text>
            <Text style={styles.statLabel}>en total</Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unidad de peso</Text>
          <Text style={styles.sectionHint}>
            Los entrenos se guardan siempre en kilos; esto solo cambia cómo se muestran.
          </Text>
          <View style={styles.optionRow}>
            {Constants.public.Enums.weight_unit.map((unit) => (
              <Option
                key={unit}
                label={unit === 'kg' ? 'Kilos (kg)' : 'Libras (lb)'}
                active={profile?.weight_unit === unit}
                onPress={() => updateProfile.mutate({ weight_unit: unit as WeightUnit })}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descanso por defecto</Text>
          <Text style={styles.sectionHint}>
            {pluralise(profile?.default_rest_seconds ?? 120, 'segundo', 'segundos')} entre series.
          </Text>
          <View style={styles.optionRow}>
            {REST_OPTIONS.map((seconds) => (
              <Option
                key={seconds}
                label={formatDuration(seconds)}
                active={profile?.default_rest_seconds === seconds}
                onPress={() => updateProfile.mutate({ default_rest_seconds: seconds })}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Button
            label="Cerrar sesión"
            variant="secondary"
            icon={<Ionicons name="log-out-outline" size={18} color={colors.text} />}
            onPress={() =>
              Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: () => void signOut() },
              ])
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Option({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[styles.option, active && styles.optionActive]}
    >
      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...typography.title,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  optionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  optionLabelActive: {
    color: colors.primary,
  },
});
