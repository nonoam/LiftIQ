import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, G, Ellipse, Circle } from 'react-native-svg';
import { MUSCLE_META, FREQUENCY_COLORS, setsToFrequencyLevel } from '@/constants/muscles';
import type { MuscleFrequency } from '@/types';

interface MuscleMapSVGProps {
  muscleFrequency: MuscleFrequency[];
  onMusclePress?: (slug: string) => void;
}

function getFrequencyColor(slug: string, frequencies: MuscleFrequency[]): string {
  const freq = frequencies.find((f) => f.slug === slug);
  if (!freq) return FREQUENCY_COLORS[0];
  const level = setsToFrequencyLevel(freq.setsThisWeek);
  return FREQUENCY_COLORS[level];
}

// Anterior (front) body map
function AnteriorBody({ frequencies, onPress }: {
  frequencies: MuscleFrequency[];
  onPress: (slug: string) => void;
}) {
  const c = (slug: string) => getFrequencyColor(slug, frequencies);

  return (
    <Svg viewBox="0 0 200 400" width={160} height={320}>
      {/* Head */}
      <Ellipse cx="100" cy="30" rx="22" ry="26" fill="#3F3F46" />

      {/* Neck */}
      <Path d="M92 54 L108 54 L110 68 L90 68 Z" fill="#3F3F46" />

      {/* Chest */}
      <Path
        d="M70 72 Q100 65 130 72 L135 110 Q100 118 65 110 Z"
        fill={c('chest')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('chest')}
      />

      {/* Left Shoulder (viewer's right) */}
      <Path
        d="M130 72 L148 68 L155 90 L136 100 Z"
        fill={c('shoulders')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('shoulders')}
      />
      {/* Right Shoulder (viewer's left) */}
      <Path
        d="M70 72 L52 68 L45 90 L64 100 Z"
        fill={c('shoulders')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('shoulders')}
      />

      {/* Left Bicep */}
      <Path
        d="M136 100 L154 96 L158 130 L140 132 Z"
        fill={c('biceps')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('biceps')}
      />
      {/* Right Bicep */}
      <Path
        d="M64 100 L46 96 L42 130 L60 132 Z"
        fill={c('biceps')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('biceps')}
      />

      {/* Left Forearm */}
      <Path
        d="M140 132 L158 130 L162 162 L144 160 Z"
        fill={c('forearms')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('forearms')}
      />
      {/* Right Forearm */}
      <Path
        d="M60 132 L42 130 L38 162 L56 160 Z"
        fill={c('forearms')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('forearms')}
      />

      {/* Abs */}
      <Path
        d="M78 110 Q100 118 122 110 L125 158 Q100 165 75 158 Z"
        fill={c('abs')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('abs')}
      />

      {/* Obliques */}
      <Path
        d="M65 112 L78 110 L75 158 L60 148 Z"
        fill={c('obliques')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('obliques')}
      />
      <Path
        d="M135 112 L122 110 L125 158 L140 148 Z"
        fill={c('obliques')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('obliques')}
      />

      {/* Left Quad */}
      <Path
        d="M100 165 L125 158 L128 230 L102 235 Z"
        fill={c('quads')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('quads')}
      />
      {/* Right Quad */}
      <Path
        d="M100 165 L75 158 L72 230 L98 235 Z"
        fill={c('quads')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('quads')}
      />

      {/* Left Calf (front) */}
      <Path
        d="M102 280 L124 275 L122 330 L104 332 Z"
        fill={c('calves')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('calves')}
      />
      {/* Right Calf (front) */}
      <Path
        d="M98 280 L76 275 L78 330 L96 332 Z"
        fill={c('calves')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('calves')}
      />

      {/* Knees */}
      <Ellipse cx="88" cy="258" rx="12" ry="10" fill="#3F3F46" />
      <Ellipse cx="112" cy="258" rx="12" ry="10" fill="#3F3F46" />

      {/* Shins */}
      <Path d="M100 268 L124 263 L122 282 L100 283 Z" fill="#3F3F46" />
      <Path d="M100 268 L76 263 L78 282 L100 283 Z" fill="#3F3F46" />

      {/* Feet */}
      <Ellipse cx="88" cy="345" rx="14" ry="7" fill="#3F3F46" />
      <Ellipse cx="112" cy="345" rx="14" ry="7" fill="#3F3F46" />

      {/* Serratus */}
      <Path
        d="M65 112 L60 148 L68 155 L72 118 Z"
        fill={c('serratus')}
        stroke="#27272A"
        strokeWidth="0.5"
        onPress={() => onPress('serratus')}
      />
      <Path
        d="M135 112 L140 148 L132 155 L128 118 Z"
        fill={c('serratus')}
        stroke="#27272A"
        strokeWidth="0.5"
        onPress={() => onPress('serratus')}
      />
    </Svg>
  );
}

// Posterior (back) body map
function PosteriorBody({ frequencies, onPress }: {
  frequencies: MuscleFrequency[];
  onPress: (slug: string) => void;
}) {
  const c = (slug: string) => getFrequencyColor(slug, frequencies);

  return (
    <Svg viewBox="0 0 200 400" width={160} height={320}>
      {/* Head */}
      <Ellipse cx="100" cy="30" rx="22" ry="26" fill="#3F3F46" />

      {/* Neck */}
      <Path d="M92 54 L108 54 L110 68 L90 68 Z" fill="#3F3F46" />

      {/* Traps */}
      <Path
        d="M90 68 L110 68 L135 80 L125 95 L100 85 L75 95 L65 80 Z"
        fill={c('traps')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('traps')}
      />

      {/* Left Shoulder (back) */}
      <Path
        d="M125 95 L148 68 L155 90 L136 108 Z"
        fill={c('shoulders')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('shoulders')}
      />
      {/* Right Shoulder (back) */}
      <Path
        d="M75 95 L52 68 L45 90 L64 108 Z"
        fill={c('shoulders')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('shoulders')}
      />

      {/* Rear Delts */}
      <Ellipse cx="138" cy="90" rx="10" ry="8" fill={c('rear-delts')} onPress={() => onPress('rear-delts')} />
      <Ellipse cx="62" cy="90" rx="10" ry="8" fill={c('rear-delts')} onPress={() => onPress('rear-delts')} />

      {/* Lats */}
      <Path
        d="M75 95 L65 80 L60 145 L78 158 L95 145 Z"
        fill={c('lats')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('lats')}
      />
      <Path
        d="M125 95 L135 80 L140 145 L122 158 L105 145 Z"
        fill={c('lats')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('lats')}
      />

      {/* Back (rhomboids/mid-back) */}
      <Path
        d="M75 95 L125 95 L122 158 L100 165 L78 158 Z"
        fill={c('back')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('back')}
      />

      {/* Lower back */}
      <Path
        d="M78 158 L122 158 L125 190 L100 195 L75 190 Z"
        fill={c('lower-back')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('lower-back')}
      />

      {/* Triceps */}
      <Path
        d="M136 108 L154 96 L158 130 L140 132 Z"
        fill={c('triceps')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('triceps')}
      />
      <Path
        d="M64 108 L46 96 L42 130 L60 132 Z"
        fill={c('triceps')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('triceps')}
      />

      {/* Forearms (back) */}
      <Path d="M140 132 L158 130 L162 162 L144 160 Z" fill={c('forearms')} stroke="#27272A" strokeWidth="1" onPress={() => onPress('forearms')} />
      <Path d="M60 132 L42 130 L38 162 L56 160 Z" fill={c('forearms')} stroke="#27272A" strokeWidth="1" onPress={() => onPress('forearms')} />

      {/* Glutes */}
      <Path
        d="M75 190 L100 195 L125 190 L128 235 L100 240 L72 235 Z"
        fill={c('glutes')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('glutes')}
      />

      {/* Hamstrings */}
      <Path
        d="M100 240 L128 235 L125 285 L103 288 Z"
        fill={c('hamstrings')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('hamstrings')}
      />
      <Path
        d="M100 240 L72 235 L75 285 L97 288 Z"
        fill={c('hamstrings')}
        stroke="#27272A"
        strokeWidth="1"
        onPress={() => onPress('hamstrings')}
      />

      {/* Calves */}
      <Path d="M103 288 L124 282 L122 335 L104 338 Z" fill={c('calves')} stroke="#27272A" strokeWidth="1" onPress={() => onPress('calves')} />
      <Path d="M97 288 L76 282 L78 335 L96 338 Z" fill={c('calves')} stroke="#27272A" strokeWidth="1" onPress={() => onPress('calves')} />

      {/* Knees (back) */}
      <Ellipse cx="88" cy="270" rx="12" ry="10" fill="#3F3F46" />
      <Ellipse cx="112" cy="270" rx="12" ry="10" fill="#3F3F46" />

      {/* Feet */}
      <Ellipse cx="88" cy="347" rx="14" ry="7" fill="#3F3F46" />
      <Ellipse cx="112" cy="347" rx="14" ry="7" fill="#3F3F46" />
    </Svg>
  );
}

export function MuscleMapSVG({ muscleFrequency, onMusclePress }: MuscleMapSVGProps) {
  const [view, setView] = useState<'anterior' | 'posterior'>('anterior');

  function handlePress(slug: string) {
    onMusclePress?.(slug);
  }

  return (
    <View className="gap-4">
      {/* View toggle */}
      <View className="flex-row bg-[#18181B] rounded-2xl p-1 mx-4">
        {(['anterior', 'posterior'] as const).map((v) => (
          <TouchableOpacity
            key={v}
            className={`flex-1 py-2 rounded-xl items-center ${view === v ? 'bg-primary' : ''}`}
            onPress={() => setView(v)}
          >
            <Text className={`text-sm font-semibold capitalize ${view === v ? 'text-white' : 'text-[#71717A]'}`}>
              {v === 'anterior' ? '↑ Front' : '↓ Back'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SVG Body */}
      <View className="items-center">
        {view === 'anterior' ? (
          <AnteriorBody frequencies={muscleFrequency} onPress={handlePress} />
        ) : (
          <PosteriorBody frequencies={muscleFrequency} onPress={handlePress} />
        )}
      </View>

      {/* Legend */}
      <View className="mx-4 flex-row items-center justify-center gap-3">
        <Text className="text-[#71717A] text-xs">None</Text>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <View
            key={level}
            className="w-5 h-5 rounded"
            style={{ backgroundColor: FREQUENCY_COLORS[level] }}
          />
        ))}
        <Text className="text-[#71717A] text-xs">High</Text>
      </View>

      {/* Tap hint */}
      <Text className="text-[#52525B] text-xs text-center">Tap a muscle for details</Text>
    </View>
  );
}
