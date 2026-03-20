import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { c, isDark } = useTheme();
  const { t } = useTranslation();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
      router.replace('/(tabs)');
    } catch {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={[styles.iconContainer, { backgroundColor: c.primaryLight }]}>
          <Ionicons name="car-sport" size={48} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>{t('auth.welcome')}</Text>
        <Text style={[styles.tagline, { color: c.primary }]}>{t('auth.tagline')}</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          {t('auth.loginSubtitle')}
        </Text>
      </View>

      {/* Auto Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={[styles.autoShape, { backgroundColor: c.primaryLight }]}>
          <Ionicons name="navigate" size={64} color={c.primary} style={{ opacity: 0.6 }} />
        </View>
        <View style={[styles.roadLine, { backgroundColor: c.border }]} />
        <View style={styles.dotRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i % 2 === 0 ? c.primary : c.accent, opacity: 0.3 + i * 0.15 },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={t('auth.login')}
          onPress={handleLogin}
          loading={isLoading}
          size="lg"
        />

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Text style={[styles.dividerText, { color: c.textMuted }]}>
            {t('auth.orContinueWith')}
          </Text>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
        </View>

        <Button
          title={t('auth.signup')}
          onPress={() => router.push('/(auth)/signup')}
          variant="outline"
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  autoShape: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadLine: {
    width: width * 0.6,
    height: 2,
    borderRadius: 1,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    gap: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
});
