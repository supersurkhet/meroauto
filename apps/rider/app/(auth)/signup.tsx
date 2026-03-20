import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default function SignupScreen() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const { signup } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      await signup();
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          fullWidth={false}
          icon={<Ionicons name="arrow-back" size={20} color={c.primary} />}
          style={styles.backButton}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: c.primaryLight }]}>
            <Ionicons name="person-add" size={36} color={c.primary} />
          </View>
          <Text style={[styles.title, { color: c.text }]}>{t('auth.signup')}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {t('auth.signupSubtitle')}
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.features}>
          {[
            { icon: 'location', text: 'Find autos near you instantly' },
            { icon: 'qr-code', text: 'Scan QR for instant rides' },
            { icon: 'shield-checkmark', text: 'Safe & tracked rides' },
            { icon: 'wallet', text: 'Multiple payment options' },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: c.primaryLight }]}>
                <Ionicons name={feature.icon as any} size={20} color={c.primary} />
              </View>
              <Text style={[styles.featureText, { color: c.text }]}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={t('auth.signup')}
          onPress={handleSignup}
          loading={isLoading}
          size="lg"
        />
        <Button
          title={t('auth.hasAccount') + ' ' + t('auth.login')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  scroll: { flexGrow: 1 },
  backButton: { alignSelf: 'flex-start', marginTop: 8 },
  header: { alignItems: 'center', marginTop: 24, gap: 8 },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  features: { marginTop: 40, gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 15, fontWeight: '500', flex: 1 },
  actions: { gap: 8 },
});
