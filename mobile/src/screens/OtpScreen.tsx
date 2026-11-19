import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from '../components/CommonUI';
import { useApp } from '../context/AppContext';

export const OtpScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const colors = useTheme();
  const { login } = useApp();
  const { emailOrPhone, name, mode } = route.params || {};
  const [otp, setOtp] = useState('');

  const verify = () => {
    if (otp.trim().length < 4) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit verification code (demo: any 4-6 digits e.g. 123456).');
      return;
    }
    if (mode === 'forgot') {
      Alert.alert('Password Reset', 'Your password has been updated. Please log in.');
      navigation.navigate('Login');
    } else {
      login(emailOrPhone || 'user@informeddiet.app', name);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Verify OTP</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        We sent a verification code to {emailOrPhone || 'your contact'}. (For local testing, enter any 4–6 digits.)
      </Text>
      <TextInput
        placeholder="Enter 6-digit OTP"
        placeholderTextColor={colors.textMuted}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <PrimaryButton title="Verify & Continue" onPress={verify} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 22 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 20, letterSpacing: 6, textAlign: 'center', marginBottom: 20 },
});
