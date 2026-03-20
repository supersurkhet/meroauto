import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useRider } from '@/lib/rider';
import { useQuery, api } from '@/lib/convex';
import { Card } from '@/components/ui/Card';
import { RideCardSkeleton } from '@/components/ui/Skeleton';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

function HistoryScreenInner() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { riderId } = useRider();

  // Real Convex query for ride history
  const rides = useQuery(
    api.rides.getRidesByRider,
    riderId ? { riderId, limit: 50 } : 'skip'
  );

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderRide = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/ride/details', params: { rideId: item._id } })}
    >
      <Card variant="elevated" style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.dateRow}>
            <Text style={[styles.date, { color: c.textSecondary }]}>
              {formatDate(item.createdAt)}
            </Text>
            <Text style={[styles.time, { color: c.textMuted }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'completed' ? c.successLight : c.dangerLight,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.status === 'completed' ? c.success : c.danger },
              ]}
            >
              {item.status === 'completed' ? t('history.completed') : t('history.cancelled')}
            </Text>
          </View>
        </View>

        <View style={styles.routeSection}>
          <View style={styles.routeIndicator}>
            <View style={[styles.routeDotGreen, { backgroundColor: c.primary }]} />
            <View style={[styles.routeLine, { backgroundColor: c.border }]} />
            <View style={[styles.routeDotRed, { backgroundColor: c.danger }]} />
          </View>
          <View style={styles.routeTexts}>
            <Text style={[styles.routeText, { color: c.text }]} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
            <Text style={[styles.routeText, { color: c.text }]} numberOfLines={1}>
              {item.dropoffAddress}
            </Text>
          </View>
        </View>

        <View style={[styles.rideFooter, { borderTopColor: c.border }]}>
          <View style={styles.footerLeft}>
            <Text style={[styles.distanceText, { color: c.textSecondary }]}>
              {item.distance?.toFixed(1) ?? '—'} km
              {item.duration ? ` · ${Math.round(item.duration / 60)} min` : ''}
            </Text>
          </View>
          <Text style={[styles.fare, { color: c.text }]}>Rs. {item.fare}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>{t('history.title')}</Text>
      </View>

      {rides === undefined ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <RideCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderRide}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: c.surface }]}>
                <Ionicons name="car-sport-outline" size={48} color={c.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>{t('history.noRides')}</Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                {t('history.noRidesSubtitle')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

export default function HistoryScreen() {
  return (
    <ScreenErrorBoundary>
      <HistoryScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rideCard: { gap: 12 },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  date: { fontSize: 13, fontWeight: '500' },
  time: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  routeSection: { flexDirection: 'row', gap: 12 },
  routeIndicator: { alignItems: 'center', paddingVertical: 2 },
  routeDotGreen: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, flex: 1, marginVertical: 3 },
  routeDotRed: { width: 10, height: 10, borderRadius: 5 },
  routeTexts: { flex: 1, justifyContent: 'space-between', gap: 8 },
  routeText: { fontSize: 14, fontWeight: '500' },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  footerLeft: { gap: 4 },
  distanceText: { fontSize: 13 },
  fare: { fontSize: 18, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
