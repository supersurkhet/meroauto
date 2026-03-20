import { Pressable, Text, View, StyleSheet, Animated, useAnimatedValue } from 'react-native';
import { useEffect } from 'react';
import { useTheme } from '../../lib/providers/theme';
import { Typography } from '../../constants/typography';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

type Props = {
  isOnline: boolean;
  onToggle: () => void;
};

export function StatusToggle({ isOnline, onToggle }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const animValue = useAnimatedValue(isOnline ? 1 : 0);

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isOnline ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [isOnline]);

  const bgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceAlt, colors.primary],
  });

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  }

  return (
    <Pressable onPress={handleToggle} style={styles.container}>
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [
                {
                  translateX: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 52],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
      <View style={styles.labelRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: isOnline ? colors.online : colors.offline },
          ]}
        />
        <Text style={[Typography.subtitle, { color: colors.text, marginLeft: 8 }]}>
          {isOnline ? t('home.online') : t('home.offline')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  track: {
    width: 96,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
