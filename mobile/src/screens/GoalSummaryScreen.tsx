import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Card, PrimaryButton } from '../components/CommonUI';
import { useApp } from '../context/AppContext';

export const GoalSummaryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { targets, onboarding } = useApp();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Your Daily Plan</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Personalized for {onboarding.name || 'you'} • Goal: {onboarding.primary_goal}
      </Text>

      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <Text style={{ color: colors.textMuted, fontWeight: '700' }}>DAILY CALORIE TARGET</Text>
        <Text style={[styles.bigCal, { color: colors.primary }]}>{targets.calories} kcal</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Expected pace: {targets.expected_weekly_change_kg === 0 ? 'Maintain steady weight' : `${targets.expected_weekly_change_kg} kg / week`}
        </Text>
      </Card>

      <View style={styles.grid}>
        <Card style={styles.miniCard}>
          <Text style={{ color: colors.protein, fontWeight: '700' }}>Protein</Text>
          <Text style={[styles.miniVal, { color: colors.text }]}>{targets.protein_g} g</Text>
        </Card>
        <Card style={styles.miniCard}>
          <Text style={{ color: colors.carbs, fontWeight: '700' }}>Carbs</Text>
          <Text style={[styles.miniVal, { color: colors.text }]}>{targets.carbs_g} g</Text>
        </Card>
        <Card style={styles.miniCard}>
          <Text style={{ color: colors.fat, fontWeight: '700' }}>Fat</Text>
          <Text style={[styles.miniVal, { color: colors.text }]}>{targets.fat_g} g</Text>
        </Card>
        <Card style={styles.miniCard}>
          <Text style={{ color: colors.water, fontWeight: '700' }}>Water</Text>
          <Text style={[styles.miniVal, { color: colors.text }]}>{(targets.water_ml / 1000).toFixed(1)} L</Text>
        </Card>
      </View>

      {targets.notices.length > 0 && (
        <Card style={{ backgroundColor: colors.isDark ? '#382A14' : '#FFF8E1', borderColor: colors.warning }}>
          <Text style={{ color: colors.warning, fontWeight: '800', marginBottom: 6 }}>Safety & Health Notice</Text>
          {targets.notices.map((n, i) => (
            <Text key={i} style={{ color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: 4 }}>
              • {n}
            </Text>
          ))}
        </Card>
      )}

      <Text style={[styles.note, { color: colors.textMuted }]}>
        You can adjust any of these targets anytime in Profile & Settings.
      </Text>

      <PrimaryButton title="Start Tracking" onPress={() => navigation.replace('MainTabs')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 22, paddingTop: 58 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 20 },
  bigCal: { fontSize: 40, fontWeight: '800', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  miniCard: { width: '48%', alignItems: 'center' },
  miniVal: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  note: { fontSize: 13, textAlign: 'center', marginVertical: 14 },
});
