import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from '../components/CommonUI';
import { useApp } from '../context/AppContext';
import { OnboardingAnswers } from '../types';

const WEIGHT_GOALS = ['Lose weight', 'Gain weight', 'Maintain weight'];

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const colors = useTheme();
  const { onboarding, updateOnboardingDraft, completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingAnswers>(onboarding);

  const setField = <K extends keyof OnboardingAnswers>(key: K, val: OnboardingAnswers[K]) => {
    const next = { ...form, [key]: val };
    setForm(next);
    updateOnboardingDraft({ [key]: val }); // Progress saved midway (Section 4 #2)
  };

  const toggleMulti = (key: 'secondary_goals' | 'exercise_types' | 'restrictions' | 'preferred_categories' | 'tracked_items' | 'reminder_types', val: string) => {
    const list = form[key];
    const next = list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
    setField(key, next);
  };

  const isStepValid = (): boolean => {
    if (step === 1) {
      return Boolean(form.name.trim() && Number(form.age) >= 5 && form.sex && Number(form.height_cm) >= 80 && Number(form.weight_kg) >= 20);
    }
    if (step === 2) {
      return Boolean(form.primary_goal && form.pace);
    }
    if (step === 3) {
      return Boolean(form.activity_level && form.exercise_regularly);
    }
    if (step === 4) {
      return Boolean(form.diet_type);
    }
    if (step === 5) {
      return Boolean(form.meals_per_day && form.water_habit);
    }
    return true;
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      completeOnboarding(form);
      navigation.replace('GoalSummary');
    }
  };

  const renderSingle = (options: string[], selected: string, onSelect: (v: string) => void, disabledOption?: string) => (
    <View style={styles.optList}>
      {options.map((opt) => {
        const isDisabled = disabledOption === opt;
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            disabled={isDisabled}
            onPress={() => onSelect(opt)}
            style={[
              styles.optBtn,
              {
                backgroundColor: active ? colors.accent : colors.card,
                borderColor: active ? colors.primary : colors.border,
                opacity: isDisabled ? 0.55 : 1,
              },
            ]}
          >
            <Text style={{ color: active ? colors.primaryDark : colors.text, fontWeight: active ? '700' : '500', fontSize: 15 }}>
              {opt} {isDisabled ? '(Coming soon)' : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderMulti = (options: string[], selected: string[], onToggle: (v: string) => void) => (
    <View style={styles.chipWrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={{ color: active ? '#FFF' : colors.text, fontWeight: '600', fontSize: 13 }}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const showQ9 = WEIGHT_GOALS.includes(form.primary_goal);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : null)} disabled={step === 1} style={styles.backBtn}>
          <Text style={{ color: step === 1 ? colors.textMuted : colors.primary, fontWeight: '700' }}>
            {step > 1 ? '< Back' : ''}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.stepText, { color: colors.text }]}>Step {step} of 6</Text>
        <View style={{ width: 52 }} />
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${(step / 6) * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 1 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information (Q1–Q6)</Text>
            <Text style={[styles.qLabel, { color: colors.text }]}>Q1. What is your name? *</Text>
            <TextInput value={form.name} onChangeText={(v) => setField('name', v)} placeholder="e.g. Aman" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />

            <Text style={[styles.qLabel, { color: colors.text }]}>Q2. What is your age? *</Text>
            <TextInput value={form.age} onChangeText={(v) => setField('age', v)} keyboardType="number-pad" placeholder="e.g. 28" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />

            <Text style={[styles.qLabel, { color: colors.text }]}>Q3. What is your sex? *</Text>
            {renderSingle(['Male', 'Female', 'Prefer not to say'], form.sex, (v) => setField('sex', v as any))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q4. Which country do you live in?</Text>
            <TextInput value={form.country} onChangeText={(v) => setField('country', v)} placeholder="e.g. India" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />

            <Text style={[styles.qLabel, { color: colors.text }]}>Q5. Height (cm) *</Text>
            <TextInput value={form.height_cm} onChangeText={(v) => setField('height_cm', v)} keyboardType="numeric" placeholder="e.g. 170" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />

            <Text style={[styles.qLabel, { color: colors.text }]}>Q6. Current weight (kg) *</Text>
            <TextInput value={form.weight_kg} onChangeText={(v) => setField('weight_kg', v)} keyboardType="numeric" placeholder="e.g. 70" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Health & Fitness Goals (Q7–Q10)</Text>
            <Text style={[styles.qLabel, { color: colors.text }]}>Q7. Primary health or fitness goal? *</Text>
            {renderSingle(
              ['Lose weight', 'Maintain weight', 'Gain weight', 'Build muscle', 'Improve overall health', 'Improve eating habits'],
              form.primary_goal,
              (v) => setField('primary_goal', v)
            )}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q8. Any secondary goals?</Text>
            {renderMulti(
              ['Increase protein', 'Reduce sugar', 'Reduce fat', 'Improve eating habits', 'Track calories', 'Track macros', 'Increase activity', 'Maintain consistent diet'],
              form.secondary_goals,
              (v) => toggleMulti('secondary_goals', v)
            )}

            {showQ9 && (
              <>
                <Text style={[styles.qLabel, { color: colors.text }]}>Q9. Target weight (kg)</Text>
                <TextInput value={form.target_weight} onChangeText={(v) => setField('target_weight', v)} keyboardType="numeric" placeholder="e.g. 65" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
              </>
            )}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q10. How quickly to reach the goal? *</Text>
            {renderSingle(['Gradually', 'Moderate pace', 'No specific timeline'], form.pace, (v) => setField('pace', v))}

            <View style={styles.switchRow}>
              <Text style={{ color: colors.text, flex: 1 }}>Currently pregnant?</Text>
              <Switch value={form.is_pregnant} onValueChange={(v) => setField('is_pregnant', v)} />
            </View>
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text, flex: 1 }}>Any known medical conditions?</Text>
              <Switch value={form.medical_conditions} onValueChange={(v) => setField('medical_conditions', v)} />
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Physical Activity (Q11–Q14)</Text>
            <Text style={[styles.qLabel, { color: colors.text }]}>Q11. Daily activity level? *</Text>
            {renderSingle(['Sedentary', 'Lightly active', 'Moderately active', 'Very active'], form.activity_level, (v) => setField('activity_level', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q12. Do you exercise regularly? *</Text>
            {renderSingle(['Yes', 'No', 'Occasionally'], form.exercise_regularly, (v) => setField('exercise_regularly', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q13. Type of physical activity?</Text>
            {renderMulti(['Walking', 'Running', 'Cycling', 'Gym', 'Yoga', 'Swimming', 'Sports', 'Other'], form.exercise_types, (v) => toggleMulti('exercise_types', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q14. How often do you exercise?</Text>
            {renderSingle(['1-2 days', '3-4 days', '5-6 days', 'Every day', 'Rarely or never'], form.exercise_frequency, (v) => setField('exercise_frequency', v))}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dietary Preferences (Q15–Q18)</Text>
            <Text style={[styles.qLabel, { color: colors.text }]}>Q15. Type of diet? *</Text>
            {renderSingle(['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian', 'Pescatarian', 'No preference'], form.diet_type, (v) => setField('diet_type', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q16. Dietary restrictions?</Text>
            {renderMulti(['Lactose-free', 'Gluten-free', 'No added sugar', 'Low carb', 'Low fat', 'Other', 'None'], form.restrictions, (v) => toggleMulti('restrictions', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q17. Any food allergies?</Text>
            {renderSingle(['No', 'Yes'], form.has_allergies, (v) => setField('has_allergies', v as any))}
            {form.has_allergies === 'Yes' && (
              <TextInput
                value={form.allergies_text}
                onChangeText={(v) => setField('allergies_text', v)}
                placeholder="Comma-separated (e.g. peanut, dairy, gluten)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              />
            )}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q18. Preferred food categories?</Text>
            {renderMulti(['Fruits', 'Vegetables', 'Dairy', 'Whole grains', 'Nuts and seeds', 'Meat and poultry', 'Fish and seafood', 'Legumes and pulses'], form.preferred_categories, (v) => toggleMulti('preferred_categories', v))}
          </>
        )}

        {step === 5 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Eating Habits (Q19–Q22)</Text>
            <Text style={[styles.qLabel, { color: colors.text }]}>Q19. Meals per day? *</Text>
            {renderSingle(['1-2', '3', '4', '5 or more'], form.meals_per_day, (v) => setField('meals_per_day', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q20. How often do you snack?</Text>
            {renderSingle(['Never', 'Once a day', '2-3 times', 'More than 3 times'], form.snack_frequency, (v) => setField('snack_frequency', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q21. Daily water intake? *</Text>
            {renderSingle(['Under 1 L', '1-2 L', '2-3 L', 'Over 3 L'], form.water_habit, (v) => setField('water_habit', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q22. Home-cooked or outside food?</Text>
            {renderSingle(['Mostly home', 'Mostly outside', 'Both'], form.home_or_outside, (v) => setField('home_or_outside', v))}
          </>
        )}

        {step === 6 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracking Preferences (Q23–Q25)</Text>
            <Text style={[styles.qLabel, { color: colors.text }]}>Q23. What do you want to track?</Text>
            {renderMulti(['Calories', 'Protein', 'Carbs', 'Fat', 'Water', 'Daily weight', 'Physical activity', 'Meal history'], form.tracked_items, (v) => toggleMulti('tracked_items', v))}

            <Text style={[styles.qLabel, { color: colors.text }]}>Q24. Preferred way to log meals? (Photo logging is default)</Text>
            {renderSingle(
              ['Upload food photos', 'Search manually', 'Choose from categories', 'Scan barcode', 'Enter nutrition manually'],
              form.log_method,
              (v) => setField('log_method', v),
              'Scan barcode'
            )}

            <View style={styles.switchRow}>
              <Text style={[styles.qLabel, { color: colors.text, marginTop: 0 }]}>Q25. Enable daily reminders?</Text>
              <Switch value={form.reminders_enabled} onValueChange={(v) => setField('reminders_enabled', v)} />
            </View>
            {form.reminders_enabled &&
              renderMulti(['Meal', 'Water', 'Food logging', 'Weight'], form.reminder_types, (v) => toggleMulti('reminder_types', v))}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <PrimaryButton
          title={step === 6 ? 'Calculate My Daily Plan' : 'Next'}
          disabled={!isStepValid()}
          onPress={handleNext}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  backBtn: { minHeight: 40, justifyContent: 'center', width: 64 },
  stepText: { fontSize: 16, fontWeight: '700' },
  progressTrack: { height: 6, marginHorizontal: 16, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  scroll: { padding: 18, paddingBottom: 36 },
  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  qLabel: { fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
  optList: { gap: 8 },
  optBtn: { minHeight: 48, borderWidth: 1, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: 20, justifyContent: 'center', paddingHorizontal: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  footer: { padding: 16, borderTopWidth: 1 },
});
