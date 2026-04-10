import { View, Text } from 'react-native';

type Color = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  color?: Color;
  size?: 'sm' | 'md';
}

const bgClasses: Record<Color, string> = {
  primary: 'bg-primary/20',
  success: 'bg-[#22C55E]/20',
  warning: 'bg-[#F59E0B]/20',
  error:   'bg-[#EF4444]/20',
  neutral: 'bg-[#3F3F46]',
};

const textClasses: Record<Color, string> = {
  primary: 'text-primary',
  success: 'text-[#22C55E]',
  warning: 'text-[#F59E0B]',
  error:   'text-[#EF4444]',
  neutral: 'text-[#A1A1AA]',
};

export function Badge({ label, color = 'neutral', size = 'md' }: BadgeProps) {
  return (
    <View className={`self-start rounded-lg ${bgClasses[color]} ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
      <Text className={`${textClasses[color]} font-semibold ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
        {label}
      </Text>
    </View>
  );
}
