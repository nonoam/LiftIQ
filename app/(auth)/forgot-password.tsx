import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { sendPasswordReset } from '@/lib/auth';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (email.trim().length === 0 || busy) return;
    setBusy(true);
    setError(null);
    const { error: authError } = await sendPasswordReset(email);
    if (authError) setError(authError);
    else setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <Screen title="Enlace enviado">
        <EmptyState
          title="Revisa tu correo"
          message={`Si existe una cuenta con ${email.trim()}, recibirás un enlace para restablecer la contraseña.`}
          actionLabel="Volver a entrar"
          onAction={() => router.replace('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Recuperar acceso" subtitle="Te enviaremos un enlace">
      <View style={styles.content}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Enviar enlace"
          size="lg"
          onPress={handleSubmit}
          disabled={email.trim().length === 0 || busy}
          loading={busy}
        />
        <Button label="Volver" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
});
