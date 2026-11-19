import { FoodItem, LanguageCode } from '../types';
import { OFFLINE_FOODS } from './nutritionDb';

export interface FoodSuggestion {
  food: FoodItem;
  servingLabel: string;
  grams: number;
  calories: number;
  protein: number;
  benefit: string;
}

export function getWhatToEatNext(params: {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  dietType: string;
  restrictions: string[];
  allergies: string[];
  preferredCategories: string[];
  lang: LanguageCode;
}): { dayComplete: boolean; message: string; items: FoodSuggestion[] } {
  const { remainingCalories, remainingProtein, remainingCarbs, dietType, restrictions, allergies, preferredCategories, lang } = params;

  if (remainingCalories <= 80) {
    return {
      dayComplete: true,
      message:
        lang === 'hi'
          ? 'बहुत बढ़िया! आपने आज का कैलोरी लक्ष्य पूरा कर लिया है।'
          : 'Great job! You have met your daily calorie target. Stay hydrated!',
      items: [],
    };
  }

  const lowerAllergies = allergies.map((a) => a.trim().toLowerCase()).filter(Boolean);
  const diet = (dietType || 'No preference').toLowerCase();
  const prefs = preferredCategories.map((c) => c.toLowerCase());
  const gap = remainingProtein >= 15 ? 'protein' : remainingCarbs >= 30 ? 'carbs' : 'calories';

  const scored: { score: number; suggestion: FoodSuggestion }[] = [];

  for (const f of OFFLINE_FOODS) {
    // Allergy filter
    const hasAllergy = lowerAllergies.some(
      (a) =>
        f.allergen_tags.some((t) => t.toLowerCase().includes(a) || a.includes(t.toLowerCase())) ||
        f.name_en.toLowerCase().includes(a)
    );
    if (hasAllergy) continue;

    // Diet filter
    if (diet === 'vegan' && !f.diet_tags.includes('vegan')) continue;
    if (diet === 'vegetarian' && !f.diet_tags.includes('vegetarian')) continue;
    if (diet === 'eggetarian' && !f.diet_tags.includes('vegetarian') && !f.diet_tags.includes('eggetarian')) continue;
    if (diet === 'pescatarian' && !f.diet_tags.includes('vegetarian') && !f.diet_tags.includes('pescatarian')) continue;

    // Restrictions filter
    const rLow = restrictions.map((r) => r.toLowerCase());
    if (rLow.includes('lactose-free') && f.allergen_tags.includes('dairy')) continue;
    if (rLow.includes('gluten-free') && f.allergen_tags.includes('gluten')) continue;
    if (rLow.includes('low carb') && f.carbs_per_100g > 20) continue;
    if (rLow.includes('low fat') && f.fat_per_100g > 10) continue;

    const serving = f.serving_sizes[0] || { label: '100 g', grams: 100 };
    const factor = serving.grams / 100;
    const cal = Math.round(f.calories_per_100g * factor);
    const prot = Math.round(f.protein_per_100g * factor * 10) / 10;
    const carb = Math.round(f.carbs_per_100g * factor * 10) / 10;

    if (cal > remainingCalories * 1.1) continue;

    let score = gap === 'protein' ? prot * 3 : gap === 'carbs' ? carb * 2 : cal / 10 + prot;
    if (prefs.includes(f.category.toLowerCase())) score += 5;

    const benefit =
      gap === 'protein'
        ? `Add ${Math.round(prot)} g protein (${cal} kcal)`
        : gap === 'carbs'
        ? `Add ${Math.round(carb)} g carbs (${cal} kcal)`
        : `Balanced ${cal} kcal (${Math.round(prot)} g protein)`;

    scored.push({
      score,
      suggestion: {
        food: f,
        servingLabel: serving.label,
        grams: serving.grams,
        calories: cal,
        protein: prot,
        benefit,
      },
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return {
    dayComplete: false,
    message:
      gap === 'protein'
        ? `You still need ~${Math.round(remainingProtein)} g protein today.`
        : `You have ${Math.round(remainingCalories)} kcal remaining today.`,
    items: scored.slice(0, 3).map((x) => x.suggestion),
  };
}
