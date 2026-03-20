import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useQuery } from 'convex/react';
import { useTheme } from '../../lib/providers/theme';
import { useDriver } from '../../lib/providers/driver';
import { API } from '../../lib/api';
import { Typography } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils/format';
import { openMapsNavigation } from '../../lib/utils/maps';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export function ActiveRideCard() {
  const { colors } = useTheme();
  const { activeRide, startRide, completeRide, cancelRide } = useDriver();
  const { t } = useTranslation();
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  // Fetch full ride details with rider info
  const rideDetails = useQuery(
    API.rides.getById,
    activeRide ? { rideId: activeRide._id } : 'skip',
  ) as any;

  if (!activeRide) return null;

  const riderName = rideDetails?.rider?.user?.name ?? 'Passenger';
  const riderPhone = rideDetails?.rider?.user?.phone ?? '';

  function handleNavigate() {
    const isPickup = activeRide!.status === 'accepted';
    if (isPickup) {
      openMapsNavigation(activeRide!.pickup.lat, activeRide!.pickup.lng, 'Pickup');
    } else {
      openMapsNavigation(activeRide!.dropoff.lat, activeRide!.dropoff.lng, 'Dropoff');
    }
  }

  async function handleOtpConfirm() {
    if (otpInput.length !== 4) return;
    setOtpLoading(true);
    try {
      await startRide(activeRide!._id, otpInput);
    } catch (e: any) {
      Alert.alert('Invalid OTP', e.message ?? 'Please check and try again');
      setOtpInput('');
    } finally {
      setOtpLoading(false);
    }
  }

  function handleComplete() {
    Alert.alert(t('rides.completeRide'), 'Mark this ride as completed?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          setCompleteLoading(true);
          try {
            await completeRide(activeRide!._id);
          } finally {
            setCompleteLoading(false);
          }
        },
      },
    ]);
  }

  function handleCancel() {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: 'Cancel Ride',
        style: 'destructive',
        onPress: () => cancelRide(activeRide!._id, 'driver_cancelled'),
      },
    ]);
  }

  const isPickup = activeRide.status === 'accepted';
  const isInProgress = activeRide.status === 'in_progress';
  const statusColor = isPickup ? colors.warning : colors.success;
  const statusText = isPickup ? t('rides.arrivedAtPickup') : t('rides.headingToDropoff');

  return (
    <Card style={styles.card} padding={0}>
      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: statusColor }]}>
        <Ionicons name={isPickup ? 'navigate' : 'car'} size={18} color="#FFFFFF" />
        <Text style={[Typography.label, { color: '#FFFFFF', marginLeft: 8 }]}>
          {statusText}
        </Text>
        {activeRide.isQrRide && (
          <View style={styles.qrBadge}>
            <Text style={[Typography.caption, { color: '#FFFFFF' }]}>QR</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Passenger info */}
        <View style={styles.passengerRow}>
          <View style={[styles.passengerAvatar, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="person" size={24} color={colors.textSecondary} />
          </View>
          <View style={styles.passengerInfo}>
            <Text style={[Typography.subtitle, { color: colors.text }]}>{riderName}</Text>
            {riderPhone ? (
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>{riderPhone}</Text>
            ) : null}
          </View>
          <Text style={[Typography.h3, { color: colors.primary }]}>
            {formatCurrency(activeRide.fare)}
          </Text>
        </View>

        {/* Locations */}
        <View style={[styles.locations, { borderTopColor: colors.border }]}>
          <View style={styles.locationRow}>
            <Ionicons name="radio-button-on" size={12} color={colors.success} />
            <Text
              style={[Typography.bodySmall, { color: colors.text, marginLeft: 8, flex: 1 }]}
              numberOfLines={1}
            >
              {activeRide.pickup.address}
            </Text>
          </View>
          <View style={[styles.locationRow, { marginTop: 8 }]}>
            <Ionicons name="location" size={12} color={colors.danger} />
            <Text
              style={[Typography.bodySmall, { color: colors.text, marginLeft: 8, flex: 1 }]}
              numberOfLines={1}
            >
              {activeRide.dropoff.address}
            </Text>
          </View>
        </View>

        {/* OTP input (at pickup — status "accepted") */}
        {isPickup && (
          <View style={[styles.otpSection, { borderTopColor: colors.border }]}>
            <Text style={[Typography.label, { color: colors.textSecondary, marginBottom: 8 }]}>
              {t('rides.otpHint')}
            </Text>
            <View style={styles.otpRow}>
              <TextInput
                style={[
                  styles.otpInput,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                ]}
                value={otpInput}
                onChangeText={setOtpInput}
                placeholder="____"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Button
                title={t('common.confirm')}
                onPress={handleOtpConfirm}
                disabled={otpInput.length !== 4}
                loading={otpLoading}
                size="md"
              />
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            title={t('rides.navigate')}
            onPress={handleNavigate}
            variant="secondary"
            size="lg"
            style={{ flex: 1 }}
            icon={<Ionicons name="navigate" size={18} color={colors.text} />}
          />
          {isInProgress && (
            <Button
              title={t('rides.completeRide')}
              onPress={handleComplete}
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
              loading={completeLoading}
            />
          )}
        </View>

        {/* Cancel option */}
        <Button
          title="Cancel Ride"
          onPress={handleCancel}
          variant="ghost"
          size="sm"
          style={{ marginTop: 8 }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, overflow: 'hidden' },
  statusBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  qrBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  body: { padding: 16 },
  passengerRow: { flexDirection: 'row', alignItems: 'center' },
  passengerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  passengerInfo: { flex: 1, marginLeft: 12 },
  locations: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  otpSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  otpRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  otpInput: {
    flex: 1, height: 52, borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, fontSize: 24, fontWeight: '700',
    letterSpacing: 12, textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
