import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useMutation, useQuery, api } from '@/lib/convex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/RatingStars';

function RatingScreenInner() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ rideId?: string }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitRating = useMutation(api.ratings.submitRating);

  // Get ride to know who the driver is
  const ride = useQuery(
    api.rides.getRideById,
    params.rideId ? { rideId: params.rideId } : 'skip'
  );

  const handleSubmit = async () => {
    if (!params.rideId || !user?.id || !ride?.driver) {
      router.replace('/(tabs)');
      return;
    }

    try {
      await submitRating({
        rideId: params.rideId as any,
        fromUserId: user.id,
        toUserId: ride.driver.userId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => router.replace('/(tabs)'), 2000);
    } catch (err: any) {
      // Already rated or other error — just go home
      Alert.alert(t('common.error'), err.message);
      router.replace('/(tabs)');
    }
  };

  if (submitted) {
    return (
      <View style={[styles.successContainer, { backgroundColor: c.background }]}>
        <View style={[styles.successIcon, { backgroundColor: c.successLight }]}>
          <Ionicons name="heart" size={48} color={c.success} />
        </View>
        <Text style={[styles.successTitle, { color: c.text }]}>{t('history.thankYou')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top + 20 }]}>
      <View style={styles.content}>
        <View style={[styles.driverIcon, { backgroundColor: c.primaryLight }]}>
          <Ionicons name="person" size={40} color={c.primary} />
        </View>

        {ride?.driver && (
          <Text style={[styles.driverName, { color: c.textSecondary }]}>
            {ride.driver.name}
          </Text>
        )}

        <Text style={[styles.title, { color: c.text }]}>{t('history.rateRide')}</Text>

        <View style={styles.starsSection}>
          <RatingStars rating={rating} onChange={setRating} size={40} />
        </View>

        <TextInput
          style={[
            styles.commentInput,
            { backgroundColor: c.surface, color: c.text, borderColor: c.border },
          ]}
          placeholder={t('history.ratingPlaceholder')}
          placeholderTextColor={c.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={t('history.submitRating')}
          onPress={handleSubmit}
          disabled={rating === 0}
          size="lg"
        />
        <Button
          title={t('common.close')}
          onPress={() => router.replace('/(tabs)')}
          variant="ghost"
        />
      </View>
    </View>
  );
}

export default function RatingScreen() {
  return (
    <ScreenErrorBoundary>
      <RatingScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  driverIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  driverName: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '700' },
  starsSection: { paddingVertical: 8 },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
  footer: { paddingHorizontal: 24, gap: 8 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '600' },
});
