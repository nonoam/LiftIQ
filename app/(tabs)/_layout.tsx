import { Tabs } from 'expo-router';
import { TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/stores/workoutStore';

function TabBarIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    index:     '🏠',
    exercises: '📋',
    routines:  '📅',
    history:   '📊',
    profile:   '👤',
  };
  return <Text style={{ fontSize: 22, opacity: color === '#6366F1' ? 1 : 0.5 }}>{icons[name]}</Text>;
}

export default function TabsLayout() {
  const workout = useWorkoutStore((s) => s.workout);

  return (
    <>
      {/* Active workout floating button */}
      {workout && (
        <TouchableOpacity
          className="absolute bottom-24 right-4 z-50 bg-primary rounded-2xl px-4 py-3 flex-row items-center gap-2 shadow-lg"
          onPress={() => router.push(`/workout/${workout.sessionId}`)}
          activeOpacity={0.9}
        >
          <View className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <Text className="text-white font-bold text-sm">Workout Active</Text>
        </TouchableOpacity>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#18181B',
            borderTopColor: '#27272A',
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 16,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#6366F1',
          tabBarInactiveTintColor: '#71717A',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <TabBarIcon name="index" color={color} />,
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: 'Exercises',
            tabBarIcon: ({ color }) => <TabBarIcon name="exercises" color={color} />,
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: 'Routines',
            tabBarIcon: ({ color }) => <TabBarIcon name="routines" color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="profile" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
