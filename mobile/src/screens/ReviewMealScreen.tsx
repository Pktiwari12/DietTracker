import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { Card, PrimaryButton } from '../components/CommonUI';
import { MealCategory, MealFoodEntry } from '../types';
import { OFFLINE_FOODS } from '../utils/nutritionDb';

const CATS: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export const ReviewMealScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const colors = useTheme();
  const { t, lang } = useTranslation();
  const { addMeal, updateMeal, toggleFavourite, userAllergies } = useApp();

  const {
    photoUri,
    mealType: initMealType = 'Lunch',
    initialItems = [],
    editMealId,
  }: { photoUri?: string; mealType: MealCategory; initialItems: MealFoodEntry[]; editMealId?: string } =
    route.params || {};

  const [mealType, setMealType] = useState<MealCategory>(initMealType);
  const [items, setItems] = useState<MealFoodEntry[]>(initialItems);
  const [saveAsFav, setSaveAsFav] = useState(false);

  const totals = useMemo(() => {
    return {
      calories: Math.round(items.reduce((s, i) => s + i.calories, 0)),
      protein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
      carbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
      fat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
    };
  }, [items]);

  const allergyMatches = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => (it.allergy_alerts || []).forEach((a) => set.add(a)));
    return Array.from(set);
  }, [items]);

  const adjustGrams = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newGrams = Math.max(10, it.grams + delta);
        const ratio = newGrams / Math.max(1, it.grams);
        return {
          ...it,
          grams: Math.round(newGrams),
          calories: Math.round(it.calories * ratio),
          protein: Math.round(it.protein * ratio * 10) / 10,
          carbs: Math.round(it.carbs * ratio * 10) / 10,
          fat: Math.round(it.fat * ratio * 10) / 10,
          was_edited_by_user: true,
        };
      })
    );
  };

  const replaceWithAlternative = (itemId: string, foodId: number) => {
    const f = OFFLINE_FOODS.find((x) => x.id === foodId);
    if (!f) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const factor = it.grams / 100;
        const matched = userAllergies.filter((a) =>
          f.allergen_tags.some((tag) => tag.toLowerCase().includes(a.toLowerCase()))
        );
        return {
          ...it,
          food_id: f.id,
          name_en: f.name_en,
          name_hi: f.name_hi,
          calories: Math.round(f.calories_per_100g * factor),
          protein: Math.round(f.protein_per_100g * factor * 10) / 10,
          carbs: Math.round(f.carbs_per_100g * factor * 10) / 10,
          fat: Math.round(f.fat_per_100g * factor * 10) / 10,
          is_low_confidence: false,
          confidence: 1.0,
          allergy_alerts: matched,
          was_edited_by_user: true,
        };
      })
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const saveMeal = () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one food item or retake the photo.');
      return;
    }
    const doSave = () => {
      if (editMealId) {
        updateMeal(editMealId, mealType, items);
      } else {
        addMeal({
          meal_type: mealType,
          eaten_at: new Date().toISOString(),
          photo_uri: photoUri,
          items,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat,
          source: photoUri ? 'photo' : 'manual',
        });
      }
      if (saveAsFav) {
        const title = items.map((i) => i.name_en.split(' ')[0]).slice(0, 2).join(' + ');
        toggleFavourite(title, items);
      }
      Alert.alert('Saved!', `${mealType} (${totals.calories} kcal) saved to your log.`);
      navigation.navigate('MainTabs');
    };

    // Section 12: High calorie entry double-check
    if (totals.calories > 1600) {
      Alert.alert(
        'High Calorie Entry',
        `This meal totals ${totals.calories} kcal. Would you like to double-check portions or save as is?`,
        [
          { text: 'Check Portions', style: 'cancel' },
          { text: 'Save Anyway', onPress: doSave },
        ]
      );
    } else {
      doSave();
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{t('reviewMeal')}</Text>

      <BoundingBoxOverlay photoUri={photoUri} items={items} />

      {/* Red Allergy Warning Banner (Section 4 #16) */}
      {allergyMatches.length > 0 && (
        <View style={[styles.allergyBanner, { backgroundColor: colors.danger }]}>
          <Ionicons name="warning" size={22} color="#FFF" />
          <Text style={styles.allergyText}>
            {t('allergyWarning')}: Detected item may contain {allergyMatches.join(', ')}!
          </Text>
        </View>
      )}

      {/* Meal Type Switcher */}
      <View style={styles.catRow}>
        {CATS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setMealType(c)}
            style={[
              styles.catBtn,
              { backgroundColor: mealType === c ? colors.primary : colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: mealType === c ? '#FFF' : colors.text, fontWeight: '700', fontSize: 12 }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Detected Food Items */}
      {items.map((item) => (
        <Card key={item.id} style={item.is_low_confidence ? { borderColor: colors.warning, borderWidth: 1.5 } : undefined}>
          <View style={styles.itemTop}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                {lang === 'hi' && item.name_hi ? item.name_hi : item.name_en}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {item.grams} g • {item.calories} kcal (P {item.protein}g • C {item.carbs}g • F {item.fat}g)
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.iconTouch}>
              <Ionicons name="close-circle-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>

          {/* Quantity +/- Controls */}
          <View style={styles.qtyRow}>
            <TouchableOpacity onPress={() => adjustGrams(item.id, -25)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>-25 g</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => adjustGrams(item.id, 25)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>+25 g</Text>
            </TouchableOpacity>
          </View>

          {/* Low Confidence "Not sure" alternatives (Section 5.4) */}
          {item.is_low_confidence && item.alternatives && item.alternatives.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>
                {t('notSure')} ({Math.round(item.confidence * 100)}%) — Tap to replace:
              </Text>
              <View style={styles.altRow}>
                {item.alternatives.map((alt) => (
                  <TouchableOpacity
                    key={alt.food_id}
                    onPress={() => replaceWithAlternative(item.id, alt.food_id)}
                    style={[styles.altChip, { backgroundColor: colors.accent }]}
                  >
                    <Text style={{ color: colors.primaryDark, fontSize: 12, fontWeight: '700' }}>
                      {lang === 'hi' ? alt.name_hi : alt.name_en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>
      ))}

      <PrimaryButton
        title={t('addMissingItem')}
        variant="outline"
        onPress={() =>
          navigation.navigate('ManualSearch', {
            mealType,
            onPickFood: (entry: MealFoodEntry) => setItems((prev) => [...prev, entry]),
          })
        }
        style={{ marginBottom: 14 }}
      />

      {/* Live Totals Card */}
      <Card style={{ backgroundColor: colors.accent }}>
        <Text style={{ color: colors.primaryDark, fontWeight: '800', fontSize: 18 }}>
          TOTAL: {totals.calories} kcal
        </Text>
        <Text style={{ color: colors.primaryDark, fontWeight: '600', marginTop: 4 }}>
          Protein {totals.protein} g  •  Carbs {totals.carbs} g  •  Fat {totals.fat} g
        </Text>
        <TouchableOpacity onPress={() => setSaveAsFav(!saveAsFav)} style={styles.favToggle}>
          <Ionicons name={saveAsFav ? 'star' : 'star-outline'} size={20} color={colors.primaryDark} />
          <Text style={{ color: colors.primaryDark, fontWeight: '700', marginLeft: 6 }}>Save to Favourites</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.actionRow}>
        <PrimaryButton title={t('retake')} variant="outline" onPress={() => navigation.replace('Camera', { mealType })} style={{ flex: 1 }} />
        <PrimaryButton title={t('confirm')} onPress={saveMeal} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingTop: 48, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  allergyBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 12 },
  allergyText: { color: '#FFF', fontWeight: '800', flex: 1, fontSize: 13 },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catBtn: { flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconTouch: { padding: 4 },
  qtyRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  qtyBtn: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  altRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  altChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  favToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 10, minHeight: 36 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
