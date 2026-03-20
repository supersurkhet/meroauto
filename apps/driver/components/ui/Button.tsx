import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../../lib/providers/theme';
import { Typography } from '../../constants/typography';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  icon,
}: Props) {
  const { colors } = useTheme();

  const bgColors: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surface,
    danger: colors.danger,
    ghost: 'transparent',
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.text,
    danger: '#FFFFFF',
    ghost: colors.primary,
  };

  const heights: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };
  const paddings: Record<ButtonSize, number> = { sm: 12, md: 20, lg: 24 };
  const fontSizes: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColors[variant],
          height: heights[size],
          paddingHorizontal: paddings[size],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              Typography.button,
              { color: textColors[variant], fontSize: fontSizes[size] },
              icon ? { marginLeft: 8 } : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  fullWidth: {
    width: '100%',
  },
});
