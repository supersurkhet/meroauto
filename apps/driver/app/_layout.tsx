import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ConvexProvider } from 'convex/react';
import { convex } from '../lib/convex';
import { ThemeProvider, useTheme } from '../lib/providers/theme';
import { AuthProvider } from '../lib/providers/auth';
import { DriverProvider } from '../lib/providers/driver';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '../lib/notifications';
import { router } from 'expo-router';
import '../lib/i18n';

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  // Set up push notifications on mount
  useEffect(() => {
    registerForPushNotifications().catch(() => {});

    // Handle notification taps — navigate to ride screen
    const subscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.rideId) {
        router.push(`/ride/${data.rideId}` as any);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="ride/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="ride/request"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary fallbackTitle="MeroAuto Driver crashed">
      <ConvexProvider client={convex}>
        <ThemeProvider>
          <AuthProvider>
            <DriverProvider>
              <RootLayoutNav />
            </DriverProvider>
          </AuthProvider>
        </ThemeProvider>
      </ConvexProvider>
    </ErrorBoundary>
  );
}
