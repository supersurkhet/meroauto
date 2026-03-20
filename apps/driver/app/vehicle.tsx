import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useTheme } from '../lib/providers/theme';
import { API } from '../lib/api';
import { Typography } from '../constants/typography';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function VehicleScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Real vehicles from Convex
  const vehicles = useQuery(API.vehicles.myVehicles) as Array<{
    _id: any;
    registrationNumber: string;
    color?: string;
    type: string;
    seatCapacity: number;
  }> | undefined;

  const registerVehicleMut = useMutation(API.vehicles.register);
  const updateVehicleMut = useMutation(API.vehicles.update);

  const existingVehicle = vehicles?.[0];

  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleType, setVehicleType] = useState<'auto_rickshaw' | 'e_rickshaw'>('auto_rickshaw');
  const [capacity, setCapacity] = useState('3');
  const [saving, setSaving] = useState(false);

  // Pre-fill form with existing vehicle
  useEffect(() => {
    if (existingVehicle) {
      setPlateNumber(existingVehicle.registrationNumber);
      setVehicleColor(existingVehicle.color ?? '');
      setVehicleType(existingVehicle.type as any);
      setCapacity(String(existingVehicle.seatCapacity));
    }
  }, [existingVehicle]);

  async function handleSave() {
    if (!plateNumber) return;
    setSaving(true);
    try {
      if (existingVehicle) {
        await updateVehicleMut({
          vehicleId: existingVehicle._id,
          color: vehicleColor || undefined,
        });
      } else {
        await registerVehicleMut({
          type: vehicleType,
          registrationNumber: plateNumber,
          color: vehicleColor || undefined,
          seatCapacity: Number(capacity),
        });
      }
      router.back();
    } catch (e: any) {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  if (vehicles === undefined) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[Typography.h3, { color: colors.text }]}>
          {existingVehicle ? t('profile.editVehicle') : t('profile.addVehicle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Vehicle type selector */}
        <View style={styles.typeRow}>
          {(['auto_rickshaw', 'e_rickshaw'] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => !existingVehicle && setVehicleType(type)}
              style={[
                styles.typeBtn,
                {
                  backgroundColor: vehicleType === type ? colors.primary : colors.surface,
                  borderColor: vehicleType === type ? colors.primary : colors.border,
                  opacity: existingVehicle ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons
                name="car-sport"
                size={32}
                color={vehicleType === type ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  Typography.label,
                  {
                    color: vehicleType === type ? '#FFFFFF' : colors.text,
                    marginTop: 8,
                    textAlign: 'center',
                  },
                ]}
              >
                {type === 'auto_rickshaw' ? 'Auto\nRickshaw' : 'E-Rickshaw'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={[Typography.label, { color: colors.textSecondary, marginBottom: 6 }]}>
            {t('profile.vehiclePlate')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                opacity: existingVehicle ? 0.6 : 1,
              },
            ]}
            value={plateNumber}
            onChangeText={setPlateNumber}
            placeholder="Ba 1 Pa 1234"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            editable={!existingVehicle}
          />

          <Text
            style={[Typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 16 }]}
          >
            {t('profile.vehicleColor')}
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
            value={vehicleColor}
            onChangeText={setVehicleColor}
            placeholder="Green"
            placeholderTextColor={colors.textMuted}
          />

          <Text
            style={[Typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 16 }]}
          >
            {t('profile.vehicleCapacity')}
          </Text>
          <View style={styles.capacityRow}>
            {['2', '3', '4', '6'].map((cap) => (
              <Pressable
                key={cap}
                onPress={() => !existingVehicle && setCapacity(cap)}
                style={[
                  styles.capacityBtn,
                  {
                    backgroundColor: capacity === cap ? colors.primary : colors.surface,
                    borderColor: capacity === cap ? colors.primary : colors.border,
                    opacity: existingVehicle ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[Typography.label, { color: capacity === cap ? '#FFFFFF' : colors.text }]}
                >
                  {cap}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title={existingVehicle ? t('common.save') : t('profile.addVehicle')}
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
            style={{ marginTop: 32 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {},
  input: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, fontSize: 16 },
  capacityRow: { flexDirection: 'row', gap: 12 },
  capacityBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
