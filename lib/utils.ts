import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// ─── 1RM Calculations ─────────────────────────────────────────────────────────

export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round((weight * (1 + reps / 30)) * 10) / 10;
}

export function brzycki1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) return weight;
  return Math.round((weight * (36 / (37 - reps))) * 10) / 10;
}

export function estimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(((epley1RM(weight, reps) + brzycki1RM(weight, reps)) / 2) * 10) / 10;
}

// ─── Volume ────────────────────────────────────────────────────────────────────

export function calculateVolume(weight: number, reps: number): number {
  return Math.round(weight * reps * 10) / 10;
}

// ─── Weight conversion ─────────────────────────────────────────────────────────

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  const value = unit === 'lbs' ? kgToLbs(kg) : kg;
  return `${value} ${unit}`;
}

// ─── Duration formatting ────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Date formatting ─────────────────────────────────────────────────────────────

export function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// ─── Plateau detection ───────────────────────────────────────────────────────────

export interface WeeklyBest1RM {
  weekStart: string;
  best1RM: number;
}

/** Returns true if no progress in last `weeks` consecutive weeks */
export function detectPlateau(history: WeeklyBest1RM[], weeks = 3): boolean {
  if (history.length < weeks) return false;
  const recent = history.slice(-weeks);
  const first = recent[0]?.best1RM ?? 0;
  return recent.every((w) => w.best1RM <= first * 1.01); // < 1% improvement
}

// ─── RPE helpers ────────────────────────────────────────────────────────────────

export function rpeLabel(rpe: number): string {
  const labels: Record<number, string> = {
    10: 'Max effort',
    9.5: 'Could not do more',
    9: '1 rep left',
    8.5: '1-2 reps left',
    8: '2 reps left',
    7.5: '2-3 reps left',
    7: '3 reps left',
    6: '4+ reps left',
  };
  return labels[rpe] ?? `RPE ${rpe}`;
}

// ─── Misc ────────────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round weight to nearest increment (e.g. 2.5 for barbells) */
export function roundToIncrement(value: number, increment = 2.5): number {
  return Math.round(value / increment) * increment;
}
