import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
};

export function Card({ children, style, variant = 'default' }: Props) {
  const { c } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: c.card,
          borderColor: variant === 'outlined' ? c.border : c.cardBorder,
          borderWidth: variant === 'outlined' ? 1 : 0,
          ...(variant === 'elevated' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
});
