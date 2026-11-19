import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import { CalorieRing } from '../components/CalorieRing';
import { MacroBar } from '../components/MacroBar';
import { Card, HealthDisclaimerModal } from '../components/CommonUI';
import { formatWater, isSameLocalDay } from '../utils/units';
import { getWhatToEatNext } from '../utils/suggestionEngine';
import { MealCategory } from '../types';

const MEAL_CATS: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { t, lang } = useTranslation();
  const {
    session, acceptDisclaimer, onboarding, targets, settings,
    meals, waterLogs, exerciseLogs, addWater, streakDays, userAllergies,
  } = useApp();

  const todayMeals = meals.filter((m) => isSameLocalDay(m.eaten_at));
  const todayWater = waterLogs.filter((w) => isSameLocalDay(w.logged_at)).reduce((s, w) => s + w.amount_ml, 0);
  const todayBurned = Math.round(
    exerciseLogs.filter((e) => isSameLocalDay(e.logged_at)).reduce((s, e) => s + e.calories_burned, 0)
  );

  const eatenCal = Math.round(todayMeals.reduce((s, m) => s + m.total_calories, 0));
  const eatenP = Math.round(todayMeals.reduce((s, m) => s + m.total_protein, 0));
  const eatenC = Math.round(todayMeals.reduce((s, m) => s + m.total_carbs, 0));
  const eatenF = Math.round(todayMeals.reduce((s, m) => s + m.total_fat, 0));

  const suggestions = getWhatToEatNext({
    remainingCalories: Math.max(0, targets.calories - eatenCal),
    remainingProtein: Math.max(0, targets.protein_g - eatenP),
    remainingCarbs: Math.max(0, targets.carbs_g - eatenC),
    remainingFat: Math.max(0, targets.fat_g - eatenF),
    dietType: onboarding.diet_type,
    restrictions: onboarding.restrictions,
    allergies: userAllergies,
    preferredCategories: onboarding.preferred_categories,
    lang,
  });

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HealthDisclaimerModal
        visible={!session.acceptedDisclaimer}
        title={t('healthDisclaimerTitle')}
        body={t('healthDisclaimerBody')}
        buttonText={t('understood')}
        onAccept={acceptDisclaimer}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {t('hi')}, {onboarding.name || 'Friend'}!
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{dateLabel}</Text>
          </View>
          <View style={styles.topRight}>
            <View style={[styles.streakPill, { backgroundColor: colors.accent }]}>
              <Ionicons name="flame" size={16} color={colors.warning} />
              <Text style={{ color: colors.primaryDark, fontWeight: '800', fontSize: 13 }}>
                {streakDays} {t('streak')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileSettings')}
              style={[styles.profileBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              accessibilityLabel="Profile and Settings"
            >
              <Ionicons name="person-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calorie Ring + Macros Card */}
        <Card>
          <Text style={[styles.cardEyebrow, { color: colors.textMuted }]}>{t('calories')}</Text>
          <CalorieRing
            eaten={eatenCal}
            target={targets.calories}
            labelRemaining={t('remaining')}
            labelOver={t('overTarget')}
          />
          <View style={styles.calSummaryRow}>
            <View style={styles.calStat}>
              <Text style={[styles.statVal, { color: colors.text }]}>{eatenCal}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('eaten')}</Text>
            </View>
            <View style={styles.calStat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{targets.calories}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>Target</Text>
            </View>
            <View style={styles.calStat}>
              <Text style={[styles.statVal, { color: colors.warning }]}>{todayBurned}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('burned')}</Text>
            </View>
            <View style={styles.calStat}>
              <Text style={[styles.statVal, { color: colors.text }]}>{eatenCal - todayBurned}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('netCalories')}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <MacroBar label={t('protein')} current={eatenP} target={targets.protein_g} barColor={colors.protein} />
            <MacroBar label={t('carbs')} current={eatenC} target={targets.carbs_g} barColor={colors.carbs} />
            <MacroBar label={t('fat')} current={eatenF} target={targets.fat_g} barColor={colors.fat} />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Micronutrients')}
            style={styles.microLink}
          >
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('vitaminsMinerals')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Water Card */}
        <Card>
          <View style={styles.waterRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('WaterDetail')}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>{t('water')}</Text>
              <Text style={{ color: colors.water, fontWeight: '800', fontSize: 18 }}>
                {formatWater(todayWater, settings.units)} / {formatWater(targets.water_ml, settings.units)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addWater(250)}
              style={[styles.waterPlusBtn, { backgroundColor: colors.water }]}
              accessibilityLabel="Quick add 250 ml water"
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>250 ml</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Today's Meals */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('todaysMeals')}</Text>
          {MEAL_CATS.map((cat) => {
            const catMeals = todayMeals.filter((m) => m.meal_type === cat);
            const catCal = Math.round(catMeals.reduce((s, m) => s + m.total_calories, 0));
            const thumb = catMeals.find((m) => m.photo_uri)?.photo_uri;
            return (
              <View key={cat} style={[styles.mealRow, { borderBottomColor: colors.border }]}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.mealThumb} />
                ) : (
                  <View style={[styles.mealThumb, { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{cat}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    {catMeals.length > 0 ? `${catCal} kcal • ${catMeals.length} entry` : 'Not logged yet'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Camera', { mealType: cat })}
                  style={[styles.addChip, { backgroundColor: colors.accent }]}
                >
                  <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: 13 }}>+ Add</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>

        {/* What to eat next */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('whatToEatNext')}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 10 }}>{suggestions.message}</Text>
          {suggestions.items.map((s) => (
            <View key={s.food.id} style={[styles.suggRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                  {lang === 'hi' ? s.food.name_hi : s.food.name_en} ({s.servingLabel})
                </Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                  {s.benefit}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingTop: 50, paddingBottom: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '800' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  profileBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardEyebrow: { textAlign: 'center', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  calSummaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  calStat: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLbl: { fontSize: 11, marginTop: 2 },
  microLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, minHeight: 44 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  waterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waterPlusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, minHeight: 48, borderRadius: 12 },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  mealThumb: { width: 44, height: 44, borderRadius: 10 },
  addChip: { paddingHorizontal: 14, minHeight: 40, borderRadius: 10, justifyContent: 'center' },
  suggRow: { paddingVertical: 8, borderTopWidth: 1 },
});
