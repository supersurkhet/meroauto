import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/providers/theme';
import { useAuth } from '../../lib/providers/auth';
import { Typography } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      await login();
    } catch (e: any) {
      Alert.alert('Login Failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="car-sport" size={48} color="#FFFFFF" />
          </View>
          <Text style={[Typography.h1, { color: colors.text, marginTop: 24 }]}>
            {t('auth.welcome')}
          </Text>
          <Text
            style={[
              Typography.body,
              { color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
            ]}
          >
            {t('auth.welcomeSub')}
          </Text>
        </View>

        {/* Auth button */}
        <View style={styles.authSection}>
          <Button
            title={t('auth.login')}
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            icon={<Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />}
          />

          <Text
            style={[
              Typography.caption,
              { color: colors.textMuted, marginTop: 16, textAlign: 'center', lineHeight: 18 },
            ]}
          >
            Secure authentication powered by WorkOS AuthKit.{'\n'}
            Sign in or create an account automatically.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: 'cash-outline' as const, text: 'Earn on your schedule' },
            { icon: 'location-outline' as const, text: 'GPS-based ride matching' },
            { icon: 'qr-code-outline' as const, text: 'Instant QR rides' },
          ].map((item) => (
            <View key={item.text} style={styles.featureRow}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
              <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginLeft: 12 }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authSection: {
    marginBottom: 48,
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
