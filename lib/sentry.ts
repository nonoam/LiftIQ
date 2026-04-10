import * as SentryExpo from '@sentry/react-native';

export function initSentry(): void {
  SentryExpo.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__,
    integrations: [
      SentryExpo.reactNativeTracingIntegration(),
    ],
  });
}

export function setSentryUser(userId: string, email?: string): void {
  SentryExpo.setUser({ id: userId, email });
}

export function clearSentryUser(): void {
  SentryExpo.setUser(null);
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[Sentry]', error, context);
    return;
  }
  SentryExpo.captureException(error, { extra: context });
}

export const Sentry = SentryExpo;
