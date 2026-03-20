import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  type ViewStyle,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({ visible, onClose, children, style }: Props) {
  const { c } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View />
      </TouchableOpacity>
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: c.background,
            maxHeight: SCREEN_HEIGHT * 0.85,
          },
          style,
        ]}
      >
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
