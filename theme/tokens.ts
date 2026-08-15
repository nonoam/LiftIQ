import type { TextStyle } from 'react-native';

/**
 * Design tokens. Single source of truth for colour, spacing and type.
 *
 * The app is dark-only by design: it is used in gyms, often in low light,
 * and a single palette keeps every screen consistent without a theme switch.
 */

export const colors = {
  // Surfaces, from furthest back to closest to the user.
  bg: '#0B0F14',
  surface: '#131A22',
  surfaceAlt: '#1B242E',
  surfacePressed: '#232F3B',
  border: '#26313D',
  borderStrong: '#364453',

  // Text.
  text: '#E8EDF2',
  textMuted: '#8A99A8',
  textFaint: '#5A6976',
  textOnPrimary: '#FFFFFF',

  // Brand + intent.
  primary: '#4C82F7',
  primaryPressed: '#3A6FE0',
  primarySoft: '#17253C',
  success: '#3DD68C',
  successSoft: '#122C22',
  danger: '#F2555A',
  dangerSoft: '#2E1519',
  warning: '#F5A524',
  warningSoft: '#2E2311',
} as const;

/**
 * Colour scale for RIR (reps in reserve).
 *
 * Low RIR means the set was taken close to failure, so the scale runs
 * hot (red) at 0 and cools down as reps in reserve grow. Anything at or
 * above 4 is "easy" and shares the neutral end of the scale.
 */
export function rirColor(rir: number | null | undefined): string {
  if (rir == null) return colors.textFaint;
  if (rir <= 0) return colors.danger;
  if (rir <= 1) return '#F5793B';
  if (rir <= 2) return colors.warning;
  if (rir <= 3) return colors.success;
  return colors.textMuted;
}

/** 4px base scale. Use these instead of raw numbers. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/**
 * Typed as TextStyle rather than `as const`: a const assertion makes
 * `fontVariant` a readonly tuple, which React Native's style prop rejects.
 */
type TypeScale =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'numeric';

export const typography: Record<TypeScale, TextStyle> = {
  display: { fontSize: 32, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '400' },
  /** Tabular figures keep weight/rep columns from jittering as digits change. */
  numeric: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
};

/** Minimum touch target. The live-workout screen is used one-handed, mid-set. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH = 44;
