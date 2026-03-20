import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { Card } from '@/components/ui/Card';
import i18n from '@/lib/i18n';

type MenuItemProps = {
  icon: string;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
};

function MenuItem({ icon, label, onPress, trailing, danger }: MenuItemProps) {
  const { c } = useTheme();
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: danger ? c.dangerLight : c.primaryLight },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? c.danger : c.primary}
        />
      </View>
      <Text
        style={[styles.menuLabel, { color: danger ? c.danger : c.text }]}
      >
        {label}
      </Text>
      {trailing ?? <Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
    </TouchableOpacity>
  );
}

function ProfileScreenInner() {
  const { c, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const isNepali = i18n.language === 'ne';

  const toggleLanguage = () => {
    i18n.changeLanguage(isNepali ? 'en' : 'ne');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: c.primaryLight }]}>
          <Ionicons name="person" size={36} color={c.primary} />
        </View>
        <Text style={[styles.name, { color: c.text }]}>
          {user?.firstName ?? 'Rider'} {user?.lastName ?? ''}
        </Text>
        <Text style={[styles.email, { color: c.textSecondary }]}>
          {user?.email ?? 'rider@meroauto.com'}
        </Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Account</Text>
        <Card style={styles.menuCard}>
          <MenuItem icon="person-outline" label={t('profile.editProfile')} />
          <View style={[styles.separator, { backgroundColor: c.border }]} />
          <MenuItem icon="bookmark-outline" label={t('profile.savedPlaces')} />
          <View style={[styles.separator, { backgroundColor: c.border }]} />
          <MenuItem icon="wallet-outline" label={t('profile.paymentMethods')} />
        </Card>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Preferences</Text>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="language-outline"
            label={t('profile.language')}
            onPress={toggleLanguage}
            trailing={
              <View style={styles.langToggle}>
                <Text style={[styles.langText, { color: !isNepali ? c.primary : c.textMuted }]}>
                  EN
                </Text>
                <Text style={[styles.langDivider, { color: c.textMuted }]}>/</Text>
                <Text style={[styles.langText, { color: isNepali ? c.primary : c.textMuted }]}>
                  ने
                </Text>
              </View>
            }
          />
          <View style={[styles.separator, { backgroundColor: c.border }]} />
          <MenuItem
            icon="moon-outline"
            label={t('profile.darkMode')}
            trailing={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: c.border, true: c.primaryLight }}
                thumbColor={isDark ? c.primary : '#f4f3f4'}
              />
            }
          />
          <View style={[styles.separator, { backgroundColor: c.border }]} />
          <MenuItem icon="notifications-outline" label={t('profile.notifications')} />
        </Card>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Support</Text>
        <Card style={styles.menuCard}>
          <MenuItem icon="help-circle-outline" label={t('profile.help')} />
          <View style={[styles.separator, { backgroundColor: c.border }]} />
          <MenuItem icon="information-circle-outline" label={t('profile.about')} />
        </Card>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <Card style={styles.menuCard}>
          <MenuItem icon="log-out-outline" label={t('auth.logout')} onPress={logout} danger />
        </Card>
      </View>

      <Text style={[styles.version, { color: c.textMuted }]}>
        {t('profile.version', { version: '1.0.0' })}
      </Text>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <ScreenErrorBoundary>
      <ProfileScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 2 },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: { padding: 0 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  separator: { height: 0.5, marginLeft: 62 },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langText: { fontSize: 14, fontWeight: '600' },
  langDivider: { fontSize: 14 },
  version: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
