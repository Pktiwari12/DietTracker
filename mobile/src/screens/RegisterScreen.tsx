import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from '../components/CommonUI';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);

  const handleSignUp = () => {
    if (!name.trim() || !identifier.trim() || password.length < 6) {
      Alert.alert('Check details', 'Enter your name, email/phone, and a password of at least 6 characters.');
      return;
    }
    if (!accepted) {
      Alert.alert('Terms required', 'Please accept the Terms of Use and Privacy Policy to continue.');
      return;
    }
    navigation.navigate('Otp', { emailOrPhone: identifier.trim(), name: name.trim(), mode: 'register' });
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Create your account</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>Start tracking your meals with a single photo.</Text>

      <TextInput
        placeholder="e.g. Aman"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="e.g. name@example.com or +91 9876543210"
        placeholderTextColor={colors.textMuted}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="Password (min 6 characters)"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />

      <TouchableOpacity style={styles.checkRow} onPress={() => setAccepted(!accepted)}>
        <Ionicons name={accepted ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
        <Text style={[styles.checkText, { color: colors.textMuted }]}>
          I accept the Terms of Use and Privacy Policy.
        </Text>
      </TouchableOpacity>

      <PrimaryButton title="Sign Up & Verify OTP" onPress={handleSignUp} style={{ width: '100%' }} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrap}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 22 },
  input: { width: '100%', minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, fontSize: 15 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14, minHeight: 48 },
  checkText: { flex: 1, fontSize: 13 },
  backWrap: { alignItems: 'center', marginTop: 22, minHeight: 48, justifyContent: 'center' },
});
