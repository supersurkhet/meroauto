import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useRider } from '@/lib/rider';
import { useMutation, api } from '@/lib/convex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { useNetwork } from '@/lib/network';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/payment';

function ConfirmBookingScreenInner() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { riderId } = useRider();
  const { isOnline } = useNetwork();
  const toast = useToast();
  const params = useLocalSearchParams<{
    pickupLat?: string;
    pickupLng?: string;
    pickupAddress?: string;
    dropoffName?: string;
    dropoffLat?: string;
    dropoffLng?: string;
    fare?: string;
    baseFare?: string;
    distanceFare?: string;
    timeFare?: string;
    distance?: string;
    duration?: string;
    surgeMultiplier?: string;
    driverId?: string;
    driverName?: string;
    skipMatching?: string;
    qrCode?: string;
  }>();

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [isBooking, setIsBooking] = useState(false);

  const createRideRequest = useMutation(api.rideRequests.createRideRequest);
  const createQrRide = useMutation(api.qrCodes.createQrRideRequest);

  const fare = Number(params.fare ?? 150);
  const baseFare = Number(params.baseFare ?? 50);
  const distanceFare = Number(params.distanceFare ?? fare - 50);
  const timeFare = Number(params.timeFare ?? 0);
  const isDirectBooking = params.skipMatching === 'true';

  const handleConfirm = async () => {
    if (!isOnline) { toast.error('Cannot book while offline'); return; }
    if (!riderId) {
      Alert.alert(t('common.error'), 'Rider profile not found. Please re-login.');
      return;
    }

    setIsBooking(true);
    try {
      if (isDirectBooking && params.qrCode) {
        // QR instant ride — skip matching
        const result = await createQrRide({
          qrCode: params.qrCode,
          riderId,
          pickupLatitude: Number(params.pickupLat ?? 0),
          pickupLongitude: Number(params.pickupLng ?? 0),
          pickupAddress: params.pickupAddress ?? 'Current Location',
          dropoffLatitude: Number(params.dropoffLat ?? 0),
          dropoffLongitude: Number(params.dropoffLng ?? 0),
          dropoffAddress: params.dropoffName ?? 'Destination',
          estimatedFare: fare,
          estimatedDistance: Number(params.distance ?? 0),
          paymentMethod: selectedPayment,
        });
        router.replace({
          pathname: '/ride/tracking',
          params: { rideId: result.rideId },
        });
      } else {
        // Normal booking — go through matching
        const requestId = await createRideRequest({
          riderId,
          pickupLatitude: Number(params.pickupLat ?? 0),
          pickupLongitude: Number(params.pickupLng ?? 0),
          pickupAddress: params.pickupAddress ?? 'Current Location',
          dropoffLatitude: Number(params.dropoffLat ?? 0),
          dropoffLongitude: Number(params.dropoffLng ?? 0),
          dropoffAddress: params.dropoffName ?? 'Destination',
          estimatedFare: fare,
          estimatedDistance: Number(params.distance ?? 0),
          estimatedDuration: Number(params.duration ?? 0),
        });
        router.replace({
          pathname: '/ride/matching',
          params: { requestId: String(requestId) },
        });
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message ?? 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('booking.confirmRide')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Summary */}
        <Card variant="elevated" style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeIndicator}>
              <View style={[styles.dot, { backgroundColor: c.primary }]} />
              <View style={[styles.line, { backgroundColor: c.border }]} />
              <View style={[styles.dot, { backgroundColor: c.danger }]} />
            </View>
            <View style={styles.routeTexts}>
              <View>
                <Text style={[styles.routeLabel, { color: c.textMuted }]}>{t('booking.pickup')}</Text>
                <Text style={[styles.routePlace, { color: c.text }]}>
                  {params.pickupAddress ?? t('home.currentLocation')}
                </Text>
              </View>
              <View>
                <Text style={[styles.routeLabel, { color: c.textMuted }]}>{t('booking.dropoff')}</Text>
                <Text style={[styles.routePlace, { color: c.text }]}>
                  {params.dropoffName ?? 'Destination'}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statsRow, { borderTopColor: c.border }]}>
            <View style={styles.stat}>
              <Ionicons name="navigate-outline" size={16} color={c.textSecondary} />
              <Text style={[styles.statText, { color: c.textSecondary }]}>
                {params.distance ?? '—'} km
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color={c.textSecondary} />
              <Text style={[styles.statText, { color: c.textSecondary }]}>
                {params.duration ?? '—'} min
              </Text>
            </View>
          </View>
        </Card>

        {/* Direct booking driver info */}
        {isDirectBooking && params.driverName && (
          <Card variant="elevated">
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: c.primaryLight }]}>
                <Ionicons name="person" size={24} color={c.primary} />
              </View>
              <View>
                <Text style={[styles.driverName, { color: c.text }]}>{params.driverName}</Text>
                <Text style={[styles.driverLabel, { color: c.textSecondary }]}>
                  QR Instant Ride
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Fare Breakdown */}
        <Card variant="elevated" style={styles.fareCard}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('payment.fareBreakdown')}</Text>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: c.textSecondary }]}>{t('payment.baseFare')}</Text>
            <Text style={[styles.fareValue, { color: c.text }]}>Rs. {baseFare}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: c.textSecondary }]}>
              {t('payment.distanceFare', { km: params.distance ?? '—' })}
            </Text>
            <Text style={[styles.fareValue, { color: c.text }]}>Rs. {distanceFare}</Text>
          </View>
          {timeFare > 0 && (
            <View style={styles.fareRow}>
              <Text style={[styles.fareLabel, { color: c.textSecondary }]}>
                {t('payment.timeFare', { min: params.duration ?? '—' })}
              </Text>
              <Text style={[styles.fareValue, { color: c.text }]}>Rs. {timeFare}</Text>
            </View>
          )}
          {Number(params.surgeMultiplier ?? 1) > 1 && (
            <View style={styles.fareRow}>
              <Text style={[styles.fareLabel, { color: c.accent }]}>
                Surge ({params.surgeMultiplier}x)
              </Text>
              <Text style={[styles.fareValue, { color: c.accent }]}>Applied</Text>
            </View>
          )}
          <View style={[styles.fareRow, styles.totalRow, { borderTopColor: c.border }]}>
            <Text style={[styles.totalLabel, { color: c.text }]}>{t('payment.total')}</Text>
            <Text style={[styles.totalValue, { color: c.primary }]}>Rs. {fare}</Text>
          </View>
        </Card>

        {/* Payment Method */}
        <Card variant="elevated" style={styles.paymentCard}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('payment.selectMethod')}</Text>
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm.method}
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor: selectedPayment === pm.method ? c.primaryLight : c.surface,
                    borderColor: selectedPayment === pm.method ? c.primary : c.border,
                    borderWidth: selectedPayment === pm.method ? 1.5 : 1,
                  },
                ]}
                onPress={() => setSelectedPayment(pm.method)}
              >
                <Ionicons
                  name={pm.icon as any}
                  size={22}
                  color={selectedPayment === pm.method ? c.primary : c.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentLabel,
                    { color: selectedPayment === pm.method ? c.primary : c.text },
                  ]}
                >
                  {t(pm.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: c.background }]}>
        <Button
          title={`${t('booking.confirmRide')} · Rs. ${fare}`}
          onPress={handleConfirm}
          loading={isBooking}
          size="lg"
        />
      </View>
    </View>
  );
}

export default function ConfirmBookingScreen() {
  return (
    <ScreenErrorBoundary>
      <ConfirmBookingScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  routeCard: { gap: 0 },
  routeRow: { flexDirection: 'row', gap: 14 },
  routeIndicator: { alignItems: 'center', paddingVertical: 4, width: 14 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  routeTexts: { flex: 1, gap: 20 },
  routeLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  routePlace: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, fontWeight: '500' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: { fontSize: 16, fontWeight: '600' },
  driverLabel: { fontSize: 13, marginTop: 1 },
  fareCard: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fareLabel: { fontSize: 14 },
  fareValue: { fontSize: 14, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '700' },
  paymentCard: { gap: 12 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  paymentLabel: { fontSize: 14, fontWeight: '500' },
  footer: { padding: 16, paddingTop: 8 },
});
