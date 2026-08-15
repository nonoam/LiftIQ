import { StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Tab screens keep the bottom edge free; the tab bar already covers it. */
  edges?: readonly Edge[];
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({
  children,
  title,
  subtitle,
  right,
  edges = ['top'],
  padded = true,
  style,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      <View style={[styles.body, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  body: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
