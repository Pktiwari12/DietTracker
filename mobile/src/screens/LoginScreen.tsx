import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BRAND } from '../config/brand';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from '../components/CommonUI';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter your email/phone and password.');
      return;
    }
    login(identifier.trim());
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={BRAND.logoAsset} style={styles.logo} />
      <Text style={[styles.appName, { color: colors.primary }]}>{BRAND.appName}</Text>
      <Text style={[styles.heading, { color: colors.text }]}>{t('welcomeBack')}</Text>

      <TextInput
        placeholder="Email or Phone number"
        placeholderTextColor={colors.textMuted}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
        <Text style={[styles.link, { color: colors.primary }]}>{t('forgotPassword')}</Text>
      </TouchableOpacity>

      <PrimaryButton title={t('logIn')} onPress={handleLogin} style={{ width: '100%' }} />

      <Text style={[styles.or, { color: colors.textMuted }]}>— or —</Text>

      <PrimaryButton
        title={t('continueGoogle')}
        variant="outline"
        onPress={() => login('google.user@informeddiet.app', 'Aman')}
        style={{ width: '100%' }}
      />

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.bottomLink}>
        <Text style={{ color: colors.textMuted }}>
          New here? <Text style={{ color: colors.primary, fontWeight: '700' }}>Create an account</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 88, height: 88, borderRadius: 20, marginBottom: 10 },
  appName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 24 },
  input: { width: '100%', minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, fontSize: 15 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 18, minHeight: 36, justifyContent: 'center' },
  link: { fontWeight: '700', fontSize: 14 },
  or: { marginVertical: 16, fontSize: 13 },
  bottomLink: { marginTop: 24, minHeight: 48, justifyContent: 'center' },
});
