// Muscle group slug → display metadata mapping
// Kept in sync with seed.sql muscle_groups table

export const MUSCLE_META: Record<string, {
  label: string;
  labelEs: string;
  color: string;
  bodyRegion: 'upper' | 'lower' | 'core';
  bodySide: 'anterior' | 'posterior' | 'both';
}> = {
  chest:       { label: 'Chest',          labelEs: 'Pecho',              color: '#EF4444', bodyRegion: 'upper', bodySide: 'anterior'  },
  back:        { label: 'Back',           labelEs: 'Espalda',            color: '#3B82F6', bodyRegion: 'upper', bodySide: 'posterior' },
  shoulders:   { label: 'Shoulders',      labelEs: 'Hombros',            color: '#8B5CF6', bodyRegion: 'upper', bodySide: 'both'      },
  biceps:      { label: 'Biceps',         labelEs: 'Bíceps',             color: '#06B6D4', bodyRegion: 'upper', bodySide: 'anterior'  },
  triceps:     { label: 'Triceps',        labelEs: 'Tríceps',            color: '#F59E0B', bodyRegion: 'upper', bodySide: 'posterior' },
  forearms:    { label: 'Forearms',       labelEs: 'Antebrazos',         color: '#84CC16', bodyRegion: 'upper', bodySide: 'both'      },
  abs:         { label: 'Abs',            labelEs: 'Abdominales',        color: '#F97316', bodyRegion: 'core',  bodySide: 'anterior'  },
  obliques:    { label: 'Obliques',       labelEs: 'Oblicuos',           color: '#FB923C', bodyRegion: 'core',  bodySide: 'anterior'  },
  'lower-back':{ label: 'Lower Back',     labelEs: 'Lumbar',             color: '#A78BFA', bodyRegion: 'core',  bodySide: 'posterior' },
  quads:       { label: 'Quads',          labelEs: 'Cuádriceps',         color: '#EC4899', bodyRegion: 'lower', bodySide: 'anterior'  },
  hamstrings:  { label: 'Hamstrings',     labelEs: 'Isquiotibiales',     color: '#14B8A6', bodyRegion: 'lower', bodySide: 'posterior' },
  glutes:      { label: 'Glutes',         labelEs: 'Glúteos',            color: '#F43F5E', bodyRegion: 'lower', bodySide: 'posterior' },
  calves:      { label: 'Calves',         labelEs: 'Pantorrillas',       color: '#10B981', bodyRegion: 'lower', bodySide: 'posterior' },
  traps:       { label: 'Traps',          labelEs: 'Trapecios',          color: '#6366F1', bodyRegion: 'upper', bodySide: 'posterior' },
  lats:        { label: 'Lats',           labelEs: 'Dorsales',           color: '#0EA5E9', bodyRegion: 'upper', bodySide: 'posterior' },
  'rear-delts':{ label: 'Rear Delts',     labelEs: 'Deltoides Posterior',color: '#7C3AED', bodyRegion: 'upper', bodySide: 'posterior' },
  serratus:    { label: 'Serratus',       labelEs: 'Serrato',            color: '#0D9488', bodyRegion: 'upper', bodySide: 'anterior'  },
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell:        'Barbell',
  dumbbell:       'Dumbbell',
  cable:          'Cable',
  machine:        'Machine',
  smith_machine:  'Smith Machine',
  bodyweight:     'Bodyweight',
  kettlebell:     'Kettlebell',
  resistance_band:'Resistance Band',
  ez_bar:         'EZ Bar',
  trap_bar:       'Trap Bar',
  pull_up_bar:    'Pull-up Bar',
  dip_bars:       'Dip Bars',
  other:          'Other',
};

/** Frequency → opacity mapping for muscle map heatmap */
export const FREQUENCY_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'rgba(255,255,255,0.05)',   // untrained
  1: 'rgba(99,102,241,0.3)',     // low
  2: 'rgba(99,102,241,0.55)',    // moderate
  3: 'rgba(99,102,241,0.75)',    // good
  4: 'rgba(99,102,241,0.95)',    // high
};

/** Map sets/week to frequency level */
export function setsToFrequencyLevel(sets: number): 0 | 1 | 2 | 3 | 4 {
  if (sets === 0)  return 0;
  if (sets <= 5)   return 1;
  if (sets <= 10)  return 2;
  if (sets <= 15)  return 3;
  return 4;
}
