// AsyncStorage helpers for offline-first workout state
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  activeWorkout:   'liftiq:active_workout',
  pendingSessions: 'liftiq:pending_sessions',
  settings:        'liftiq:settings',
} as const;

export const storage = {
  async getActiveWorkout<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(KEYS.activeWorkout);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async setActiveWorkout<T>(data: T): Promise<void> {
    await AsyncStorage.setItem(KEYS.activeWorkout, JSON.stringify(data));
  },
  async clearActiveWorkout(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.activeWorkout);
  },

  async getPendingSessions<T>(): Promise<T[]> {
    const raw = await AsyncStorage.getItem(KEYS.pendingSessions);
    return raw ? (JSON.parse(raw) as T[]) : [];
  },
  async addPendingSession<T>(session: T): Promise<void> {
    const existing = await storage.getPendingSessions<T>();
    await AsyncStorage.setItem(
      KEYS.pendingSessions,
      JSON.stringify([...existing, session])
    );
  },
  async clearPendingSession(sessionId: string): Promise<void> {
    const existing = await storage.getPendingSessions<{ id: string }>();
    await AsyncStorage.setItem(
      KEYS.pendingSessions,
      JSON.stringify(existing.filter((s) => s.id !== sessionId))
    );
  },

  async getSettings<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(KEYS.settings);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async setSettings<T>(data: T): Promise<void> {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(data));
  },
};
