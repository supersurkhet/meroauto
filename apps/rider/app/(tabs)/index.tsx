import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRider } from '@/lib/rider';
import { useLocation, DEFAULT_LOCATION } from '@/lib/location';
import { useQuery, api } from '@/lib/convex';
import { useNetwork } from '@/lib/network';
import { useToast } from '@/lib/toast';
import { Card } from '@/components/ui/Card';
import { HomeCardSkeleton } from '@/components/ui/Skeleton';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

function HomeScreenInner() {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { rider, riderId } = useRider();
  const { location, isLoading: locationLoading } = useLocation();
  const { isOnline } = useNetwork();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentLocation = location ?? DEFAULT_LOCATION;

  // Real Convex query for nearby drivers
  const nearbyDrivers = useQuery(
    api.locations.getNearbyDrivers,
    location
      ? { latitude: location.latitude, longitude: location.longitude, radiusKm: 5 }
      : 'skip'
  );

  // Check for active ride — redirect if found
  const activeRide = useQuery(
    api.rides.getActiveRideForRider,
    riderId ? { riderId } : 'skip'
  );

  useEffect(() => {
    if (activeRide) {
      router.replace({
        pathname: '/ride/tracking',
        params: { rideId: activeRide._id },
      });
    }
  }, [activeRide]);

  // Check for active ride request — redirect to matching
  const activeRequest = useQuery(
    api.rideRequests.getActiveRequestForRider,
    riderId ? { riderId } : 'skip'
  );

  useEffect(() => {
    if (activeRequest && (activeRequest.status === 'pending' || activeRequest.status === 'matched')) {
      router.replace({
        pathname: '/ride/matching',
        params: { requestId: activeRequest._id },
      });
    }
  }, [activeRequest]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const drivers = nearbyDrivers ?? [];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          ...currentLocation,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {drivers.map((driver) => (
          <Marker
            key={String(driver.driverId)}
            coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
          >
            <View style={[styles.driverMarker, { backgroundColor: c.primary }]}>
              <Ionicons name="car-sport" size={16} color="#FFF" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.greetingCard, { backgroundColor: c.mapOverlay }]}>
          <View style={[styles.avatarSmall, { backgroundColor: c.primaryLight }]}>
            <Ionicons name="person" size={18} color={c.primary} />
          </View>
          <View style={styles.greetingText}>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>
              {t('home.greeting', { name: rider?.name ?? user?.firstName ?? 'Rider' })}
            </Text>
            <Text style={[styles.greetingMain, { color: c.text }]}>
              {t('home.whereToGo')}
            </Text>
          </View>
        </View>
      </View>

      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.myLocationBtn, { backgroundColor: c.card }]}
        onPress={() => {
          mapRef.current?.animateToRegion({
            ...currentLocation,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }}
      >
        <Ionicons name="locate" size={22} color={c.primary} />
      </TouchableOpacity>

      {/* Bottom Card */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 90 }]}>
        <Card variant="elevated" style={styles.searchCard}>
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: c.surface }]}
            onPress={() => {
              if (!isOnline) { toast.warning('You are offline. Booking requires internet.'); return; }
              router.push('/booking');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.searchDot, { backgroundColor: c.primary }]} />
            <Text style={[styles.searchText, { color: c.textMuted }]}>
              {t('home.searchPlaceholder')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={c.textMuted} />
          </TouchableOpacity>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: c.primaryLight }]}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Ionicons name="qr-code" size={22} color={c.primary} />
              <Text style={[styles.quickActionText, { color: c.primary }]}>
                {t('qr.title')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: c.accentLight }]}
              onPress={() => {
                if (!isOnline) { toast.warning('You are offline. Booking requires internet.'); return; }
                router.push('/booking');
              }}
            >
              <Ionicons name="navigate" size={22} color={c.accent} />
              <Text style={[styles.quickActionText, { color: c.accent }]}>
                {t('booking.bookNow')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nearbyRow}>
            {nearbyDrivers === undefined ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.liveDot,
                    { backgroundColor: c.success, transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <Text style={[styles.nearbyText, { color: c.textSecondary }]}>
                  {drivers.length} {t('home.nearbyAutos').toLowerCase()}
                </Text>
              </>
            )}
          </View>
        </Card>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScreenErrorBoundary>
      <HomeScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: { flex: 1 },
  greeting: { fontSize: 12, fontWeight: '500' },
  greetingMain: { fontSize: 17, fontWeight: '700', marginTop: 1 },
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    bottom: 320,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  searchCard: { gap: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  searchDot: { width: 10, height: 10, borderRadius: 5 },
  searchText: { flex: 1, fontSize: 15 },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: { fontSize: 13, fontWeight: '600' },
  nearbyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  nearbyText: { fontSize: 13 },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
