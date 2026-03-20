import { useEffect } from 'react';
import { View, StyleSheet, Animated, useAnimatedValue, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/providers/theme';

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const { colors } = useTheme();
  const opacity = useAnimatedValue(0.3);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function EarningsSkeletonCard() {
  return (
    <View style={skeletonStyles.earningsCard}>
      <Skeleton width={120} height={14} />
      <Skeleton width={180} height={36} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
}

export function StatsGridSkeleton() {
  return (
    <View style={skeletonStyles.gridRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.gridCard}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={60} height={24} style={{ marginTop: 8 }} />
          <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

export function RideHistorySkeleton() {
  return (
    <View style={skeletonStyles.historyList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.historyCard}>
          <View style={{ flex: 1 }}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Skeleton width={70} height={16} />
            <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  earningsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  gridCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  historyList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    padding: 14,
  },
});
