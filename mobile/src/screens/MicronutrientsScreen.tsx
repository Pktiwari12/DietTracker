import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card } from '../components/CommonUI';
import { MacroBar } from '../components/MacroBar';
import { isSameLocalDay } from '../utils/units';

const MICRO_LABELS: { key: string; label: string; unit: string }[] = [
  { key: 'vit_a_mcg', label: 'Vitamin A', unit: 'mcg' },
  { key: 'vit_b12_mcg', label: 'Vitamin B12', unit: 'mcg' },
  { key: 'vit_c_mg', label: 'Vitamin C', unit: 'mg' },
  { key: 'vit_d_mcg', label: 'Vitamin D', unit: 'mcg' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
  { key: 'folate_mcg', label: 'Folate', unit: 'mcg' },
];

export const MicronutrientsScreen: React.FC = () => {
  const colors = useTheme();
  const { meals, targets } = useApp();
  const todayMeals = meals.filter((m) => isSameLocalDay(m.eaten_at));

  const totals: Record<string, number> = {};
  todayMeals.forEach((m) =>
    m.items.forEach((it) => {
      Object.entries(it.micronutrients || {}).forEach(([k, v]) => {
        if (typeof v === 'number') totals[k] = (totals[k] || 0) + v;
      });
    })
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Vitamins & Minerals</Text>
      <Card>
        {MICRO_LABELS.map((item) => (
          <MacroBar
            key={item.key}
            label={item.label}
            current={Math.round((totals[item.key] || 0) * 10) / 10}
            target={(targets.micronutrient_targets as any)[item.key] || 100}
            unit={item.unit}
            barColor={colors.primary}
          />
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingTop: 48, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 14 },
});
