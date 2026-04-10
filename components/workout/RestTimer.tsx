import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '@/stores/workoutStore';
import { formatRestTime } from '@/lib/utils';
import { scheduleRestEndNotification, cancelRestEndNotification } from '@/lib/notifications';
import { useSettingsStore } from '@/stores/settingsStore';

export function RestTimer() {
  const { isRestTimerActive, restSecondsLeft, stopRestTimer } = useWorkoutStore();
  const haptic = useSettingsStore((s) => s.hapticFeedback);
  const notifIdRef = useRef<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRestTimerActive) {
      // Schedule end notification
      scheduleRestEndNotification(restSecondsLeft).then((id) => {
        notifIdRef.current = id;
      });

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (notifIdRef.current) {
        cancelRestEndNotification(notifIdRef.current);
        notifIdRef.current = null;
      }
    }
  }, [isRestTimerActive]);

  useEffect(() => {
    if (isRestTimerActive && restSecondsLeft === 0 && haptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [restSecondsLeft, isRestTimerActive, haptic]);

  if (!isRestTimerActive) return null;

  const progress = restSecondsLeft > 0 ? restSecondsLeft : 0;
  const isUrgent = restSecondsLeft <= 10;

  return (
    <Animated.View
      style={{ transform: [{ scale: pulseAnim }] }}
      className={`mx-4 rounded-2xl p-4 flex-row items-center gap-4 ${isUrgent ? 'bg-[#EF4444]/20 border border-[#EF4444]/40' : 'bg-[#22C55E]/20 border border-[#22C55E]/40'}`}
    >
      <View className="flex-1">
        <Text className={`font-bold text-sm ${isUrgent ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
          ⏱ Rest Timer
        </Text>
        <Text className={`text-3xl font-bold mt-0.5 ${isUrgent ? 'text-[#EF4444]' : 'text-white'}`}>
          {formatRestTime(progress)}
        </Text>
      </View>

      <TouchableOpacity
        className="bg-[#27272A] rounded-xl px-4 py-2"
        onPress={stopRestTimer}
      >
        <Text className="text-white text-sm font-semibold">Skip</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
