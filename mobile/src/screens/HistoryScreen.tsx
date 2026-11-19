import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card } from '../components/CommonUI';
import { WeightLineChart } from '../components/Charts';
import { formatWater, formatWeight } from '../utils/units';

type CatTab = 'Food' | 'Water' | 'Weight' | 'Nutrition';
type DateRange = 'Today' | 'Yesterday' | '7d' | '30d';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { meals, waterLogs, weightLogs, targets, settings, onboarding, deleteMeal, deleteWater, deleteWeight } = useApp();
  const [cat, setCat] = useState<CatTab>('Food');
  const [range, setRange] = useState<DateRange>('7d');

  const inRange = (iso: string): boolean => {
    const d = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === 'Today') return d >= startOfToday;
    if (range === 'Yesterday') {
      const yStart = new Date(startOfToday);
      yStart.setDate(yStart.getDate() - 1);
      return d >= yStart && d < startOfToday;
    }
    const cutoff = new Date(startOfToday);
    cutoff.setDate(cutoff.getDate() - (range === '7d' ? 6 : 29));
    return d >= cutoff;
  };

  const filteredMeals = useMemo(() => meals.filter((m) => inRange(m.eaten_at)), [meals, range]);
  const filteredWater = useMemo(() => waterLogs.filter((w) => inRange(w.logged_at)), [waterLogs, range]);

  const dailyNutrition = useMemo(() => {
    const map = new Map<string, { cal: number; p: number; c: number; f: number }>();
    filteredMeals.forEach((m) => {
      const key = new Date(m.eaten_at).toLocaleDateString();
      const prev = map.get(key) || { cal: 0, p: 0, c: 0, f: 0 };
      map.set(key, {
        cal: prev.cal + m.total_calories,
        p: prev.p + m.total_protein,
        c: prev.c + m.total_carbs,
        f: prev.f + m.total_fat,
      });
    });
    return Array.from(map.entries());
  }, [filteredMeals]);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>History</Text>

      {/* 4 Category Tabs (Blueprint Section 7.9) */}
      <View style={styles.row}>
        {(['Food', 'Water', 'Weight', 'Nutrition'] as CatTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setCat(t)}
            style={[styles.tabBtn, { backgroundColor: cat === t ? colors.primary : colors.card, borderColor: colors.border }]}
          >
            <Text style={{ color: cat === t ? '#FFF' : colors.text, fontWeight: '700', fontSize: 12 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Range Filters */}
      <View style={styles.row}>
        {(['Today', 'Yesterday', '7d', '30d'] as DateRange[]).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRange(r)}
            style={[styles.filterChip, { backgroundColor: range === r ? colors.accent : colors.card, borderColor: colors.border }]}
          >
            <Text style={{ color: range === r ? colors.primaryDark : colors.textMuted, fontWeight: '700', fontSize: 12 }}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {cat === 'Food' && (
        filteredMeals.length === 0 ? (
          <Card><Text style={{ color: colors.textMuted }}>No meals logged in this period.</Text></Card>
        ) : (
          filteredMeals.map((m) => (
            <Card key={m.id}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                    {m.meal_type} • {Math.round(m.total_calories)} kcal
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {new Date(m.eaten_at).toLocaleString()}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 13, marginTop: 4 }}>
                    {m.items.map((i) => i.name_en).join(', ')}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    P {m.total_protein}g • C {m.total_carbs}g • F {m.total_fat}g
                  </Text>
                </View>
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ReviewMeal', {
                        photoUri: m.photo_uri,
                        mealType: m.meal_type,
                        initialItems: m.items,
                        editMealId: m.id,
                      })
                    }
                  >
                    <Ionicons name="create-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Delete meal?', 'Totals will recalculate automatically.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(m.id) },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )
      )}

      {cat === 'Water' && (
        <Card>
          {filteredWater.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>No water logs in this period.</Text>
          ) : (
            filteredWater.map((w) => (
              <View key={w.id} style={[styles.simpleRow, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={{ color: colors.water, fontWeight: '800' }}>{formatWater(w.amount_ml, settings.units)}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{new Date(w.logged_at).toLocaleString()}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteWater(w.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      )}

      {cat === 'Weight' && (
        <>
          <Card>
            <WeightLineChart
              data={[...weightLogs].reverse().slice(-10).map((w) => ({
                label: new Date(w.logged_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                value: w.weight_kg,
              }))}
              targetWeight={Number(onboarding.target_weight) || undefined}
            />
          </Card>
          <Card>
            {weightLogs.map((w) => (
              <View key={w.id} style={[styles.simpleRow, { borderBottomColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{formatWeight(w.weight_kg, settings.units)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{new Date(w.logged_at).toLocaleDateString()}</Text>
                <TouchableOpacity onPress={() => deleteWeight(w.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        </>
      )}

      {cat === 'Nutrition' && (
        <Card>
          {dailyNutrition.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>No nutrition records in this period.</Text>
          ) : (
            dailyNutrition.map(([day, val]) => (
              <View key={day} style={[styles.simpleRow, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>{day}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    P {Math.round(val.p)}g • C {Math.round(val.c)}g • F {Math.round(val.f)}g
                  </Text>
                </View>
                <Text style={{ color: val.cal > targets.calories ? colors.danger : colors.primary, fontWeight: '800' }}>
                  {Math.round(val.cal)} kcal
                </Text>
              </View>
            ))
          )}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingTop: 50, paddingBottom: 100 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tabBtn: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterChip: { flex: 1, minHeight: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});
