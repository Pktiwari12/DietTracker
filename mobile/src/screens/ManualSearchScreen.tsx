import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import { searchMasterFoods } from '../config/api';
import { FoodItem, MealCategory, MealFoodEntry } from '../types';

export const ManualSearchScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const colors = useTheme();
  const { lang } = useTranslation();
  const { userAllergies } = useApp();
  const { mealType = 'Lunch', onPickFood }: { mealType: MealCategory; onPickFood?: (e: MealFoodEntry) => void } =
    route.params || {};

  const [query, setQuery] = useState('');
  const [unitMode, setUnitMode] = useState<'grams' | 'unit'>('grams');
  const [qtyText, setQtyText] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      searchMasterFoods(query).then((rows) => {
        if (active) setResults(rows);
      });
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const selectFood = (f: FoodItem) => {
    const unitGrams = f.default_unit_grams || f.serving_sizes[0]?.grams || 150;
    const unitName = f.default_unit_name || f.serving_sizes[0]?.label || 'serving / bowl';
    const entered = Number(qtyText);

    let grams: number;
    let qtyVal: number;
    if (unitMode === 'unit') {
      qtyVal = entered > 0 ? entered : 1;
      grams = qtyVal * unitGrams;
    } else {
      grams = entered > 0 ? entered : unitGrams;
      qtyVal = grams;
    }

    const factor = grams / 100;
    const matchedAllergies = userAllergies.filter(
      (a) =>
        f.name_en.toLowerCase().includes(a.toLowerCase()) ||
        f.allergen_tags.some((t) => t.toLowerCase().includes(a.toLowerCase()))
    );

    const entry: MealFoodEntry = {
      id: `${Date.now()}_${f.id}`,
      food_id: f.id,
      input_name: f.name_en,
      name_en: f.name_en,
      name_hi: f.name_hi,
      grams: Math.round(grams * 10) / 10,
      unit_type: unitMode,
      quantity_value: qtyVal,
      default_unit_name: unitName,
      default_unit_grams: unitGrams,
      weight_label: unitMode === 'unit' ? `${qtyVal} x ${unitName} (${Math.round(grams)}g)` : `${Math.round(grams)}g`,
      calories: Math.round(f.calories_per_100g * factor),
      protein: Math.round(f.protein_per_100g * factor * 10) / 10,
      carbs: Math.round(f.carbs_per_100g * factor * 10) / 10,
      fat: Math.round(f.fat_per_100g * factor * 10) / 10,
      micronutrients: f.micronutrients || {},
      confidence: 1.0,
      confidence_label: 'high',
      status: 'matched',
      source_db: f.source,
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
      <Text style={[styles.heading, { color: colors.text }]}>Search Food (1,224+ Items)</Text>
      <TextInput
        placeholder="e.g. Poori, Poha, Banana, Dal, Paneer..."
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />

      <View style={styles.qtyBar}>
        <TouchableOpacity
          onPress={() => {
            setUnitMode('grams');
            setQtyText('');
          }}
          style={[
            styles.modeBtn,
            { backgroundColor: unitMode === 'grams' ? colors.primary : colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: unitMode === 'grams' ? '#FFF' : colors.text, fontWeight: '700', fontSize: 12 }}>Grams</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setUnitMode('unit');
            setQtyText('');
          }}
          style={[
            styles.modeBtn,
            { backgroundColor: unitMode === 'unit' ? colors.primary : colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: unitMode === 'unit' ? '#FFF' : colors.text, fontWeight: '700', fontSize: 12 }}>Piece / Unit</Text>
        </TouchableOpacity>
        <TextInput
          placeholder={unitMode === 'grams' ? 'e.g. 100' : 'e.g. 2'}
          placeholderTextColor={colors.textMuted}
          value={qtyText}
          onChangeText={setQtyText}
          keyboardType="numeric"
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
                {lang === 'hi' && item.name_hi ? item.name_hi : item.name_en}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {Math.round(item.calories_per_100g)} kcal / 100g • 1 {item.default_unit_name || 'serving'} = {item.default_unit_grams || 150}g
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
  qtyBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  modeBtn: { minHeight: 42, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, justifyContent: 'center' },
  qtyInput: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, textAlign: 'center', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
});
