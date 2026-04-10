/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand
        primary:   { DEFAULT: '#6366F1', dark: '#4F46E5', light: '#818CF8' },
        secondary: { DEFAULT: '#EC4899', dark: '#DB2777', light: '#F472B6' },
        // Neutrals (zinc)
        surface: {
          DEFAULT: '#18181B',
          card:    '#27272A',
          input:   '#3F3F46',
          border:  '#52525B',
        },
        // Text
        text: {
          DEFAULT:   '#FAFAFA',
          secondary: '#A1A1AA',
          muted:     '#71717A',
        },
        // Status
        success:  '#22C55E',
        warning:  '#F59E0B',
        error:    '#EF4444',
        info:     '#3B82F6',
        // Muscle groups
        muscle: {
          chest:      '#EF4444',
          back:       '#3B82F6',
          shoulders:  '#8B5CF6',
          biceps:     '#06B6D4',
          triceps:    '#F59E0B',
          forearms:   '#84CC16',
          abs:        '#F97316',
          obliques:   '#FB923C',
          lowerback:  '#A78BFA',
          quads:      '#EC4899',
          hamstrings: '#14B8A6',
          glutes:     '#F43F5E',
          calves:     '#10B981',
          traps:      '#6366F1',
          lats:       '#0EA5E9',
          reardelts:  '#7C3AED',
          serratus:   '#0D9488',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'System'],
        mono:  ['JetBrainsMono', 'Courier'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
