import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Card } from './ui/Card';

type Props = {
  name: string;
  photo?: string;
  rating: number;
  vehicleNumber: string;
  vehicleColor?: string;
  phone?: string;
  eta?: number;
};

export function DriverCard({
  name,
  photo,
  rating,
  vehicleNumber,
  vehicleColor,
  eta,
}: Props) {
  const { c } = useTheme();

  return (
    <Card variant="elevated" style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: c.primaryLight }]}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={28} color={c.primary} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: c.text }]}>{name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={c.accent} />
            <Text style={[styles.rating, { color: c.textSecondary }]}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        {eta !== undefined && (
          <View style={[styles.etaBadge, { backgroundColor: c.primaryLight }]}>
            <Text style={[styles.etaText, { color: c.primary }]}>{eta} min</Text>
          </View>
        )}
      </View>
      <View style={[styles.vehicleRow, { borderTopColor: c.border }]}>
        <Ionicons name="car-sport" size={18} color={c.textSecondary} />
        <Text style={[styles.vehicleText, { color: c.text }]}>{vehicleNumber}</Text>
        {vehicleColor && (
          <View style={[styles.colorDot, { backgroundColor: vehicleColor }]} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 52, height: 52 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 13 },
  etaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  etaText: { fontSize: 13, fontWeight: '600' },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  vehicleText: { fontSize: 14, fontWeight: '500' },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
});
