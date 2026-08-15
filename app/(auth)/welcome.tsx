import { Link, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.logo}>LiftIQ</Text>
        <Text style={styles.tagline}>
          Registra series, repeticiones y RIR.{'\n'}Y mira cómo progresas de verdad.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Crear cuenta" size="lg" onPress={() => router.push('/(auth)/register')} />
        <Button
          label="Ya tengo cuenta"
          size="lg"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
        />
        <Text style={styles.legal}>
          Tus entrenos se guardan en tu cuenta y solo tú puedes verlos.{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Entrar
          </Link>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  logo: {
    ...typography.display,
    fontSize: 44,
    color: colors.text,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  legal: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  link: {
    color: colors.primary,
  },
});
