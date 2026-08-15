import type { WeightUnit } from '@/types/models';

/**
 * Weight conversion and plate rounding.
 *
 * The database stores kilograms, always. Pounds is a display preference only,
 * so every value crosses this module on the way in and on the way out. That
 * keeps analytics unambiguous and avoids rows whose unit depends on whatever
 * the user's setting happened to be that day.
 */

const KG_PER_LB = 0.45359237;

/** Smallest change you can actually make on a bar, per unit. */
export const WEIGHT_STEP: Record<WeightUnit, number> = {
  kg: 2.5,
  lb: 5,
};

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB;
}

/**
 * Round to the nearest loadable increment.
 *
 * Converting 80 kg to pounds gives 176.37 lb, which no one can load. Snapping
 * to the unit's step keeps the number honest about what happens in the gym.
 */
export function roundToStep(value: number, unit: WeightUnit): number {
  const step = WEIGHT_STEP[unit];
  return Math.round(value / step) * step;
}

/**
 * Trim trailing zeros: 80 not "80.00", but keep 82.5 intact. Weights on the
 * live screen are scanned at a glance, and pointless decimals add noise.
 */
export function formatWeightValue(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

/** "80 kg" — kilos from the database rendered in the user's unit. */
export function formatWeight(kg: number | null | undefined, unit: WeightUnit): string {
  if (kg == null) return '—';
  return `${formatWeightValue(kgToDisplay(kg, unit))} ${unit}`;
}

/**
 * Parse what the user typed. Accepts both decimal separators, because a
 * Spanish keyboard offers a comma and the numeric keypad offers a dot.
 */
export function parseWeightInput(text: string): number | null {
  const normalised = text.replace(',', '.').trim();
  if (normalised === '') return null;
  const value = Number(normalised);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseIntInput(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Estimated 1RM adjusted for reps in reserve.
 *
 * Epley on the raw reps assumes the set was taken to failure. A set of 8 with
 * 3 RIR is not an 8-rep max, it is roughly an 11-rep effort, so treating the
 * reps as `reps + rir` is much closer to the truth. Sets already at failure
 * (rir 0) fall back to plain Epley.
 */
export function estimate1RM(
  weightKg: number | null,
  reps: number | null,
  rir: number | null,
): number | null {
  if (weightKg == null || reps == null || reps <= 0 || weightKg <= 0) return null;
  const effectiveReps = reps + (rir ?? 0);
  if (effectiveReps === 1) return weightKg;
  return weightKg * (1 + effectiveReps / 30);
}

/** Volume ignores warm-ups; counting them hides real progression. */
export function setVolumeKg(weightKg: number | null, reps: number | null): number {
  if (weightKg == null || reps == null) return 0;
  return weightKg * reps;
}
