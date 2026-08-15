import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, rirColor, spacing, typography } from '@/theme/tokens';

/**
 * RIR input.
 *
 * Deliberately a row of pills and not a numeric field: this is tapped between
 * sets, one-handed, and a keyboard for a single digit is friction. Anything
 * above 3 is "comfortably far from failure" and rarely tracked precisely, so
 * 4+ collapses the tail of the scale into one target.
 */

const OPTIONS = [0, 1, 2, 3, 4] as const;

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  compact?: boolean;
};

export function RirPicker({ value, onChange, compact = false }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = value === option;
        const tint = rirColor(option);
        return (
          <Pressable
            key={option}
            onPress={() => onChange(selected ? null : option)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`RIR ${option === 4 ? '4 o más' : option}`}
            style={[
              styles.pill,
              compact && styles.pillCompact,
              selected && { backgroundColor: tint, borderColor: tint },
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {option === 4 ? '4+' : option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCompact: {
    minWidth: 34,
    height: 34,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textMuted,
  },
  labelSelected: {
    color: '#0B0F14',
    fontWeight: '700',
  },
});
