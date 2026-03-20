import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { c } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: c.skeleton,
          opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] }),
        },
        style,
      ]}
    />
  );
}

/** Skeleton for a ride history card */
export function RideCardSkeleton() {
  const { c } = useTheme();
  return (
    <View style={[skeletonStyles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={skeletonStyles.row}>
        <Skeleton width={100} height={14} />
        <Skeleton width={70} height={22} borderRadius={6} />
      </View>
      <View style={skeletonStyles.routeSection}>
        <View style={skeletonStyles.dots}>
          <Skeleton width={10} height={10} borderRadius={5} />
          <View style={[skeletonStyles.line, { backgroundColor: c.skeleton }]} />
          <Skeleton width={10} height={10} borderRadius={5} />
        </View>
        <View style={skeletonStyles.texts}>
          <Skeleton width="80%" height={14} />
          <Skeleton width="65%" height={14} />
        </View>
      </View>
      <View style={[skeletonStyles.footer, { borderTopColor: c.border }]}>
        <Skeleton width={120} height={12} />
        <Skeleton width={70} height={20} />
      </View>
    </View>
  );
}

/** Skeleton for the home map bottom card */
export function HomeCardSkeleton() {
  const { c } = useTheme();
  return (
    <View style={[skeletonStyles.homeCard, { backgroundColor: c.card }]}>
      <Skeleton height={48} borderRadius={12} />
      <View style={skeletonStyles.row}>
        <Skeleton width="48%" height={44} borderRadius={12} />
        <Skeleton width="48%" height={44} borderRadius={12} />
      </View>
      <Skeleton width={140} height={12} />
    </View>
  );
}

/** Skeleton for booking fare estimate */
export function FareEstimateSkeleton() {
  return (
    <View style={skeletonStyles.fareCard}>
      <View style={skeletonStyles.row}>
        <Skeleton width={48} height={48} borderRadius={14} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Skeleton width={70} height={20} />
          <Skeleton width={50} height={12} />
        </View>
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeSection: {
    flexDirection: 'row',
    gap: 12,
  },
  dots: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  line: {
    width: 2,
    height: 16,
  },
  texts: {
    flex: 1,
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  homeCard: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fareCard: {
    gap: 12,
  },
});
