import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import { OFFLINE_FOODS } from '../utils/nutritionDb';
import { FoodItem, MealCategory, MealFoodEntry } from '../types';

export const ManualSearchScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const colors = useTheme();
  const { lang } = useTranslation();
  const { userAllergies } = useApp();
  const { mealType = 'Lunch', onPickFood }: { mealType: MealCategory; onPickFood?: (e: MealFoodEntry) => void } =
    route.params || {};

  const [query, setQuery] = useState('');
  const [gramsText, setGramsText] = useState('100');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OFFLINE_FOODS;
    return OFFLINE_FOODS.filter(
      (f) =>
        f.name_en.toLowerCase().includes(q) ||
        f.name_hi.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [query]);

  const selectFood = (f: FoodItem) => {
    const grams = Math.max(10, Number(gramsText) || f.serving_sizes[0]?.grams || 100);
    const factor = grams / 100;
    const matchedAllergies = userAllergies.filter((a) =>
      f.allergen_tags.some((t) => t.toLowerCase().includes(a.toLowerCase()))
    );
    const entry: MealFoodEntry = {
      id: `${Date.now()}_${f.id}`,
      food_id: f.id,
      name_en: f.name_en,
      name_hi: f.name_hi,
      grams,
      calories: Math.round(f.calories_per_100g * factor),
      protein: Math.round(f.protein_per_100g * factor * 10) / 10,
      carbs: Math.round(f.carbs_per_100g * factor * 10) / 10,
      fat: Math.round(f.fat_per_100g * factor * 10) / 10,
      micronutrients: {},
      confidence: 1.0,
      allergen_tags: f.allergen_tags,
      allergy_alerts: matchedAllergies,
    };

    if (onPickFood) {
      onPickFood(entry);
      navigation.goBack();
    } else {
      navigation.replace('ReviewMeal', { mealType, initialItems: [entry] });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Search Food (English / हिंदी)</Text>
      <TextInput
        placeholder="Search e.g. Roti, दाल, Paneer, Egg, Oats..."
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <View style={styles.qtyBar}>
        <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Quantity (grams):</Text>
        <TextInput
          value={gramsText}
          onChangeText={setGramsText}
          keyboardType="number-pad"
          style={[styles.qtyInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => selectFood(item)}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                {lang === 'hi' ? item.name_hi : item.name_en}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {lang === 'hi' ? item.name_en : item.name_hi} • {item.cuisine} • {item.calories_per_100g} kcal / 100g
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>+ Add</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, paddingTop: 48 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 10, fontSize: 15 },
  qtyBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  qtyInput: { width: 90, minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, textAlign: 'center', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
});
