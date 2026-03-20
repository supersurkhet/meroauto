import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ConvexProvider } from 'convex/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { RiderProvider } from '@/lib/rider';
import { NetworkProvider } from '@/lib/network';
import { ToastProvider } from '@/lib/toast';
import { convex } from '@/lib/convex';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import '@/lib/i18n';

function RootLayoutInner() {
  const { c, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="booking/index"
          options={{ presentation: 'card', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="booking/confirm"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="ride/matching"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen
          name="ride/tracking"
          options={{ presentation: 'card', gestureEnabled: false }}
        />
        <Stack.Screen
          name="ride/payment"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="ride/rating"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="ride/details"
          options={{ presentation: 'card' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ConvexProvider client={convex}>
            <ThemeProvider>
              <NetworkProvider>
                <ToastProvider>
                  <AuthProvider>
                    <RiderProvider>
                      <RootLayoutInner />
                    </RiderProvider>
                  </AuthProvider>
                </ToastProvider>
              </NetworkProvider>
            </ThemeProvider>
          </ConvexProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
