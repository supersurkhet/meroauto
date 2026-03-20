import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { useTheme } from '../../lib/providers/theme';
import { useAuth } from '../../lib/providers/auth';
import { useDriver } from '../../lib/providers/driver';
import { API } from '../../lib/api';
import { Typography } from '../../constants/typography';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { profile } = useDriver();
  const { t, i18n } = useTranslation();

  // Real QR code from Convex
  const qrCode = useQuery(API.qr.myQrCode) as {
    code: string;
    _id: string;
  } | null | undefined;

  // Real vehicles from Convex
  const vehicles = useQuery(API.vehicles.myVehicles) as Array<{
    _id: string;
    registrationNumber: string;
    color?: string;
    type: string;
    seatCapacity: number;
  }> | undefined;

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === 'en' ? 'ne' : 'en');
  }

  function handleLogout() {
    Alert.alert(t('auth.logout'), 'Are you sure?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: logout },
    ]);
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'car',
      label: t('profile.vehicle'),
      onPress: () => router.push('/vehicle' as any),
    },
    {
      icon: 'language',
      label: `${t('profile.language')}: ${i18n.language === 'en' ? 'English' : 'नेपाली'}`,
      onPress: toggleLanguage,
    },
    {
      icon: 'help-circle',
      label: t('profile.help'),
      onPress: () => {},
    },
    {
      icon: 'information-circle',
      label: t('profile.about'),
      onPress: () => {},
    },
    {
      icon: 'log-out',
      label: t('auth.logout'),
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[Typography.h2, { color: colors.text, padding: 20 }]}>
          {t('profile.title')}
        </Text>

        {/* User info + driver stats */}
        <Card style={styles.userCard} padding={20}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[Typography.h2, { color: '#FFFFFF' }]}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'D'}
            </Text>
          </View>
          <Text style={[Typography.h3, { color: colors.text, marginTop: 12 }]}>
            {user?.name ?? 'Driver'}
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
            {user?.email ?? ''}
          </Text>
          {profile && (
            <View style={styles.driverStats}>
              <View style={styles.driverStat}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={[Typography.label, { color: colors.text, marginLeft: 4 }]}>
                  {profile.rating.toFixed(1)}
                </Text>
              </View>
              <View style={styles.driverStat}>
                <Ionicons name="car" size={16} color={colors.info} />
                <Text style={[Typography.label, { color: colors.text, marginLeft: 4 }]}>
                  {profile.totalRides} rides
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: profile.status === 'offline' ? colors.offline : colors.online }]} />
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                {profile.status}
              </Text>
            </View>
          )}
        </Card>

        {/* QR Code — from Convex */}
        <Card style={styles.qrCard} padding={24}>
          <Text style={[Typography.subtitle, { color: colors.text, marginBottom: 4 }]}>
            {t('profile.myQr')}
          </Text>
          <Text
            style={[Typography.caption, { color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }]}
          >
            {t('profile.qrHint')}
          </Text>
          {qrCode === undefined ? (
            <ActivityIndicator color={colors.primary} />
          ) : qrCode ? (
            <View style={styles.qrContainer}>
              <QRCode
                value={`meroauto://qr/${qrCode.code}`}
                size={180}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
              <Text style={[Typography.mono, { color: colors.text, marginTop: 12, fontSize: 16 }]}>
                {qrCode.code}
              </Text>
            </View>
          ) : (
            <Text style={[Typography.bodySmall, { color: colors.textMuted, textAlign: 'center' }]}>
              No QR code assigned yet. Contact admin.
            </Text>
          )}
        </Card>

        {/* Current vehicle */}
        {vehicles && vehicles.length > 0 && (
          <Card style={styles.vehicleCard} padding={16}>
            <View style={styles.vehicleRow}>
              <Ionicons name="car-sport" size={24} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[Typography.subtitle, { color: colors.text }]}>
                  {vehicles[0].registrationNumber}
                </Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  {vehicles[0].color ?? ''} {vehicles[0].type === 'auto_rickshaw' ? 'Auto Rickshaw' : 'E-Rickshaw'} · {vehicles[0].seatCapacity} seats
                </Text>
              </View>
              <Pressable onPress={() => router.push('/vehicle' as any)}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </Card>
        )}

        {/* Menu */}
        <Card style={styles.menuCard} padding={0}>
          {menuItems.map((item, idx) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuItem,
                {
                  backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                  borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={item.danger ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[
                  Typography.body,
                  { color: item.danger ? colors.danger : colors.text, flex: 1, marginLeft: 14 },
                ]}
              >
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </Card>

        <Text
          style={[Typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 24 }]}
        >
          {t('profile.version')} 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  userCard: { marginHorizontal: 20, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  driverStats: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  driverStat: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  qrCard: { marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
  qrContainer: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, alignItems: 'center' },
  vehicleCard: { marginHorizontal: 20, marginTop: 16 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center' },
  menuCard: { marginHorizontal: 20, marginTop: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
});
