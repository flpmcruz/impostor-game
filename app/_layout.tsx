import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { GameColors } from '@/constants/theme';
import { loadCustomCategories } from '@/store/game-store';

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom categories (with a safety timeout)
        await Promise.race([
          loadCustomCategories().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      } catch {
        // Ignore errors - app will work with default categories
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Small delay to ensure UI is mounted before hiding splash
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

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
