import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { BRAND } from '../config/brand';
import { GOOGLE_AUTH_CONFIG, isGoogleAuthConfigured } from '../config/googleAuth';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from '../components/CommonUI';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleConfigured = isGoogleAuthConfigured();
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_AUTH_CONFIG.webClientId || 'UNCONFIGURED',
    androidClientId: GOOGLE_AUTH_CONFIG.androidClientId || GOOGLE_AUTH_CONFIG.webClientId || 'UNCONFIGURED',
    iosClientId: GOOGLE_AUTH_CONFIG.iosClientId || GOOGLE_AUTH_CONFIG.webClientId || 'UNCONFIGURED',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const accessToken = response.authentication?.accessToken;
      if (!accessToken) {
        Alert.alert('Google Sign-In Failed', 'No access token was returned by Google.');
        return;
      }
      setGoogleLoading(true);
      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((profile) => {
          if (!profile?.email) {
            throw new Error('Google profile did not include an email address.');
          }
          login(profile.email, profile.name || '');
        })
        .catch(() => {
          Alert.alert('Google Sign-In Failed', 'Could not verify your Google account. Please try again.');
        })
        .finally(() => setGoogleLoading(false));
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Error', response.error?.message || 'Authentication failed.');
    }
  }, [response, login]);

  const handleLogin = () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter your email/phone and password.');
      return;
    }
    login(identifier.trim());
  };

  const handleGooglePress = async () => {
    if (!googleConfigured) {
      Alert.alert(
        'Google Sign-In Setup Required',
        'To connect real Google accounts, add your Google Cloud OAuth Client ID in:\n\nmobile/src/config/googleAuth.ts\n\nUntil then, please sign up or log in with your email or phone number.'
      );
      return;
    }
    if (!request) {
      Alert.alert('Please wait', 'Google Sign-In is still initializing. Try again in a moment.');
      return;
    }
    await promptAsync();
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={BRAND.logoAsset} style={styles.logo} />
      <Text style={[styles.appName, { color: colors.primary }]}>{BRAND.appName}</Text>
      <Text style={[styles.heading, { color: colors.text }]}>{t('welcomeBack')}</Text>

      <TextInput
        placeholder="e.g. name@example.com or +91 9876543210"
        placeholderTextColor={colors.textMuted}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        placeholder="Enter your password"
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

      {googleLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginLeft: 8 }}>Verifying Google account...</Text>
        </View>
      ) : (
        <PrimaryButton
          title={t('continueGoogle')}
          variant="outline"
          onPress={handleGooglePress}
          style={{ width: '100%' }}
        />
      )}

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
  loadingRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  bottomLink: { marginTop: 24, minHeight: 48, justifyContent: 'center' },
});