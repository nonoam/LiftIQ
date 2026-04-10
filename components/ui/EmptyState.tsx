import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-16">
      {icon && <Text className="text-5xl">{icon}</Text>}
      <View className="items-center gap-2">
        <Text className="text-white text-xl font-bold text-center">{title}</Text>
        {description && (
          <Text className="text-[#A1A1AA] text-sm text-center leading-relaxed">{description}</Text>
        )}
      </View>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="md" />
      )}
    </View>
  );
}
