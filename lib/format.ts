import { differenceInCalendarDays, format, isThisYear } from 'date-fns';
import { es } from 'date-fns/locale';

import { formatWeightValue, kgToDisplay } from '@/lib/units';
import type { WeightUnit } from '@/types/models';

/** "1h 12min", "48min", "35s" — no leading zeros, no useless units. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds < 0) return '—';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return `${totalSeconds}s`;
}

/** mm:ss, for the live session clock. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * Date headers for the history list. Recent days get a relative label because
 * "Ayer" is instantly readable in a way "12 de agosto" is not.
 */
export function formatDayHeading(iso: string): string {
  const date = new Date(iso);
  const days = differenceInCalendarDays(new Date(), date);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return capitalise(format(date, 'EEEE', { locale: es }));
  if (isThisYear(date)) return capitalise(format(date, "d 'de' MMMM", { locale: es }));
  return capitalise(format(date, "d 'de' MMMM yyyy", { locale: es }));
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

/** "80 kg × 8 @ RIR 2" — the canonical way a set reads across the app. */
export function formatSet(
  weightKg: number | null,
  reps: number | null,
  rir: number | null,
  unit: WeightUnit,
): string {
  const parts: string[] = [];
  if (weightKg != null) parts.push(`${formatWeightValue(kgToDisplay(weightKg, unit))} ${unit}`);
  if (reps != null) parts.push(`× ${reps}`);
  const base = parts.length > 0 ? parts.join(' ') : '—';
  return rir != null ? `${base} @ RIR ${rir}` : base;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "3 series", "1 serie" — Spanish plurals, done in one place. */
export function pluralise(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
