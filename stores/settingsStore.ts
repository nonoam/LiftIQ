import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeightUnit, Theme, ProgressionType } from '@/types/database';

interface SettingsState {
  weightUnit: WeightUnit;
  theme: Theme;
  defaultRestSeconds: number;
  progressionType: ProgressionType;
  hapticFeedback: boolean;
  keepScreenOn: boolean;

  setWeightUnit: (unit: WeightUnit) => void;
  setTheme: (theme: Theme) => void;
  setDefaultRestSeconds: (s: number) => void;
  setProgressionType: (type: ProgressionType) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setKeepScreenOn: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weightUnit: 'kg',
      theme: 'dark',
      defaultRestSeconds: 90,
      progressionType: 'linear',
      hapticFeedback: true,
      keepScreenOn: true,

      setWeightUnit:       (weightUnit)       => set({ weightUnit }),
      setTheme:            (theme)            => set({ theme }),
      setDefaultRestSeconds: (defaultRestSeconds) => set({ defaultRestSeconds }),
      setProgressionType:  (progressionType)  => set({ progressionType }),
      setHapticFeedback:   (hapticFeedback)   => set({ hapticFeedback }),
      setKeepScreenOn:     (keepScreenOn)     => set({ keepScreenOn }),
    }),
    {
      name: 'liftiq:settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
