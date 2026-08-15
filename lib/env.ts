/**
 * Environment configuration.
 *
 * Only EXPO_PUBLIC_* variables reach the client bundle, and Expo inlines them
 * at build time — so they must be referenced as full static property accesses
 * (`process.env.EXPO_PUBLIC_FOO`). Destructuring or dynamic lookup breaks the
 * substitution and yields undefined at runtime.
 *
 * See .env.example for how to obtain each value.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}.\n` +
        'Copia .env.example a .env y rellena los valores, luego reinicia el ' +
        'bundler con: npx expo start --clear',
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    'EXPO_PUBLIC_SUPABASE_URL',
  ),
  supabaseAnonKey: required(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ),
};

/**
 * Google sign-in is optional. The OAuth flow is hosted by Supabase, so the
 * app holds no Google credentials at all — this flag only decides whether the
 * button is shown, and stays false until the provider is configured in the
 * Supabase dashboard (see .env.example).
 */
export const isGoogleAuthEnabled = process.env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
