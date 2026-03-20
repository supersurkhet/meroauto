import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { useTheme } from '../../lib/providers/theme';
import { useDriver } from '../../lib/providers/driver';
import { API } from '../../lib/api';
import { Typography } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { EarningsSkeletonCard, StatsGridSkeleton } from '../../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../lib/utils/format';
import { Ionicons } from '@expo/vector-icons';

type Period = 'daily' | 'weekly' | 'monthly';

export default function EarningsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { profile } = useDriver();
  const [period, setPeriod] = useState<Period>('daily');

  // Real earnings from Convex
  const earningsData = useQuery(API.drivers.getEarnings, { period: period as any }) as {
    totalRides: number;
    totalEarnings: number;
    rides: Array<{ fare: number; finalFare?: number; completedAt?: number; createdAt: number }>;
  } | null | undefined;

  const totalEarnings = earningsData?.totalEarnings ?? 0;
  const totalRides = earningsData?.totalRides ?? 0;
  const avgPerRide = totalRides > 0 ? Math.round(totalEarnings / totalRides) : 0;

  // Build daily breakdown for weekly view
  const dailyBreakdown = (() => {
    if (period !== 'weekly' || !earningsData?.rides) return [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets: Record<number, number> = {};
    for (const ride of earningsData.rides) {
      const day = new Date(ride.completedAt ?? ride.createdAt).getDay();
      buckets[day] = (buckets[day] ?? 0) + (ride.finalFare ?? ride.fare);
    }
    return days.map((name, i) => ({ day: name, amount: buckets[i] ?? 0 }));
  })();

  const maxAmount = Math.max(...dailyBreakdown.map((d) => d.amount), 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[Typography.h2, { color: colors.text, padding: 20 }]}>
          {t('earnings.title')}
        </Text>

        {/* Period toggle */}
        <View style={[styles.periodRow, { backgroundColor: colors.surfaceAlt, marginHorizontal: 20 }]}>
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[Typography.label, { color: period === p ? '#FFFFFF' : colors.textSecondary }]}
              >
                {t(`earnings.${p}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Total earnings card */}
        <Card style={styles.totalCard} padding={24}>
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {t('earnings.totalEarnings')}
          </Text>
          <Text style={[Typography.h1, { color: colors.text, marginTop: 4 }]}>
            {formatCurrency(totalEarnings)}
          </Text>
        </Card>

        {/* Stats grid — skeleton while loading */}
        {earningsData === undefined ? (
          <>
            <EarningsSkeletonCard />
            <StatsGridSkeleton />
          </>
        ) : null}
        <View style={styles.gridRow}>
          <Card style={styles.gridCard} padding={16}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[Typography.h3, { color: colors.text, marginTop: 6 }]}>{totalRides}</Text>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>
              {t('earnings.ridesCompleted')}
            </Text>
          </Card>
          <Card style={styles.gridCard} padding={16}>
            <Ionicons name="trending-up" size={20} color={colors.info} />
            <Text style={[Typography.h3, { color: colors.text, marginTop: 6 }]}>
              {formatCurrency(avgPerRide)}
            </Text>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>
              {t('earnings.avgPerRide')}
            </Text>
          </Card>
          <Card style={styles.gridCard} padding={16}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={[Typography.h3, { color: colors.text, marginTop: 6 }]}>
              {profile?.rating.toFixed(1) ?? '5.0'}
            </Text>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>Rating</Text>
          </Card>
        </View>

        {/* Weekly bar chart */}
        {period === 'weekly' && dailyBreakdown.length > 0 && (
          <Card style={styles.chartCard} padding={20}>
            <Text style={[Typography.subtitle, { color: colors.text, marginBottom: 16 }]}>
              This Week
            </Text>
            <View style={styles.chart}>
              {dailyBreakdown.map((item) => (
                <View key={item.day} style={styles.barCol}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(item.amount / maxAmount) * 100}%`,
                          backgroundColor: item.amount > 0 ? colors.primary : colors.surfaceAlt,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[Typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
                    {item.day}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Lifetime stats */}
        {profile && (
          <Card style={styles.lifetimeCard} padding={20}>
            <Text style={[Typography.subtitle, { color: colors.text, marginBottom: 12 }]}>
              Lifetime Stats
            </Text>
            <View style={styles.lifetimeRow}>
              <View style={styles.lifetimeStat}>
                <Text style={[Typography.h3, { color: colors.primary }]}>
                  {formatCurrency(profile.totalEarnings)}
                </Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  Total Earnings
                </Text>
              </View>
              <View style={styles.lifetimeStat}>
                <Text style={[Typography.h3, { color: colors.text }]}>{profile.totalRides}</Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  Total Rides
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  periodRow: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  periodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  totalCard: { marginHorizontal: 20, marginTop: 20, alignItems: 'center' },
  gridRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12 },
  gridCard: { flex: 1, alignItems: 'center' },
  chartCard: { marginHorizontal: 20, marginTop: 20 },
  chart: { flexDirection: 'row', height: 120, gap: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  barContainer: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  lifetimeCard: { marginHorizontal: 20, marginTop: 20 },
  lifetimeRow: { flexDirection: 'row', gap: 20 },
  lifetimeStat: { flex: 1 },
});
