"""
Section 8: Rule-Based "What To Eat Next" Suggestion Engine.
- Calculates remaining calories, protein, carbs, fat for the day.
- Filters strictly by diet type, dietary restrictions, and allergies (NEVER suggests allergens).
- Ranks up to 3 foods that best fill the biggest remaining gap without exceeding limits.
"""
from typing import Dict, List
from app.models import Food


def _is_food_allowed(food: Food, diet_type: str, restrictions: List[str], allergies: List[str]) -> bool:
    diet = (diet_type or "No preference").strip().lower()
    food_diet_tags = [t.lower() for t in (food.diet_tags or [])]
    food_allergens = [a.lower() for a in (food.allergen_tags or [])]
    food_name = f"{food.name_en} {food.name_hi}".lower()

    # 1. Strict Allergy Check (NEVER suggest matching allergen)
    for allergy in (allergies or []):
        a = allergy.strip().lower()
        if not a:
            continue
        if any(a in tag or tag in a for tag in food_allergens) or a in food_name:
            return False

    # 2. Diet Type Check
    if diet == "vegan" and "vegan" not in food_diet_tags:
        return False
    if diet == "vegetarian" and "vegetarian" not in food_diet_tags:
        return False
    if diet == "eggetarian" and not any(t in food_diet_tags for t in ("vegetarian", "eggetarian")):
        return False
    if diet == "pescatarian" and not any(t in food_diet_tags for t in ("vegetarian", "pescatarian")):
        return False

    # 3. Restrictions Check
    for r in (restrictions or []):
        rl = r.strip().lower()
        if rl == "lactose-free" and ("dairy" in food_allergens or "lactose" in food_allergens):
            return False
        if rl == "gluten-free" and "gluten" in food_allergens:
            return False
        if rl == "no added sugar" and (food.sugar_per_100g or 0) > 15:
            return False
        if rl == "low carb" and (food.carbs_per_100g or 0) > 20:
            return False
        if rl == "low fat" and (food.fat_per_100g or 0) > 10:
            return False

    return True


def generate_suggestions(
    remaining_calories: float,
    remaining_protein: float,
    remaining_carbs: float,
    remaining_fat: float,
    foods: List[Food],
    diet_type: str = "No preference",
    restrictions: List[str] = None,
    allergies: List[str] = None,
    preferred_categories: List[str] = None,
) -> Dict:
    restrictions = restrictions or []
    allergies = allergies or []
    preferred_categories = [c.lower() for c in (preferred_categories or [])]

    if remaining_calories <= 80:
        return {
            "day_complete": True,
            "message": "Great job! You have met your calorie goal for today. Stay hydrated and rest well.",
            "suggestions": [],
        }

    # Determine primary nutrient gap
    if remaining_protein >= 15:
        gap_nutrient = "protein"
    elif remaining_carbs >= 30:
        gap_nutrient = "carbs"
    else:
        gap_nutrient = "calories"

    scored = []
    for f in foods:
        if not f.is_active:
            continue
        if not _is_food_allowed(f, diet_type, restrictions, allergies):
            continue

        serving = (f.serving_sizes[0] if f.serving_sizes else {"label": "100 g", "grams": 100})
        grams = float(serving.get("grams", 100))
        factor = grams / 100.0
        cal = f.calories_per_100g * factor
        prot = f.protein_per_100g * factor
        carb = f.carbs_per_100g * factor
        fat = f.fat_per_100g * factor

        # Must not exceed remaining calories by more than 10%
        if cal > remaining_calories * 1.1:
            continue

        if gap_nutrient == "protein":
            score = prot * 3.0 - max(0.0, fat - remaining_fat) * 0.5
            benefit = f"Add {int(round(prot))} g protein ({int(round(cal))} kcal)"
        elif gap_nutrient == "carbs":
            score = carb * 2.0 + prot
            benefit = f"Add {int(round(carb))} g carbs ({int(round(cal))} kcal)"
        else:
            score = (cal / max(1.0, remaining_calories)) * 50.0 + prot
            benefit = f"Balanced {int(round(cal))} kcal ({int(round(prot))} g protein)"

        if (f.category or "").lower() in preferred_categories:
            score += 5.0

        scored.append((
            score,
            {
                "food_id": f.id,
                "name_en": f.name_en,
                "name_hi": f.name_hi,
                "serving_label": serving.get("label", f"{int(grams)} g"),
                "grams": grams,
                "calories": round(cal, 1),
                "protein": round(prot, 1),
                "carbs": round(carb, 1),
                "fat": round(fat, 1),
                "benefit": benefit,
            },
        ))

    scored.sort(key=lambda x: x[0], reverse=True)
    top3 = [item for _, item in scored[:3]]

    return {
        "day_complete": False,
        "message": (
            f"Focus on {gap_nutrient} to round out today's target."
            if top3
            else "No matching foods fit your remaining calories and diet rules."
        ),
        "suggestions": top3,
    }
