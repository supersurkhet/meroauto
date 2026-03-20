import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useLocation, DEFAULT_LOCATION } from '@/lib/location';
import { useQuery, api } from '@/lib/convex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { DriverCard } from '@/components/DriverCard';
import { Card } from '@/components/ui/Card';

function TrackingScreenInner() {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const { location } = useLocation();
  const mapRef = useRef<MapView>(null);

  // Subscribe to ride data
  const rideData = useQuery(
    api.rides.getRideById,
    params.rideId ? { rideId: params.rideId } : 'skip'
  );

  // Subscribe to driver's real-time location
  const driverLocation = useQuery(
    api.locations.subscribeDriverLocation,
    rideData?.driverId ? { driverId: rideData.driverId } : 'skip'
  );

  const currentLocation = location ?? DEFAULT_LOCATION;
  const ride = rideData;
  const driver = rideData?.driver;
  const vehicle = rideData?.vehicle;

  const phase = ride?.status ?? 'driver_arriving';

  // Navigate to payment when ride completes
  useEffect(() => {
    if (ride?.status === 'completed') {
      router.replace({
        pathname: '/ride/payment',
        params: {
          rideId: ride._id,
          fare: String(ride.fare),
          riderId: String(ride.riderId),
          driverId: String(ride.driverId),
        },
      });
    }
  }, [ride?.status]);

  // Center map on driver when location updates
  useEffect(() => {
    if (driverLocation && ride) {
      mapRef.current?.fitToCoordinates(
        [
          { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
          { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
          ...(ride.status === 'in_progress'
            ? [{ latitude: ride.dropoffLatitude, longitude: ride.dropoffLongitude }]
            : []),
        ],
        { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
      );
    }
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  const phaseConfig: Record<string, { label: string; color: string; icon: string }> = {
    driver_arriving: { label: t('tracking.driverOnWay'), color: c.primary, icon: 'navigate' },
    driver_arrived: { label: t('tracking.arrived'), color: c.success, icon: 'checkmark-circle' },
    in_progress: { label: t('tracking.rideInProgress'), color: c.info, icon: 'car-sport' },
    completed: { label: t('tracking.reachedDestination'), color: c.success, icon: 'flag' },
    cancelled: { label: 'Ride Cancelled', color: c.danger, icon: 'close-circle' },
  };

  const currentPhase = phaseConfig[phase] ?? phaseConfig.driver_arriving;

  // Derive destination marker based on ride status
  const destinationMarker =
    ride && ride.status === 'in_progress'
      ? { latitude: ride.dropoffLatitude, longitude: ride.dropoffLongitude }
      : ride
        ? { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude }
        : null;

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
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {/* Driver marker — real-time from Convex */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
          >
            <View style={[styles.driverMarker, { backgroundColor: c.primary }]}>
              <Ionicons name="car-sport" size={18} color="#FFF" />
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        {destinationMarker && (
          <Marker coordinate={destinationMarker}>
            <View style={[styles.destMarker, { backgroundColor: ride?.status === 'in_progress' ? c.danger : c.primary }]}>
              <Ionicons name={ride?.status === 'in_progress' ? 'flag' : 'location'} size={14} color="#FFF" />
            </View>
          </Marker>
        )}

        {/* Route line from driver to destination */}
        {driverLocation && destinationMarker && (
          <Polyline
            coordinates={[
              { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
              destinationMarker,
            ]}
            strokeColor={c.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Status Bar */}
      <View style={[styles.statusBar, { top: insets.top + 8 }]}>
        <Card
          variant="elevated"
          style={[styles.statusCard, { borderLeftColor: currentPhase.color, borderLeftWidth: 4 }]}
        >
          <Ionicons name={currentPhase.icon as any} size={22} color={currentPhase.color} />
          <Text style={[styles.statusText, { color: c.text }]}>{currentPhase.label}</Text>
          {ride?.otp && phase === 'driver_arrived' && (
            <View style={[styles.otpBadge, { backgroundColor: c.accentLight }]}>
              <Text style={[styles.otpText, { color: c.accent }]}>OTP: {ride.otp}</Text>
            </View>
          )}
        </Card>
      </View>

      {/* SOS Button */}
      <TouchableOpacity
        style={[styles.sosButton, { backgroundColor: c.danger, top: insets.top + 70 }]}
        onPress={() => Linking.openURL('tel:100')}
      >
        <Text style={styles.sosText}>{t('tracking.sos')}</Text>
      </TouchableOpacity>

      {/* Bottom Panel */}
      <View style={[styles.bottomPanel, { backgroundColor: c.background, paddingBottom: insets.bottom + 16 }]}>
        <DriverCard
          name={driver?.name ?? 'Driver'}
          rating={driver?.rating ?? 5}
          vehicleNumber={vehicle?.registrationNumber ?? '—'}
          vehicleColor={vehicle?.color}
          phone={driver?.phone}
        />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.primaryLight }]}
            onPress={() => {
              if (driver?.phone) Linking.openURL(`tel:${driver.phone}`);
            }}
          >
            <Ionicons name="call" size={22} color={c.primary} />
            <Text style={[styles.actionLabel, { color: c.primary }]}>{t('tracking.callDriver')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.infoLight }]}>
            <Ionicons name="chatbubble" size={22} color={c.info} />
            <Text style={[styles.actionLabel, { color: c.info }]}>{t('tracking.messageDriver')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.accentLight }]}>
            <Ionicons name="share-social" size={22} color={c.accent} />
            <Text style={[styles.actionLabel, { color: c.accent }]}>{t('tracking.shareRide')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function TrackingScreen() {
  return (
    <ScreenErrorBoundary>
      <TrackingScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  statusBar: { position: 'absolute', left: 16, right: 16 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusText: { fontSize: 15, fontWeight: '600', flex: 1 },
  otpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  otpText: { fontSize: 14, fontWeight: '700' },
  sosButton: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sosText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  bottomPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    gap: 14,
    marginTop: -24,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 4,
  },
  actionLabel: { fontSize: 11, fontWeight: '600' },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  destMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
