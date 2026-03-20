import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { useTheme } from '../../lib/providers/theme';

type Props = ViewProps & {
  padding?: number;
  style?: ViewStyle;
};

export function Card({ children, padding = 16, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
});
