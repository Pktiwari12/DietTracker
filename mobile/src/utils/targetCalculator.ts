import { DailyTargets, OnboardingAnswers } from '../types';

export const ACTIVITY_FACTORS: Record<string, number> = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
};

export const MET_TABLE: Record<string, Record<'Light' | 'Moderate' | 'Vigorous', number>> = {
  Walking: { Light: 2.8, Moderate: 3.8, Vigorous: 5.0 },
  Running: { Light: 7.0, Moderate: 9.8, Vigorous: 11.5 },
  Cycling: { Light: 4.0, Moderate: 7.5, Vigorous: 10.0 },
  Gym: { Light: 3.5, Moderate: 5.5, Vigorous: 8.0 },
  Yoga: { Light: 2.5, Moderate: 3.3, Vigorous: 4.0 },
  Swimming: { Light: 5.8, Moderate: 7.0, Vigorous: 9.8 },
  Sports: { Light: 5.0, Moderate: 7.0, Vigorous: 9.0 },
  Other: { Light: 3.5, Moderate: 5.0, Vigorous: 6.5 },
};

export function calculateCaloriesBurned(
  activityType: string,
  weightKg: number,
  durationMin: number,
  intensity: 'Light' | 'Moderate' | 'Vigorous' = 'Moderate'
): number {
  const row = MET_TABLE[activityType] || MET_TABLE.Other;
  const met = row[intensity] ?? 5.0;
  return Math.round(met * weightKg * (durationMin / 60) * 10) / 10;
}

export function calculateDailyTargets(answers: OnboardingAnswers): DailyTargets {
  const age = Math.max(10, Number(answers.age) || 28);
  const weightKg = Math.max(30, Number(answers.weight_kg) || 70);
  const heightCm = Math.max(100, Number(answers.height_cm) || 170);
  const sex = answers.sex || 'Prefer not to say';

  const notices: string[] = [];
  let safeLimitApplied = false;

  const isMinor = age < 18;
  if (isMinor) {
    notices.push(
      'Because you are under 18, please consult a doctor or dietitian. Weight-loss calorie deficits are disabled for users under 18.'
    );
  }
  if (answers.is_pregnant) {
    notices.push('During pregnancy, please consult your doctor or dietitian for personalized nutrition targets.');
  }
  if (answers.medical_conditions) {
    notices.push('Because you noted a medical condition, please review these targets with your doctor or dietitian.');
  }

  // Mifflin-St Jeor BMR (Section 7)
  const bmrMen = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const bmrWomen = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const bmr =
    sex === 'Male' ? bmrMen : sex === 'Female' ? bmrWomen : (bmrMen + bmrWomen) / 2;

  const factor = ACTIVITY_FACTORS[answers.activity_level] || 1.375;
  const maintenance = bmr * factor;

  const goal = (answers.primary_goal || 'Maintain weight').toLowerCase();
  const pace = (answers.pace || 'Moderate pace').toLowerCase();

  let rawCalories = maintenance;
  if (goal === 'lose weight' && !isMinor && !answers.is_pregnant) {
    const pct = pace.includes('gradual') ? -0.15 : pace.includes('fast') ? -0.25 : -0.2;
    rawCalories = maintenance * (1 + pct);
  } else if (goal === 'gain weight' || goal === 'build muscle') {
    const pct = pace.includes('gradual') ? 0.1 : 0.15;
    rawCalories = maintenance * (1 + pct);
  }

  // Safe floors (Section 7)
  const minFloor = sex === 'Male' ? 1500 : sex === 'Female' ? 1200 : 1350;
  const maxDeficitFloor = maintenance - 1000;
  const effectiveFloor = Math.max(minFloor, maxDeficitFloor);

  let targetCalories = rawCalories;
  if (targetCalories < effectiveFloor) {
    targetCalories = effectiveFloor;
    safeLimitApplied = true;
    notices.push(
      `Your calorie target was set to ${Math.round(targetCalories)} kcal to stay within safe daily minimum limits.`
    );
  }

  // Cap weekly weight change at 1% body weight per week
  const maxWeeklyKg = Math.round(weightKg * 0.01 * 100) / 100;
  let expectedWeeklyKg = Math.round((((targetCalories - maintenance) * 7) / 7700) * 100) / 100;
  if (Math.abs(expectedWeeklyKg) > maxWeeklyKg && (goal === 'lose weight' || goal === 'gain weight')) {
    const sign = expectedWeeklyKg < 0 ? -1 : 1;
    const cappedDelta = (maxWeeklyKg * 7700) / 7;
    targetCalories = Math.max(effectiveFloor, maintenance + sign * cappedDelta);
    expectedWeeklyKg = Math.round(sign * maxWeeklyKg * 100) / 100;
    safeLimitApplied = true;
    notices.push(`Weekly pace was capped at ${maxWeeklyKg} kg/week (1% body weight) for safe progress.`);
  }

  const finalCalories = Math.round(targetCalories);
  const proteinPerKg = goal === 'build muscle' ? 1.8 : goal === 'lose weight' && !isMinor ? 1.4 : 1.0;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const fatG = Math.round((finalCalories * 0.275) / 9);
  const carbsG = Math.max(0, Math.round((finalCalories - proteinG * 4 - fatG * 9) / 4));

  const extraWater = answers.exercise_regularly === 'Yes' ? 500 : 0;
  const waterMl = Math.max(1500, Math.round(weightKg * 35) + extraWater);

  const maleMicros = {
    vit_a_mcg: 900, vit_b12_mcg: 2.4, vit_c_mg: 90, vit_d_mcg: 15,
    calcium_mg: 1000, iron_mg: 8, potassium_mg: 3400, magnesium_mg: 420, zinc_mg: 11, folate_mcg: 400,
  };
  const femaleMicros = {
    vit_a_mcg: 700, vit_b12_mcg: 2.4, vit_c_mg: 75, vit_d_mcg: 15,
    calcium_mg: 1000, iron_mg: 18, potassium_mg: 2600, magnesium_mg: 320, zinc_mg: 8, folate_mcg: 400,
  };
  const micronutrient_targets =
    sex === 'Male'
      ? maleMicros
      : sex === 'Female'
      ? femaleMicros
      : {
          vit_a_mcg: 800, vit_b12_mcg: 2.4, vit_c_mg: 82.5, vit_d_mcg: 15,
          calcium_mg: 1000, iron_mg: 13, potassium_mg: 3000, magnesium_mg: 370, zinc_mg: 9.5, folate_mcg: 400,
        };

  return {
    bmr: Math.round(bmr),
    maintenance_calories: Math.round(maintenance),
    calories: finalCalories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    water_ml: waterMl,
    expected_weekly_change_kg: expectedWeeklyKg,
    micronutrient_targets,
    safe_limit_applied: safeLimitApplied,
    notices,
  };
}
