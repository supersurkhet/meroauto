import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../lib/providers/theme';
import { Typography } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function RideDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Button
          title="Close"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<Ionicons name="close" size={20} color={colors.primary} />}
        />
      </View>
      <View style={styles.content}>
        <Text style={[Typography.h3, { color: colors.text }]}>Ride #{id}</Text>
        <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: 8 }]}>
          Ride details will be loaded from Convex
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
