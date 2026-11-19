import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const colors = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
};

export const PrimaryButton: React.FC<{
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  style?: ViewStyle;
}> = ({ title, onPress, disabled, variant = 'primary', style }) => {
  const colors = useTheme();
  const bg =
    variant === 'danger'
      ? colors.danger
      : variant === 'outline'
      ? 'transparent'
      : colors.primary;
  const textColor = variant === 'outline' ? colors.primary : '#FFFFFF';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      style={[
        styles.btn,
        {
          backgroundColor: disabled ? colors.border : bg,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: disabled ? colors.textMuted : textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export const HealthDisclaimerModal: React.FC<{
  visible: boolean;
  title: string;
  body: string;
  buttonText: string;
  onAccept: () => void;
}> = ({ visible, title, body, buttonText, onAccept }) => {
  const colors = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.modalBody, { color: colors.textMuted }]}>{body}</Text>
          <PrimaryButton title={buttonText} onPress={onAccept} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  btn: {
    minHeight: 48, // Section 13 Accessibility: >= 48dp tap target
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnText: { fontSize: 15, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { borderRadius: 18, padding: 22 },
  modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: 10 },
  modalBody: { fontSize: 14, lineHeight: 21, marginBottom: 18 },
});
