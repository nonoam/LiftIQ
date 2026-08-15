import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { signInWithEmail, signInWithGoogle } from '@/lib/auth';
import { isGoogleAuthEnabled } from '@/lib/env';
import { colors, spacing, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  async function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const { error: authError } = await signInWithEmail(email, password);
    // On success the auth listener swaps the navigator, so this screen
    // unmounts; only reset state when we are still here.
    if (authError) {
      setError(authError);
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const { error: authError } = await signInWithGoogle();
    if (authError) setError(authError);
    setBusy(false);
  }

  return (
    <Screen title="Entrar" subtitle="Accede a tus entrenos">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />

          <Link href="/(auth)/forgot-password" style={styles.forgot}>
            ¿Has olvidado la contraseña?
          </Link>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Entrar" size="lg" onPress={handleSubmit} disabled={!canSubmit} loading={busy} />

          {isGoogleAuthEnabled ? (
            <>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.line} />
              </View>
              <Button
                label="Continuar con Google"
                size="lg"
                variant="secondary"
                onPress={handleGoogle}
                disabled={busy}
                icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
              />
            </>
          ) : null}

          <Text style={styles.footer}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.link} onPress={() => router.replace('/(auth)/register')}>
              Crear una
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  forgot: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'right',
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textFaint,
  },
  footer: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
