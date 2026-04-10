import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
}

export function ScreenHeader({ title, subtitle, showBack = false, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-4">
      <View className="flex-row items-center gap-3 flex-1">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} className="pr-2">
            <Text className="text-primary text-base">←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text className="text-white text-xl font-bold">{title}</Text>
          {subtitle && <Text className="text-[#A1A1AA] text-sm">{subtitle}</Text>}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress}>
          <Text className="text-primary font-semibold">{rightAction.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
