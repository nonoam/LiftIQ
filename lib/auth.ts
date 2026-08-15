import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

/**
 * Auth operations, with Supabase's English error strings mapped to Spanish.
 *
 * Everything returns `{ error: string | null }` instead of throwing: these are
 * expected outcomes of a form submission, not exceptional conditions, and the
 * screens all render the message the same way.
 */

export type AuthResult = { error: string | null };

const ERROR_MESSAGES: Record<string, string> = {
  'invalid login credentials': 'Email o contraseña incorrectos.',
  'email not confirmed': 'Confirma tu email antes de entrar. Revisa tu bandeja.',
  'user already registered': 'Ya existe una cuenta con ese email.',
  'password should be at least 6 characters':
    'La contraseña debe tener al menos 6 caracteres.',
  'unable to validate email address: invalid format': 'El email no tiene un formato válido.',
  'email rate limit exceeded': 'Demasiados intentos. Espera un momento y vuelve a probar.',
  'for security purposes, you can only request this after 60 seconds':
    'Por seguridad, espera 60 segundos antes de volver a intentarlo.',
};

function translate(message: string): string {
  const key = message.toLowerCase().trim();
  if (ERROR_MESSAGES[key]) return ERROR_MESSAGES[key];

  const partial = Object.keys(ERROR_MESSAGES).find((k) => key.includes(k));
  if (partial) return ERROR_MESSAGES[partial]!;

  // A network failure is by far the most common unmapped case, and in a gym
  // basement it is worth naming explicitly rather than showing a raw string.
  if (key.includes('network') || key.includes('fetch')) {
    return 'No hay conexión con el servidor. Comprueba tu red.';
  }
  return message;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return { error: error ? translate(error.message) : null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult & { needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    // Read by the handle_new_user() trigger to seed profiles.display_name.
    options: { data: { full_name: displayName.trim() } },
  });

  // Whether sign-up logs you straight in depends on the "Confirm email"
  // setting in Supabase, which differs between a local stack (off) and a
  // hosted project (on). Detect it instead of assuming, or the user is left
  // staring at a form that appeared to do nothing.
  return {
    error: error ? translate(error.message) : null,
    needsConfirmation: !error && !data.session,
  };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: Linking.createURL('/reset-password'),
  });
  return { error: error ? translate(error.message) : null };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return { error: error ? translate(error.message) : null };
}

/**
 * Google sign-in.
 *
 * Supabase hosts the OAuth flow, so the app never holds a Google client ID or
 * secret: we ask Supabase for the authorize URL, open it in the system auth
 * browser, and Google redirects back to `liftiq://` with tokens in the URL
 * fragment. `skipBrowserRedirect` is required because the default behaviour
 * targets a web page navigation, which does not exist on native.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectTo = Linking.createURL('/');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { error: translate(error.message) };
  if (!data?.url) return { error: 'No se pudo iniciar el flujo de Google.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    // Cancelling is a normal user action, not an error worth shouting about.
    return { error: result.type === 'cancel' || result.type === 'dismiss' ? null : 'No se pudo completar el acceso con Google.' };
  }

  const tokens = extractTokens(result.url);
  if (!tokens) return { error: 'Google no devolvió una sesión válida.' };

  const { error: sessionError } = await supabase.auth.setSession(tokens);
  return { error: sessionError ? translate(sessionError.message) : null };
}

/** Tokens come back in the URL fragment (#access_token=…&refresh_token=…). */
function extractTokens(url: string): { access_token: string; refresh_token: string } | null {
  const fragment = url.split('#')[1];
  if (!fragment) return null;

  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;

  return { access_token, refresh_token };
}
