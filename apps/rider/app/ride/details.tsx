import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useQuery, api } from '@/lib/convex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/RatingStars';

function RideDetailsScreenInner() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rideId?: string }>();

  // Real Convex queries
  const ride = useQuery(
    api.rides.getRideById,
    params.rideId ? { rideId: params.rideId } : 'skip'
  );

  const payment = useQuery(
    api.payments.getPaymentByRide,
    params.rideId ? { rideId: params.rideId } : 'skip'
  );

  const ratings = useQuery(
    api.ratings.getRatingForRide,
    params.rideId ? { rideId: params.rideId } : 'skip'
  );

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (!ride) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const driver = ride.driver;
  const vehicle = ride.vehicle;
  const myRating = ratings?.find((r: any) => r.fromUserId !== driver?.userId);

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('history.rideDetails')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status & Date */}
        <View style={styles.topSection}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  ride.status === 'completed' ? c.successLight : c.dangerLight,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: ride.status === 'completed' ? c.success : c.danger },
              ]}
            >
              {ride.status === 'completed' ? t('history.completed') : ride.status}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: c.textSecondary }]}>
            {formatDate(ride.createdAt)} at {formatTime(ride.createdAt)}
          </Text>
          {ride.isQrRide && (
            <View style={[styles.qrBadge, { backgroundColor: c.primaryLight }]}>
              <Ionicons name="qr-code" size={12} color={c.primary} />
              <Text style={[styles.qrText, { color: c.primary }]}>QR Ride</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <Card variant="elevated" style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeIndicator}>
              <View style={[styles.dot, { backgroundColor: c.primary }]} />
              <View style={[styles.line, { backgroundColor: c.border }]} />
              <View style={[styles.dot, { backgroundColor: c.danger }]} />
            </View>
            <View style={styles.routeTexts}>
              <Text style={[styles.routePlace, { color: c.text }]}>{ride.pickupAddress}</Text>
              <Text style={[styles.routePlace, { color: c.text }]}>{ride.dropoffAddress}</Text>
            </View>
          </View>
          <View style={[styles.statsRow, { borderTopColor: c.border }]}>
            <View style={styles.stat}>
              <Ionicons name="navigate-outline" size={16} color={c.textSecondary} />
              <Text style={[styles.statValue, { color: c.text }]}>
                {ride.distance?.toFixed(1) ?? '—'} km
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color={c.textSecondary} />
              <Text style={[styles.statValue, { color: c.text }]}>
                {ride.duration ? `${Math.round(ride.duration / 60)} min` : '—'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Driver */}
        {driver && (
          <Card variant="elevated">
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: c.primaryLight }]}>
                <Ionicons name="person" size={28} color={c.primary} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={[styles.driverName, { color: c.text }]}>{driver.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={c.accent} />
                  <Text style={[styles.driverRating, { color: c.textSecondary }]}>
                    {driver.rating?.toFixed(1) ?? '5.0'}
                  </Text>
                </View>
              </View>
              {vehicle && (
                <Text style={[styles.vehicleNum, { color: c.textSecondary }]}>
                  {vehicle.registrationNumber}
                </Text>
              )}
            </View>
          </Card>
        )}

        {/* Payment */}
        <Card variant="elevated" style={styles.paymentCard}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('payment.title')}</Text>
          <View style={styles.paymentRow}>
            <Ionicons
              name={payment?.method === 'cash' ? 'cash' : 'wallet'}
              size={20}
              color={c.textSecondary}
            />
            <Text style={[styles.paymentMethod, { color: c.textSecondary }]}>
              {payment ? t(`payment.${payment.method}`) : '—'}
            </Text>
            <Text style={[styles.paymentAmount, { color: c.text }]}>Rs. {ride.fare}</Text>
          </View>
          {payment && (
            <View
              style={[
                styles.paymentStatus,
                {
                  backgroundColor:
                    payment.status === 'completed' ? c.successLight : c.warningLight,
                },
              ]}
            >
              <Text
                style={{
                  color: payment.status === 'completed' ? c.success : c.warning,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {payment.status.toUpperCase()}
              </Text>
            </View>
          )}
        </Card>

        {/* Your Rating */}
        {myRating && (
          <Card style={styles.yourRating}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Your Rating</Text>
            <RatingStars rating={myRating.rating} readonly size={24} />
            {myRating.comment && (
              <Text style={[styles.ratingComment, { color: c.textSecondary }]}>
                "{myRating.comment}"
              </Text>
            )}
          </Card>
        )}

        {/* Rate button if not yet rated */}
        {ride.status === 'completed' && !myRating && (
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: c.primaryLight }]}
            onPress={() =>
              router.push({ pathname: '/ride/rating', params: { rideId: ride._id } })
            }
          >
            <Ionicons name="star-outline" size={20} color={c.primary} />
            <Text style={[styles.rateBtnText, { color: c.primary }]}>
              {t('history.rateRide')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

export default function RideDetailsScreen() {
  return (
    <ScreenErrorBoundary>
      <RideDetailsScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  topSection: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 13, fontWeight: '600' },
  dateText: { fontSize: 14 },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qrText: { fontSize: 12, fontWeight: '600' },
  routeCard: { gap: 0 },
  routeRow: { flexDirection: 'row', gap: 14 },
  routeIndicator: { alignItems: 'center', paddingVertical: 4, width: 14 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  routeTexts: { flex: 1, justifyContent: 'space-between', gap: 20 },
  routePlace: { fontSize: 15, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 14, fontWeight: '500' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: { flex: 1, gap: 2 },
  driverName: { fontSize: 16, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverRating: { fontSize: 13 },
  vehicleNum: { fontSize: 13, fontWeight: '500' },
  paymentCard: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentMethod: { flex: 1, fontSize: 14, textTransform: 'capitalize' },
  paymentAmount: { fontSize: 18, fontWeight: '700' },
  paymentStatus: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  yourRating: { gap: 10 },
  ratingComment: { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
  },
  rateBtnText: { fontSize: 15, fontWeight: '600' },
});
