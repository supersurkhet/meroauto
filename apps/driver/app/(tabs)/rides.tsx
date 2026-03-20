import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { useTheme } from '../../lib/providers/theme';
import { useDriver } from '../../lib/providers/driver';
import { API } from '../../lib/api';
import { Typography } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { RideHistorySkeleton } from '../../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatTime } from '../../lib/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { ActiveRideCard } from '../../components/ride/ActiveRideCard';

type RideHistoryItem = {
  _id: string;
  pickup: { address: string };
  dropoff: { address: string };
  fare: number;
  finalFare?: number;
  status: string;
  createdAt: number;
  completedAt?: number;
};

export default function RidesScreen() {
  const { colors } = useTheme();
  const { activeRide } = useDriver();
  const { t } = useTranslation();

  // Real ride history from Convex
  const history = useQuery(API.rides.myHistory, { limit: 20 }) as RideHistoryItem[] | undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[Typography.h2, { color: colors.text, padding: 20 }]}>
          {t('rides.title')}
        </Text>

        {/* Active ride */}
        {activeRide && <ActiveRideCard />}

        {/* No active ride */}
        {!activeRide && (
          <Card style={styles.emptyCard} padding={32}>
            <Ionicons name="car-outline" size={48} color={colors.textMuted} />
            <Text style={[Typography.subtitle, { color: colors.textSecondary, marginTop: 16 }]}>
              {t('rides.noActiveRide')}
            </Text>
          </Card>
        )}

        {/* Ride history */}
        <Text
          style={[
            Typography.subtitle,
            { color: colors.text, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
          ]}
        >
          {t('rides.rideHistory')}
        </Text>

        {history === undefined ? (
          <RideHistorySkeleton />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.historyCard} padding={14}>
                <View style={styles.historyRow}>
                  <View style={styles.historyInfo}>
                    <View style={styles.locationRow}>
                      <Ionicons name="radio-button-on" size={12} color={colors.success} />
                      <Text
                        style={[Typography.bodySmall, { color: colors.text, marginLeft: 8 }]}
                        numberOfLines={1}
                      >
                        {item.pickup.address}
                      </Text>
                    </View>
                    <View style={[styles.locationRow, { marginTop: 6 }]}>
                      <Ionicons name="location" size={12} color={colors.danger} />
                      <Text
                        style={[Typography.bodySmall, { color: colors.text, marginLeft: 8 }]}
                        numberOfLines={1}
                      >
                        {item.dropoff.address}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={[Typography.label, { color: colors.text }]}>
                      {formatCurrency(item.finalFare ?? item.fare)}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                      {formatTime(item.completedAt ?? item.createdAt)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.status === 'completed' || item.status === 'rated'
                              ? colors.successBg
                              : colors.dangerBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          Typography.caption,
                          {
                            color:
                              item.status === 'completed' || item.status === 'rated'
                                ? colors.success
                                : colors.danger,
                          },
                        ]}
                      >
                        {item.status === 'completed' || item.status === 'rated'
                          ? t('rides.completed')
                          : t('rides.cancelled')}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <Text
                style={[
                  Typography.bodySmall,
                  { color: colors.textMuted, textAlign: 'center', paddingVertical: 32 },
                ]}
              >
                {t('rides.noRides')}
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  emptyCard: { marginHorizontal: 20, alignItems: 'center' },
  list: { paddingHorizontal: 20, gap: 10, paddingBottom: 20 },
  historyCard: {},
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyInfo: { flex: 1, marginRight: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  historyMeta: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
});
