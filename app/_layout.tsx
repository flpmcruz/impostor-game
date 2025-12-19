import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { GameColors } from '@/constants/theme';
import { loadCustomCategories } from '@/store/game-store';

// Prevent splash screen from auto-hiding (with error handling)
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen may not be available
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom categories before showing the app
        await Promise.race([
          loadCustomCategories(),
          // Timeout after 3 seconds to prevent infinite loading
          new Promise<void>((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch {
        // Continue anyway - app will use defaults
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen once app is ready (with error handling)
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors - splash screen may already be hidden
      });
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
