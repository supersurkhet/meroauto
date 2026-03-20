import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useMutation, useQuery, api } from '@/lib/convex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { useNetwork } from '@/lib/network';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/payment';

function PaymentScreenInner() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetwork();
  const toast = useToast();
  const params = useLocalSearchParams<{
    rideId?: string;
    fare?: string;
    riderId?: string;
    driverId?: string;
  }>();

  const fare = Number(params.fare ?? 180);
  const rideId = params.rideId;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const createPayment = useMutation(api.payments.createPayment);

  // Check if payment already exists for this ride
  const existingPayment = useQuery(
    api.payments.getPaymentByRide,
    rideId ? { rideId } : 'skip'
  );

  const handlePay = async () => {
    if (!isOnline) { toast.error('Cannot pay while offline'); return; }
    if (!rideId || !params.riderId || !params.driverId) {
      Alert.alert(t('common.error'), 'Missing ride information');
      return;
    }

    if (existingPayment) {
      // Payment already exists, skip to rating
      setPaymentDone(true);
      setTimeout(() => {
        router.replace({ pathname: '/ride/rating', params: { rideId } });
      }, 1000);
      return;
    }

    setIsProcessing(true);
    try {
      await createPayment({
        rideId: rideId as any,
        riderId: params.riderId as any,
        driverId: params.driverId as any,
        amount: fare,
        method: selectedMethod,
      });

      setPaymentDone(true);
      setTimeout(() => {
        router.replace({ pathname: '/ride/rating', params: { rideId } });
      }, 1500);
    } catch (error: any) {
      Alert.alert(t('payment.failed'), error.message ?? 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentDone) {
    return (
      <View style={[styles.successContainer, { backgroundColor: c.background }]}>
        <View style={[styles.successIcon, { backgroundColor: c.successLight }]}>
          <Ionicons name="checkmark-circle" size={64} color={c.success} />
        </View>
        <Text style={[styles.successTitle, { color: c.text }]}>{t('payment.success')}</Text>
        <Text style={[styles.successAmount, { color: c.primary }]}>Rs. {fare}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('payment.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.amountSection}>
          <Text style={[styles.amountLabel, { color: c.textSecondary }]}>{t('payment.total')}</Text>
          <Text style={[styles.amountValue, { color: c.text }]}>Rs. {fare}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 4 }]}>
          {t('payment.selectMethod')}
        </Text>
        <View style={styles.methodsList}>
          {PAYMENT_METHODS.map((pm) => (
            <TouchableOpacity
              key={pm.method}
              style={[
                styles.methodCard,
                {
                  backgroundColor: selectedMethod === pm.method ? c.primaryLight : c.card,
                  borderColor: selectedMethod === pm.method ? c.primary : c.border,
                  borderWidth: selectedMethod === pm.method ? 1.5 : 1,
                },
              ]}
              onPress={() => setSelectedMethod(pm.method)}
            >
              <View style={[styles.methodIcon, { backgroundColor: pm.color + '20' }]}>
                <Ionicons name={pm.icon as any} size={24} color={pm.color} />
              </View>
              <Text style={[styles.methodName, { color: c.text }]}>{t(pm.label)}</Text>
              {selectedMethod === pm.method && (
                <Ionicons name="checkmark-circle" size={22} color={c.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: c.background }]}>
        <Button
          title={
            selectedMethod === 'cash'
              ? t('payment.payWithCash')
              : t('payment.pay', { amount: fare })
          }
          onPress={handlePay}
          loading={isProcessing}
          size="lg"
        />
      </View>
    </View>
  );
}

export default function PaymentScreen() {
  return (
    <ScreenErrorBoundary>
      <PaymentScreenInner />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  content: { padding: 16, gap: 20 },
  amountSection: { alignItems: 'center', paddingVertical: 20 },
  amountLabel: { fontSize: 14, marginBottom: 4 },
  amountValue: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  methodsList: { gap: 10 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 14,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: { flex: 1, fontSize: 16, fontWeight: '500' },
  footer: { padding: 16, paddingTop: 8 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '700' },
  successAmount: { fontSize: 36, fontWeight: '800' },
});
