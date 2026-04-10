import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <LinearGradient
        colors={['rgba(99,102,241,0.15)', 'transparent']}
        className="absolute top-0 left-0 right-0 h-80"
      />

      <View className="flex-1 px-6 pt-16 pb-8">
        {/* Logo + Hero */}
        <View className="flex-1 items-center justify-center gap-6">
          <View className="w-24 h-24 rounded-3xl bg-primary items-center justify-center">
            <Text className="text-5xl">🏋️</Text>
          </View>

          <View className="items-center gap-3">
            <Text className="text-5xl font-bold text-white tracking-tight">LiftIQ</Text>
            <Text className="text-lg text-[#A1A1AA] text-center leading-relaxed px-4">
              Track your strength. Visualize your progress.{'\n'}Predict your gains.
            </Text>
          </View>

          {/* Feature highlights */}
          <View className="mt-4 gap-3 w-full">
            {[
              { icon: '📊', text: 'AI-powered progression suggestions' },
              { icon: '💪', text: 'Visual muscle frequency map' },
              { icon: '📈', text: 'Detailed strength analytics' },
              { icon: '📱', text: 'Full offline support' },
            ].map(({ icon, text }) => (
              <View key={text} className="flex-row items-center gap-3 bg-[#18181B] rounded-2xl px-4 py-3">
                <Text className="text-xl">{icon}</Text>
                <Text className="text-[#A1A1AA] text-sm">{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center"
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">Get Started Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#27272A] rounded-2xl py-4 items-center"
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text className="text-white font-semibold text-base">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
