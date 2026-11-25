/**
 * Real Google Sign-In OAuth Configuration (expo-auth-session).
 *
 * To enable real "Continue with Google":
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create OAuth 2.0 Client IDs:
 *    - Web application Client ID (required for Expo Go / AuthSession proxy)
 *    - Android Client ID (Package: com.informeddiet.app + your SHA-1 fingerprint)
 * 3. Paste your real Client IDs below.
 */
export const GOOGLE_AUTH_CONFIG = {
  webClientId: '312007967549-kp5jcm0cs2uftkjaas1tokbr85mgj62t.apps.googleusercontent.com',
  androidClientId: '',
  iosClientId: '',
};

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    GOOGLE_AUTH_CONFIG.webClientId.trim() || GOOGLE_AUTH_CONFIG.androidClientId.trim()
  );
}
