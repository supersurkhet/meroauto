import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useLocation, DEFAULT_LOCATION } from '@/lib/location';
import { useQuery, api } from '@/lib/convex';
import { useNetwork } from '@/lib/network';
import { useToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FareEstimateSkeleton } from '@/components/ui/Skeleton';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

// Surkhet area places — in production these come from a places API
const PLACES = [
  { id: '1', name: 'Surkhet Airport', lat: 28.5860, lng: 81.6360 },
  { id: '2', name: 'Birendranagar Bus Park', lat: 28.5980, lng: 81.6300 },
  { id: '3', name: 'Mangalgadhi', lat: 28.6100, lng: 81.6050 },
  { id: '4', name: 'Hospital Road', lat: 28.5990, lng: 81.6100 },
  { id: '5', name: 'Itram Bazaar', lat: 28.6050, lng: 81.6250 },
  { id: '6', name: 'Latikoili', lat: 28.5900, lng: 81.5950 },
  { id: '7', name: 'Bulbuliya', lat: 28.6120, lng: 81.6180 },
  { id: '8', name: 'Chhinchu', lat: 28.6250, lng: 81.6400 },
];

function BookingScreenInner() {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [pickupText, setPickupText] = useState(t('home.currentLocation'));
  const [dropoffText, setDropoffText] = useState('');
  const [selectedDropoff, setSelectedDropoff] = useState<(typeof PLACES)[0] | null>(null);

  const currentLocation = location ?? DEFAULT_LOCATION;

  // Real Convex fare estimate
  const fareEstimate = useQuery(
    api.pricing.estimateFare,
    selectedDropoff
      ? {
          pickupLatitude: currentLocation.latitude,
          pickupLongitude: currentLocation.longitude,
          dropoffLatitude: selectedDropoff.lat,
          dropoffLongitude: selectedDropoff.lng,
        }
      : 'skip'
  );

  const filteredPlaces = PLACES.filter((p) =>
    p.name.toLowerCase().includes(dropoffText.toLowerCase())
  );

  const handleSelectPlace = (place: (typeof PLACES)[0]) => {
    setSelectedDropoff(place);
    setDropoffText(place.name);
    mapRef.current?.fitToCoordinates(
      [currentLocation, { latitude: place.lat, longitude: place.lng }],
      { edgePadding: { top: 120, right: 60, bottom: 300, left: 60 }, animated: true }
    );
  };

  const handleConfirm = () => {
    if (!selectedDropoff || !fareEstimate) return;
    router.push({
      pathname: '/booking/confirm',
      params: {
        pickupLat: String(currentLocation.latitude),
        pickupLng: String(currentLocation.longitude),
        pickupAddress: pickupText,
        dropoffName: selectedDropoff.name,
        dropoffLat: String(selectedDropoff.lat),
        dropoffLng: String(selectedDropoff.lng),
        fare: String(fareEstimate.totalFare),
        baseFare: String(fareEstimate.baseFare),
        distanceFare: String(fareEstimate.distanceFare),
        timeFare: String(fareEstimate.timeFare),
        distance: String(fareEstimate.distance),
        duration: String(fareEstimate.estimatedDuration),
        surgeMultiplier: String(fareEstimate.surgeMultiplier),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          ...currentLocation,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {selectedDropoff && (
          <>
            <Marker coordinate={{ latitude: selectedDropoff.lat, longitude: selectedDropoff.lng }}>
              <View style={[styles.dropoffMarker, { backgroundColor: c.danger }]}>
                <Ionicons name="location" size={16} color="#FFF" />
              </View>
            </Marker>
            <Polyline
              coordinates={[
                currentLocation,
                { latitude: selectedDropoff.lat, longitude: selectedDropoff.lng },
              ]}
              strokeColor={c.primary}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          </>
        )}
      </MapView>

      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: c.card, top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={22} color={c.text} />
      </TouchableOpacity>

      <View style={[styles.bottomPanel, { backgroundColor: c.background }]}>
        <Card variant="elevated" style={styles.locationInputs}>
          <View style={styles.inputRow}>
            <View style={[styles.inputDot, { backgroundColor: c.primary }]} />
            <TextInput
              style={[styles.textInput, { color: c.text }]}
              value={pickupText}
              onChangeText={setPickupText}
              placeholder={t('booking.selectPickup')}
              placeholderTextColor={c.textMuted}
            />
          </View>
          <View style={[styles.inputDivider, { backgroundColor: c.border }]} />
          <View style={styles.inputRow}>
            <View style={[styles.inputDot, { backgroundColor: c.danger }]} />
            <TextInput
              style={[styles.textInput, { color: c.text }]}
              value={dropoffText}
              onChangeText={(text) => {
                setDropoffText(text);
                setSelectedDropoff(null);
              }}
              placeholder={t('booking.selectDropoff')}
              placeholderTextColor={c.textMuted}
              autoFocus
            />
          </View>
        </Card>

        {!selectedDropoff ? (
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item) => item.id}
            style={styles.placesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.placeItem}
                onPress={() => handleSelectPlace(item)}
              >
                <View style={[styles.placeIcon, { backgroundColor: c.surface }]}>
                  <Ionicons name="location-outline" size={18} color={c.textSecondary} />
                </View>
                <Text style={[styles.placeName, { color: c.text }]}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.fareSection}>
            <Card style={[styles.vehicleCard, { borderColor: c.primary, borderWidth: 2 }]}>
              <View style={styles.vehicleRow}>
                <View style={[styles.vehicleIcon, { backgroundColor: c.primaryLight }]}>
                  <Ionicons name="car-sport" size={24} color={c.primary} />
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={[styles.vehicleName, { color: c.text }]}>{t('booking.auto')}</Text>
                  <Text style={[styles.vehicleDesc, { color: c.textSecondary }]}>
                    {t('booking.autoDescription')}
                  </Text>
                </View>
                <View style={styles.fareInfo}>
                  {fareEstimate ? (
                    <>
                      <Text style={[styles.fareAmount, { color: c.text }]}>
                        Rs. {fareEstimate.totalFare}
                      </Text>
                      <Text style={[styles.fareEta, { color: c.textSecondary }]}>
                        {fareEstimate.distance} km · {fareEstimate.estimatedDuration} min
                      </Text>
                      {fareEstimate.surgeMultiplier > 1 && (
                        <Text style={[styles.surgeText, { color: c.accent }]}>
                          {fareEstimate.surgeMultiplier}x surge
                        </Text>
                      )}
                    </>
                  ) : (
                    <FareEstimateSkeleton />
                  )}
                </View>
              </View>
            </Card>

            <Button
              title={
                fareEstimate
                  ? `${t('booking.confirmRide')} · Rs. ${fareEstimate.totalFare}`
                  : t('common.loading')
              }
              onPress={handleConfirm}
              disabled={!fareEstimate}
              size="lg"
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default function BookingScreen() {
  return (
    <ScreenErrorBoundary>
      <BookingScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: 16,
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
  bottomPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    marginTop: -24,
    gap: 16,
  },
  locationInputs: { gap: 0, padding: 0, overflow: 'hidden' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputDot: { width: 10, height: 10, borderRadius: 5 },
  textInput: { flex: 1, fontSize: 15 },
  inputDivider: { height: 0.5, marginLeft: 38 },
  placesList: { maxHeight: 200 },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeName: { fontSize: 15, fontWeight: '500' },
  fareSection: { gap: 16 },
  vehicleCard: { padding: 12 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: { flex: 1, gap: 2 },
  vehicleName: { fontSize: 16, fontWeight: '600' },
  vehicleDesc: { fontSize: 12 },
  fareInfo: { alignItems: 'flex-end', gap: 2 },
  fareAmount: { fontSize: 18, fontWeight: '700' },
  fareEta: { fontSize: 12 },
  surgeText: { fontSize: 11, fontWeight: '600' },
  dropoffMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
