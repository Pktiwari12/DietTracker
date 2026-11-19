import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../config/brand';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from '../components/CommonUI';
import { useApp } from '../context/AppContext';

const SLIDES = [
  {
    icon: 'camera-outline' as const,
    title: 'Click a photo of your meal',
    desc: 'Skip searching and typing. Snap your plate and let AI detect Indian and global dishes in seconds.',
  },
  {
    icon: 'nutrition-outline' as const,
    title: 'Get instant nutrition details',
    desc: 'See calories, protein, carbs, fat, vitamins, and minerals with easy portion editing before saving.',
  },
  {
    icon: 'trophy-outline' as const,
    title: 'Reach your health goals',
    desc: 'Track food, water, weight, and exercise in one place with daily guidance on what to eat next.',
  },
];

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { setSeenWelcome } = useApp();
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  const finish = () => {
    setSeenWelcome();
    navigation.replace('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        <Image source={BRAND.logoAsset} style={styles.smallLogo} />
        <TouchableOpacity onPress={finish} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
          <Ionicons name={slide.icon} size={64} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.desc, { color: colors.textMuted }]}>{slide.desc}</Text>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === idx ? colors.primary : colors.border, width: i === idx ? 24 : 8 },
              ]}
            />
          ))}
        </View>
      </View>

      <PrimaryButton
        title={idx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        onPress={() => (idx === SLIDES.length - 1 ? finish() : setIdx(idx + 1))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between', paddingTop: 54 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLogo: { width: 42, height: 42, borderRadius: 10 },
  skipBtn: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 },
  skipText: { fontSize: 15, fontWeight: '700' },
  body: { alignItems: 'center', paddingHorizontal: 12 },
  iconCircle: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28 },
  dot: { height: 8, borderRadius: 4 },
});
