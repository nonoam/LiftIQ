import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { MIN_TOUCH, colors, radius, spacing, typography } from '@/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, hint, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textFaint}
        // Without this the OS renders a light keyboard over a dark app.
        keyboardAppearance="dark"
        style={[styles.input, focused && styles.inputFocused, error ? styles.inputError : null, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        accessibilityLabel={label}
        {...rest}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  input: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    ...typography.body,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
