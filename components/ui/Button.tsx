import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { MIN_TOUCH, colors, radius, spacing, typography } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}: Props) {
  const isInert = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInert, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        variantStyles[variant].container,
        pressed && !isInert && variantStyles[variant].pressed,
        isInert && styles.inert,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].label.color} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, size === 'lg' && styles.labelLg, variantStyles[variant].label]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: {
    minHeight: 54,
    borderRadius: radius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyStrong,
    textAlign: 'center',
  },
  labelLg: {
    fontSize: 17,
  },
  // Dim rather than hide: a disabled primary action still has to read as the
  // primary action, otherwise the screen looks broken while a request is in
  // flight.
  inert: {
    opacity: 0.45,
  },
});

const variantStyles: Record<Variant, { container: ViewStyle; pressed: ViewStyle; label: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryPressed },
    label: { color: colors.textOnPrimary },
  },
  secondary: {
    container: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pressed: { backgroundColor: colors.surfacePressed },
    label: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: colors.surfaceAlt },
    label: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.dangerSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.danger },
    pressed: { backgroundColor: colors.danger },
    label: { color: colors.danger },
  },
};
