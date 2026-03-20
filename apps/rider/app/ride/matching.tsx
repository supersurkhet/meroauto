import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useRider } from '@/lib/rider';
import { useQuery, useMutation, api } from '@/lib/convex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';

function MatchingScreenInner() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { riderId } = useRider();
  const params = useLocalSearchParams<{ requestId?: string }>();

  const cancelRideRequest = useMutation(api.rideRequests.cancelRideRequest);

  // Subscribe to ride request status
  const request = useQuery(
    api.rideRequests.getRideRequestById,
    params.requestId ? { requestId: params.requestId } : 'skip'
  );

  // Also check for active ride (when request becomes accepted and ride is created)
  const activeRide = useQuery(
    api.rides.getActiveRideForRider,
    riderId ? { riderId } : 'skip'
  );

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    createPulse(pulseAnim1, 0).start();
    createPulse(pulseAnim2, 700).start();
    createPulse(pulseAnim3, 1400).start();
  }, []);

  // Navigate when ride is created (request accepted → ride exists)
  useEffect(() => {
    if (activeRide) {
      router.replace({
        pathname: '/ride/tracking',
        params: { rideId: activeRide._id },
      });
    }
  }, [activeRide]);

  // Handle request status changes
  const status = request?.status;
  const isExpired = status === 'expired';
  const isCancelled = status === 'cancelled';
  const isMatched = status === 'matched';
  const isSearching = status === 'pending';

  const handleCancel = async () => {
    if (params.requestId) {
      try {
        await cancelRideRequest({ requestId: params.requestId as any });
      } catch {
        // May already be cancelled/expired
      }
    }
    router.back();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderPulseRing = (anim: Animated.Value) => (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          borderColor: c.primary,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) },
          ],
        },
      ]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          {renderPulseRing(pulseAnim1)}
          {renderPulseRing(pulseAnim2)}
          {renderPulseRing(pulseAnim3)}

          <Animated.View
            style={[
              styles.centerCircle,
              {
                backgroundColor: isMatched ? c.successLight : isExpired ? c.dangerLight : c.primaryLight,
                transform: [{ rotate: isSearching ? rotation : '0deg' }],
              },
            ]}
          >
            <Ionicons
              name={
                isMatched
                  ? 'checkmark-circle'
                  : isExpired || isCancelled
                    ? 'close-circle'
                    : 'car-sport'
              }
              size={48}
              color={isMatched ? c.success : isExpired || isCancelled ? c.danger : c.primary}
            />
          </Animated.View>
        </View>

        <View style={styles.textSection}>
          {isSearching && (
            <>
              <Text style={[styles.title, { color: c.text }]}>{t('matching.searching')}</Text>
              <Text style={[styles.subtitle, { color: c.textSecondary }]}>
                {t('matching.searchingSubtitle')}
                {request?.searchRadius ? ` (${request.searchRadius}km radius)` : ''}
              </Text>
            </>
          )}
          {isMatched && (
            <>
              <Text style={[styles.title, { color: c.success }]}>{t('matching.driverFound')}</Text>
              <Text style={[styles.subtitle, { color: c.textSecondary }]}>
                Waiting for driver to accept...
              </Text>
            </>
          )}
          {(isExpired || isCancelled) && (
            <>
              <Text style={[styles.title, { color: c.danger }]}>{t('matching.noDrivers')}</Text>
              <Button
                title={t('matching.tryAgain')}
                onPress={() => router.replace('/booking')}
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </View>

        {(isSearching || isMatched) && (
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.searchDot,
                  {
                    backgroundColor: c.primary,
                    opacity: rotateAnim.interpolate({
                      inputRange: [i * 0.33, i * 0.33 + 0.17, i * 0.33 + 0.33],
                      outputRange: [0.3, 1, 0.3],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {(isSearching || isMatched) && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Button
            title={t('matching.cancelSearch')}
            onPress={handleCancel}
            variant="outline"
            size="lg"
          />
        </View>
      )}
    </View>
  );
}

export default function MatchingScreen() {
  return (
    <ScreenErrorBoundary>
      <MatchingScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  animationContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  centerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: { alignItems: 'center', marginTop: 40, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  searchDot: { width: 8, height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24 },
});
