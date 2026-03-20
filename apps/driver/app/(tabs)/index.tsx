import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { useTheme } from '../../lib/providers/theme';
import { useDriver } from '../../lib/providers/driver';
import { API } from '../../lib/api';
import { Typography } from '../../constants/typography';
import { StatusToggle } from '../../components/ui/StatusToggle';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../lib/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { RideRequestModal } from '../../components/ride/RideRequestModal';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile, isOnline, toggleStatus, pendingRequests, isLoading, error } = useDriver();
  const { t } = useTranslation();

  // Fetch today's earnings from Convex
  const earnings = useQuery(API.drivers.getEarnings, { period: 'daily' as any }) as {
    totalRides: number;
    totalEarnings: number;
  } | null | undefined;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const todayEarnings = earnings?.totalEarnings ?? profile?.totalEarnings ?? 0;
  const todayRides = earnings?.totalRides ?? profile?.totalRides ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[Typography.h2, { color: colors.text }]}>
            {t('common.appName')}
          </Text>
          {profile && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={[Typography.label, { color: colors.text, marginLeft: 4 }]}>
                {profile.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Toggle */}
        <View style={styles.toggleArea}>
          <View
            style={[
              styles.toggleRing,
              {
                backgroundColor: isOnline ? colors.successBg : colors.surfaceAlt,
                borderColor: isOnline ? colors.success : colors.border,
              },
            ]}
          >
            <StatusToggle isOnline={isOnline} onToggle={toggleStatus} />
          </View>
          <Text
            style={[
              Typography.bodySmall,
              { color: colors.textSecondary, marginTop: 12, textAlign: 'center' },
            ]}
          >
            {isOnline ? t('home.waitingForRides') : t('home.tapToGoOnline')}
          </Text>
        </View>

        {/* Stats from real data */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding={16}>
            <Ionicons name="cash" size={24} color={colors.primary} />
            <Text style={[Typography.mono, { color: colors.text, marginTop: 8, fontSize: 22 }]}>
              {formatCurrency(todayEarnings)}
            </Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {t('home.todayEarnings')}
            </Text>
          </Card>

          <Card style={styles.statCard} padding={16}>
            <Ionicons name="car" size={24} color={colors.info} />
            <Text style={[Typography.mono, { color: colors.text, marginTop: 8, fontSize: 22 }]}>
              {todayRides}
            </Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {t('home.totalRides')}
            </Text>
          </Card>

          <Card style={styles.statCard} padding={16}>
            <Ionicons name="star" size={24} color={colors.warning} />
            <Text style={[Typography.mono, { color: colors.text, marginTop: 8, fontSize: 22 }]}>
              {profile?.rating.toFixed(1) ?? '5.0'}
            </Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Rating
            </Text>
          </Card>
        </View>

        {/* Error banner */}
        {error && (
          <Card style={{ ...styles.warningCard, borderColor: colors.danger }} padding={12}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[Typography.bodySmall, { color: colors.danger, marginLeft: 10, flex: 1 }]}>
              {error}
            </Text>
          </Card>
        )}

        {/* Not approved warning */}
        {profile && !profile.isApproved && (
          <Card style={styles.warningCard} padding={16}>
            <Ionicons name="warning" size={24} color={colors.warning} />
            <Text style={[Typography.bodySmall, { color: colors.text, marginLeft: 12, flex: 1 }]}>
              Your account is pending admin approval. You cannot go online yet.
            </Text>
          </Card>
        )}

        {/* Suspended warning */}
        {profile?.isSuspended && (
          <Card style={{ ...styles.warningCard, borderColor: colors.danger }} padding={16}>
            <Ionicons name="ban" size={24} color={colors.danger} />
            <Text style={[Typography.bodySmall, { color: colors.danger, marginLeft: 12, flex: 1 }]}>
              Your account has been suspended. Contact support.
            </Text>
          </Card>
        )}

        {/* Offline message */}
        {!isOnline && !profile?.isSuspended && profile?.isApproved && (
          <Card style={styles.offlineCard} padding={20}>
            <Ionicons name="moon" size={32} color={colors.textMuted} />
            <Text
              style={[Typography.subtitle, { color: colors.textSecondary, marginTop: 12 }]}
            >
              {t('home.youAreOffline')}
            </Text>
            <Text
              style={[Typography.bodySmall, { color: colors.textMuted, marginTop: 4, textAlign: 'center' }]}
            >
              {t('home.tapToGoOnline')}
            </Text>
          </Card>
        )}
      </View>

      {/* Ride request modal — shows when there's a pending matched request */}
      {pendingRequests.length > 0 && <RideRequestModal request={pendingRequests[0]} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  toggleArea: { alignItems: 'center', paddingVertical: 32 },
  toggleRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center' },
  warningCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineCard: { marginTop: 24, alignItems: 'center' },
});
