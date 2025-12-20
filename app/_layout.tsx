import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { GameColors } from '@/constants/theme';
import { loadCustomCategories } from '@/store/game-store';

// Keep splash screen visible briefly
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Load categories in background (non-blocking)
    loadCustomCategories().catch(() => {});

    // Hide splash screen immediately
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
