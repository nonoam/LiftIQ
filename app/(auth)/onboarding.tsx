import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Goal, ExperienceLevel } from '@/types/database';

type Step = 'goal' | 'experience';

const GOALS: { value: Goal; label: string; icon: string; desc: string }[] = [
  { value: 'strength',    label: 'Strength',    icon: '🏆', desc: 'Maximize 1RM, heavy compound lifts' },
  { value: 'hypertrophy', label: 'Hypertrophy',  icon: '💪', desc: 'Build muscle size and definition' },
  { value: 'endurance',   label: 'Endurance',    icon: '⚡', desc: 'High volume, conditioning, stamina' },
];

const LEVELS: { value: ExperienceLevel; label: string; icon: string; desc: string }[] = [
  { value: 'beginner',     label: 'Beginner',     icon: '🌱', desc: 'Less than 1 year of training' },
  { value: 'intermediate', label: 'Intermediate', icon: '🔥', desc: '1-3 years of consistent training' },
  { value: 'advanced',     label: 'Advanced',     icon: '⚡', desc: '3+ years, familiar with periodization' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [loading, setLoading] = useState(false);

  const user = useAuthStore((s) => s.user);

  async function handleFinish() {
    if (!goal || !level || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ goal, experience_level: level, onboarding_complete: true } as never)
        .eq('id', user.id);
      if (error) throw error;
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <View className="flex-1 px-6 pt-8 pb-8 gap-8">
        {/* Progress */}
        <View className="flex-row gap-2">
          <View className={`h-1 flex-1 rounded-full ${step === 'goal' || step === 'experience' ? 'bg-primary' : 'bg-[#27272A]'}`} />
          <View className={`h-1 flex-1 rounded-full ${step === 'experience' ? 'bg-primary' : 'bg-[#27272A]'}`} />
        </View>

        {step === 'goal' && (
          <View className="gap-6 flex-1">
            <View className="gap-2">
              <Text className="text-3xl font-bold text-white">What's your goal?</Text>
              <Text className="text-[#A1A1AA]">This helps us personalize your experience</Text>
            </View>

            <View className="gap-3 flex-1">
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  className={`rounded-2xl p-5 border-2 ${goal === g.value ? 'border-primary bg-primary/10' : 'border-[#27272A] bg-[#18181B]'}`}
                  onPress={() => setGoal(g.value)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center gap-4">
                    <Text className="text-3xl">{g.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">{g.label}</Text>
                      <Text className="text-[#A1A1AA] text-sm mt-0.5">{g.desc}</Text>
                    </View>
                    {goal === g.value && (
                      <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className={`rounded-2xl py-4 items-center ${!goal ? 'bg-[#27272A]' : 'bg-primary'}`}
              onPress={() => goal && setStep('experience')}
              disabled={!goal}
              activeOpacity={0.85}
            >
              <Text className={`font-bold text-base ${!goal ? 'text-[#71717A]' : 'text-white'}`}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'experience' && (
          <View className="gap-6 flex-1">
            <View className="gap-2">
              <Text className="text-3xl font-bold text-white">Your experience level?</Text>
              <Text className="text-[#A1A1AA]">We'll tailor progression recommendations</Text>
            </View>

            <View className="gap-3 flex-1">
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l.value}
                  className={`rounded-2xl p-5 border-2 ${level === l.value ? 'border-primary bg-primary/10' : 'border-[#27272A] bg-[#18181B]'}`}
                  onPress={() => setLevel(l.value)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center gap-4">
                    <Text className="text-3xl">{l.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">{l.label}</Text>
                      <Text className="text-[#A1A1AA] text-sm mt-0.5">{l.desc}</Text>
                    </View>
                    {level === l.value && (
                      <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View className="gap-3">
              <TouchableOpacity
                className={`rounded-2xl py-4 items-center ${(!level || loading) ? 'bg-[#27272A]' : 'bg-primary'}`}
                onPress={handleFinish}
                disabled={!level || loading}
                activeOpacity={0.85}
              >
                <Text className={`font-bold text-base ${(!level || loading) ? 'text-[#71717A]' : 'text-white'}`}>
                  {loading ? 'Saving...' : "Let's Go! 🚀"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('goal')} className="items-center py-2">
                <Text className="text-[#A1A1AA]">← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
