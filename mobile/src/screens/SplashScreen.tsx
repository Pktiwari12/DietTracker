import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BRAND } from '../config/brand';

export const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <View style={[styles.container, { backgroundColor: BRAND.splashBackgroundColor }]}>
      <Image source={BRAND.logoAsset} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{BRAND.appName}</Text>
      <Text style={styles.sub}>Snap. Know. Thrive.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 130, height: 130, marginBottom: 18, borderRadius: 28 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: 0.5 },
  sub: { color: '#E8F5E9', fontSize: 15, marginTop: 6 },
});
