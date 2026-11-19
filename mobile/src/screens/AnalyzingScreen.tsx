import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import { analyzeMealPhoto } from '../config/api';
import { MealCategory } from '../types';

export const AnalyzingScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const { session, userAllergies } = useApp();
  const { photoUri, mealType }: { photoUri?: string; mealType: MealCategory } = route.params || { mealType: 'Lunch' };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const start = Date.now();
      const result = await analyzeMealPhoto(photoUri || '', mealType, session.token, userAllergies);
      const elapsed = Date.now() - start;
      if (elapsed < 900) {
        await new Promise((r) => setTimeout(r, 900 - elapsed));
      }
      if (mounted) {
        navigation.replace('ReviewMeal', {
          photoUri,
          mealType,
          initialItems: result.items,
          usedBackend: result.usedBackend,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [photoUri, mealType, navigation, session.token, userAllergies]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      <Text style={[styles.title, { color: colors.text }]}>{t('identifyingFood')}</Text>
      <Text style={{ color: colors.textMuted, marginTop: 6 }}>Estimating portions & nutrition...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  preview: { width: 240, height: 240, borderRadius: 20 },
  title: { fontSize: 20, fontWeight: '800', marginTop: 18 },
});
