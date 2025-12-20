import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { GameColors } from '@/constants/theme';
import { loadCustomCategories } from '@/store/game-store';
import { debugLog, initDebugLogger, LogCategory, persistLogs } from '@/utils/debug-logger';

// Prevent splash screen from auto-hiding (with error handling)
debugLog.info(LogCategory.INIT, 'App module loading, preventing splash auto-hide');
SplashScreen.preventAutoHideAsync().catch((err) => {
  debugLog.warn(LogCategory.INIT, 'preventAutoHideAsync failed', { error: String(err) });
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      const startTime = Date.now();
      debugLog.info(LogCategory.INIT, 'RootLayout prepare() started');

      try {
        // Initialize debug logger first
        debugLog.info(LogCategory.INIT, 'Initializing debug logger...');
        await initDebugLogger();
        debugLog.info(LogCategory.INIT, 'Debug logger initialized');

        // Load custom categories before showing the app
        debugLog.info(LogCategory.INIT, 'Loading custom categories with 3s timeout...');
        const categoriesPromise = loadCustomCategories();
        const timeoutPromise = new Promise<'timeout'>((resolve) =>
          setTimeout(() => resolve('timeout'), 3000)
        );

        const result = await Promise.race([categoriesPromise, timeoutPromise]);

        if (result === 'timeout') {
          debugLog.warn(LogCategory.INIT, 'Categories loading timed out after 3s');
        } else {
          debugLog.info(LogCategory.INIT, 'Categories loaded successfully');
        }
      } catch (err) {
        debugLog.error(LogCategory.INIT, 'Error in prepare()', { error: String(err) });
      } finally {
        const elapsed = Date.now() - startTime;
        debugLog.info(LogCategory.INIT, `prepare() completed in ${elapsed}ms`);
        await persistLogs();
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Add a small delay to ensure the UI is fully mounted before hiding splash
      const timer = setTimeout(() => {
        debugLog.info(LogCategory.INIT, 'App is ready, hiding splash screen');
        SplashScreen.hideAsync()
          .then(() => {
            debugLog.info(LogCategory.INIT, 'Splash screen hidden successfully');
            persistLogs();
          })
          .catch((err) => {
            debugLog.warn(LogCategory.INIT, 'hideAsync failed', { error: String(err) });
          });
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    debugLog.debug(LogCategory.INIT, 'Rendering null (app not ready)');
    return null;
  }

  debugLog.debug(LogCategory.INIT, 'Rendering app content');

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
