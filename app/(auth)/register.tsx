import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { signUpWithEmail } from '@/lib/auth';
import { colors, spacing, typography } from '@/theme/tokens';

const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    !busy;

  async function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    const { error: authError, needsConfirmation } = await signUpWithEmail(email, password, name);

    if (authError) {
      setError(authError);
      setBusy(false);
      return;
    }
    if (needsConfirmation) {
      setAwaitingConfirmation(true);
      setBusy(false);
    }
    // Otherwise the session is live and the root navigator takes over.
  }

  if (awaitingConfirmation) {
    return (
      <Screen title="Revisa tu email">
        <EmptyState
          title="Te hemos enviado un enlace"
          message={`Confirma tu cuenta desde el email que hemos mandado a ${email.trim()} y vuelve para entrar.`}
          actionLabel="Ir a entrar"
          onAction={() => router.replace('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Crear cuenta" subtitle="Tus entrenos, en tu cuenta">
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
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="¿Cómo te llamamos?"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            error={passwordTooShort ? `Al menos ${MIN_PASSWORD_LENGTH} caracteres.` : null}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Crear cuenta"
            size="lg"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={busy}
          />

          <Text style={styles.footer}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.link} onPress={() => router.replace('/(auth)/login')}>
              Entrar
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
  error: {
    ...typography.body,
    color: colors.danger,
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
