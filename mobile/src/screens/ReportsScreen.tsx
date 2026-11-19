import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import { Card } from '../components/CommonUI';
import { SimpleBarChart, StackedMacroChart, WeightLineChart } from '../components/Charts';
import { isSameLocalDay } from '../utils/units';
import { exportNutritionReportPdf } from '../utils/pdfExport';

export const ReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const { meals, waterLogs, weightLogs, targets, onboarding } = useApp();
  const [period, setPeriod] = useState<'Weekly' | 'Monthly'>('Weekly');

  const daysCount = period === 'Weekly' ? 7 : 14; // Clean bar labels for mobile viewport

  const report = useMemo(() => {
    const today = new Date();
    const daily = [];
    let proteinLowDays = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dm = meals.filter((m) => isSameLocalDay(m.eaten_at, d));
      const dw = waterLogs.filter((w) => isSameLocalDay(w.logged_at, d));
      const cal = Math.round(dm.reduce((s, m) => s + m.total_calories, 0));
      const p = Math.round(dm.reduce((s, m) => s + m.total_protein, 0));
      const c = Math.round(dm.reduce((s, m) => s + m.total_carbs, 0));
      const f = Math.round(dm.reduce((s, m) => s + m.total_fat, 0));
      const water = dw.reduce((s, w) => s + w.amount_ml, 0);
      if (dm.length > 0 && p < targets.protein_g) proteinLowDays++;
      daily.push({
        label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        calories: cal,
        protein: p,
        carbs: c,
        fat: f,
        water,
      });
    }

    const logged = daily.filter((x) => x.calories > 0);
    const denom = Math.max(1, logged.length);
    const avgCalories = Math.round(logged.reduce((s, x) => s + x.calories, 0) / denom);
    const avgProtein = Math.round(logged.reduce((s, x) => s + x.protein, 0) / denom);
    const avgCarbs = Math.round(logged.reduce((s, x) => s + x.carbs, 0) / denom);
    const avgFat = Math.round(logged.reduce((s, x) => s + x.fat, 0) / denom);
    const avgWaterMl = Math.round(daily.reduce((s, x) => s + x.water, 0) / daysCount);

    const wChrono = [...weightLogs].reverse();
    const weightChangeKg =
      wChrono.length >= 2 ? Math.round((wChrono[wChrono.length - 1].weight_kg - wChrono[0].weight_kg) * 10) / 10 : 0;

    const insights: string[] = [];
    if (proteinLowDays > 0) insights.push(`Protein was below target on ${proteinLowDays} of ${logged.length} logged days.`);
    if (avgWaterMl < targets.water_ml) insights.push(`Average water (${avgWaterMl} ml) is below your ${targets.water_ml} ml goal.`);
    if (insights.length === 0) insights.push('Great consistency! Keep logging meals and hydration daily.');

    return { daily, avgCalories, avgProtein, avgCarbs, avgFat, avgWaterMl, weightChangeKg, insights };
  }, [meals, waterLogs, weightLogs, targets, daysCount]);

  const handleExportPdf = async () => {
    try {
      await exportNutritionReportPdf({
        userName: onboarding.name,
        period,
        avgCalories: report.avgCalories,
        avgProtein: report.avgProtein,
        avgCarbs: report.avgCarbs,
        avgFat: report.avgFat,
        avgWaterMl: report.avgWaterMl,
        weightChangeKg: report.weightChangeKg,
        insights: report.insights,
      });
    } catch {
      Alert.alert('Export', 'Unable to open PDF share sheet on this device.');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        <Text style={[styles.heading, { color: colors.text }]}>Reports</Text>
        <TouchableOpacity onPress={handleExportPdf} style={[styles.pdfBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>{t('exportPdf')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        {(['Weekly', 'Monthly'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.toggleBtn, { backgroundColor: period === p ? colors.primary : colors.card, borderColor: colors.border }]}
          >
            <Text style={{ color: period === p ? '#FFF' : colors.text, fontWeight: '700' }}>
              {p === 'Weekly' ? t('weekly') : t('monthly')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.grid}>
        <Card style={styles.sCard}><Text style={{ color: colors.textMuted, fontSize: 12 }}>Avg Calories</Text><Text style={[styles.sVal, { color: colors.primary }]}>{report.avgCalories} kcal</Text></Card>
        <Card style={styles.sCard}><Text style={{ color: colors.textMuted, fontSize: 12 }}>Avg Protein</Text><Text style={[styles.sVal, { color: colors.protein }]}>{report.avgProtein} g</Text></Card>
        <Card style={styles.sCard}><Text style={{ color: colors.textMuted, fontSize: 12 }}>Avg Water</Text><Text style={[styles.sVal, { color: colors.water }]}>{report.avgWaterMl} ml</Text></Card>
        <Card style={styles.sCard}><Text style={{ color: colors.textMuted, fontSize: 12 }}>Weight Change</Text><Text style={[styles.sVal, { color: colors.text }]}>{report.weightChangeKg} kg</Text></Card>
      </View>

      {/* 4 Required Charts (Blueprint Section 7.10) */}
      <Card>
        <View style={styles.chartHead}>
          <Text style={[styles.secTitle, { color: colors.text }]}>1. Weight Trend</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WeightDetail')}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>+ Log Weight</Text>
          </TouchableOpacity>
        </View>
        <WeightLineChart
          data={[...weightLogs].reverse().slice(-7).map((w) => ({
            label: new Date(w.logged_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            value: w.weight_kg,
          }))}
          targetWeight={Number(onboarding.target_weight) || undefined}
        />
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>2. Daily Calories vs Target</Text>
        <SimpleBarChart
          data={report.daily.map((d) => ({ label: d.label, value: d.calories }))}
          targetLine={targets.calories}
          barColor={colors.primary}
        />
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>3. Daily Water Intake (ml)</Text>
        <SimpleBarChart
          data={report.daily.map((d) => ({ label: d.label, value: d.water }))}
          targetLine={targets.water_ml}
          barColor={colors.water}
        />
      </Card>

      <Card>
        <Text style={[styles.secTitle, { color: colors.text }]}>4. Macronutrients Breakdown</Text>
        <StackedMacroChart
          data={report.daily.map((d) => ({ label: d.label, protein: d.protein, carbs: d.carbs, fat: d.fat }))}
        />
      </Card>

      <Card style={{ backgroundColor: colors.accent }}>
        <Text style={[styles.secTitle, { color: colors.primaryDark }]}>Insights</Text>
        {report.insights.map((ins, i) => (
          <Text key={i} style={{ color: colors.primaryDark, marginBottom: 4 }}>• {ins}</Text>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingTop: 50, paddingBottom: 100 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800' },
  pdfBtn: { minHeight: 42, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleBtn: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sCard: { width: '48%', alignItems: 'center' },
  sVal: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
});
