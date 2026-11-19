import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from '../components/CommonUI';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [newPass, setNewPass] = useState('');

  const sendOtp = () => {
    if (!identifier.trim() || newPass.length < 6) {
      Alert.alert('Missing details', 'Enter your email/phone and a new password (min 6 characters).');
      return;
    }
    navigation.navigate('Otp', { emailOrPhone: identifier.trim(), mode: 'forgot' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Reset Password</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Enter your registered email or phone number to receive an OTP.
      </Text>
      <TextInput
        placeholder="Email or Phone number"
        placeholderTextColor={colors.textMuted}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="New Password (min 6 chars)"
        placeholderTextColor={colors.textMuted}
        value={newPass}
        onChangeText={setNewPass}
        secureTextEntry
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <PrimaryButton title="Send OTP" onPress={sendOtp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 14, marginBottom: 20 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, fontSize: 15 },
});
