import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, useAnimatedValue } from 'react-native';
import { useTheme } from '../../lib/providers/theme';
import { useDriver } from '../../lib/providers/driver';
import { Typography } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDistance, formatDuration } from '../../lib/utils/format';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Props = {
  request: {
    _id: any;
    pickup: { lat: number; lng: number; address: string };
    dropoff: { lat: number; lng: number; address: string };
    estimatedFare: number;
    estimatedDistance: number;
    estimatedDuration: number;
    expiresAt: number;
  };
};

export function RideRequestModal({ request }: Props) {
  const { colors } = useTheme();
  const { acceptRide, rejectRide } = useDriver();
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(
    Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000)),
  );
  const [loading, setLoading] = useState(false);
  const pulseAnim = useAnimatedValue(1);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        rejectRide(request._id).catch(() => {});
      }
    }, 1000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ).start();

    return () => clearInterval(timer);
  }, [request._id]);

  async function handleAccept() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      await acceptRide(request._id);
    } catch (e: any) {
      setLoading(false);
    }
  }

  async function handleReject() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await rejectRide(request._id);
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, transform: [{ scale: pulseAnim }] },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Ionicons name="car" size={28} color="#FFFFFF" />
            <Text style={[Typography.h3, { color: '#FFFFFF', marginLeft: 10, flex: 1 }]}>
              {t('rides.newRequest')}
            </Text>
            <View style={styles.countdownCircle}>
              <Text style={[Typography.h3, { color: colors.primary }]}>{countdown}</Text>
            </View>
          </View>

          <View style={styles.body}>
            {/* Pickup */}
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <View style={styles.locationInfo}>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>{t('rides.pickup')}</Text>
                <Text style={[Typography.body, { color: colors.text }]} numberOfLines={2}>
                  {request.pickup.address}
                </Text>
              </View>
            </View>

            <View style={[styles.dottedLine, { borderColor: colors.border }]} />

            {/* Dropoff */}
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <View style={styles.locationInfo}>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>{t('rides.dropoff')}</Text>
                <Text style={[Typography.body, { color: colors.text }]} numberOfLines={2}>
                  {request.dropoff.address}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <View style={styles.stat}>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>{t('rides.fare')}</Text>
                <Text style={[Typography.h3, { color: colors.primary }]}>
                  {formatCurrency(request.estimatedFare)}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>{t('rides.distance')}</Text>
                <Text style={[Typography.h3, { color: colors.text }]}>
                  {formatDistance(request.estimatedDistance)}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[Typography.caption, { color: colors.textMuted }]}>{t('rides.duration')}</Text>
                <Text style={[Typography.h3, { color: colors.text }]}>
                  {formatDuration(request.estimatedDuration)}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button title={t('rides.reject')} onPress={handleReject} variant="secondary" size="lg" style={{ flex: 1 }} />
              <Button title={t('rides.accept')} onPress={handleAccept} variant="primary" size="lg" style={{ flex: 1 }} loading={loading} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: { borderRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  countdownCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  locationInfo: { marginLeft: 12, flex: 1 },
  dottedLine: { borderLeftWidth: 2, borderStyle: 'dashed', height: 24, marginLeft: 5, marginVertical: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1 },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: '100%' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
