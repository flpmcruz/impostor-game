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
// Splash screen is handled inside RootLayout to ensure proper sequencing

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      const startTime = Date.now();

      try {
        // Enforce a maximum initialization time of 4 seconds to prevent getting stuck
        await Promise.race([
          (async () => {
            // 1. Prevent auto-hide immediately inside the component life-cycle
            await SplashScreen.preventAutoHideAsync().catch(() => { });

            // 2. Initialize debug logger
            debugLog.info(LogCategory.INIT, 'RootLayout prepare() started');
            debugLog.info(LogCategory.INIT, 'Initializing debug logger...');
            await initDebugLogger().catch(err => console.log('Logger init failed', err));
            debugLog.info(LogCategory.INIT, 'Debug logger initialized');

            // 3. Load custom categories with 3s timeout (internal timeout)
            debugLog.info(LogCategory.INIT, 'Loading custom categories...');
            const categoriesPromise = loadCustomCategories();
            const categoriesTimeout = new Promise<'timeout'>((resolve) =>
              setTimeout(() => resolve('timeout'), 2500)
            );

            const result = await Promise.race([categoriesPromise, categoriesTimeout]);

            if (result === 'timeout') {
              debugLog.warn(LogCategory.INIT, 'Categories loading timed out');
            } else {
              debugLog.info(LogCategory.INIT, 'Categories loaded successfully');
            }
          })(),
          new Promise((resolve) => setTimeout(resolve, 4000))
        ]);

      } catch (err) {
        // This catch block handles errors in the race or unexpected crashes
        debugLog.error(LogCategory.INIT, 'Error in prepare()', { error: String(err) });
      } finally {
        const elapsed = Date.now() - startTime;
        debugLog.info(LogCategory.INIT, `prepare() completed in ${elapsed}ms`);
        // Don't await persistLogs here to avoid blocking IO
        persistLogs().catch(() => { });
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
