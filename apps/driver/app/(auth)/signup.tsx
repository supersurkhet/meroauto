import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/providers/theme';
import { useAuth } from '../../lib/providers/auth';
import { Typography } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signup } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      await signup(email, password, name);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            </Link>
            <Text style={[Typography.h2, { color: colors.text, marginTop: 16 }]}>
              {t('auth.signupTitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[Typography.label, { color: colors.textSecondary, marginBottom: 6 }]}>
              Full Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Ram Bahadur"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoComplete="name"
            />

            <Text
              style={[
                Typography.label,
                { color: colors.textSecondary, marginBottom: 6, marginTop: 16 },
              ]}
            >
              {t('auth.email')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="driver@meroauto.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text
              style={[
                Typography.label,
                { color: colors.textSecondary, marginBottom: 6, marginTop: 16 },
              ]}
            >
              {t('auth.password')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="password-new"
            />

            <Button
              title={t('auth.signup')}
              onPress={handleSignup}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 32 }}
            />

            <View style={styles.loginRow}>
              <Text style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                {t('auth.hasAccount')}{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={[Typography.label, { color: colors.primary }]}>
                    {t('auth.login')}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {},
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  form: {
    marginTop: 32,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});
