import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { GameColors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: GameColors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="settings"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </View>
  );
}
