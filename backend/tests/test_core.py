"""
Section 15: Unit tests covering Target Calculation Rules, Safe Limits, MET Calories,
and Rule-Based Suggestions (including strict allergy & diet safety).
"""
from app.models import Food
from app.services.suggestion_engine import generate_suggestions
from app.services.target_calculator import (
    calculate_bmr,
    calculate_calories_burned,
    calculate_daily_targets,
)


def test_mifflin_st_jeor_bmr():
    # Male: 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
    assert round(calculate_bmr(70, 175, 30, "Male"), 2) == 1648.75
    # Female: 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25
    assert round(calculate_bmr(60, 165, 28, "Female"), 2) == 1330.25
    # Prefer not to say = exact average of male and female
    avg = (calculate_bmr(65, 170, 30, "Male") + calculate_bmr(65, 170, 30, "Female")) / 2.0
    assert round(calculate_bmr(65, 170, 30, "Prefer not to say"), 2) == round(avg, 2)


def test_safe_calorie_floor_female_and_male():
    # Very small sedentary female trying fast weight loss -> must not go below 1200 kcal
    res_f = calculate_daily_targets(
        age=35, sex="Female", height_cm=150, weight_kg=45,
        activity_level="Sedentary", primary_goal="Lose weight", pace="Fast"
    )
    assert res_f["calories"] >= 1200
    assert res_f["safe_limit_applied"] is True

    # Small sedentary male -> must not go below 1500 kcal
    res_m = calculate_daily_targets(
        age=40, sex="Male", height_cm=160, weight_kg=52,
        activity_level="Sedentary", primary_goal="Lose weight", pace="Fast"
    )
    assert res_m["calories"] >= 1500
    assert res_m["safe_limit_applied"] is True


def test_minor_weight_loss_disabled():
    res = calculate_daily_targets(
        age=16, sex="Female", height_cm=160, weight_kg=60,
        activity_level="Moderately active", primary_goal="Lose weight"
    )
    assert res["calories"] == res["maintenance_calories"]
    assert any("under 18" in n.lower() for n in res["notices"])


def test_water_target_with_exercise():
    rest = calculate_daily_targets(
        age=28, sex="Male", height_cm=175, weight_kg=80,
        activity_level="Moderately active", primary_goal="Maintain weight",
        has_moderate_or_heavy_exercise=False
    )
    active = calculate_daily_targets(
        age=28, sex="Male", height_cm=175, weight_kg=80,
        activity_level="Moderately active", primary_goal="Maintain weight",
        has_moderate_or_heavy_exercise=True
    )
    assert rest["water_ml"] == 2800
    assert active["water_ml"] == 3300


def test_calories_burned_met():
    # Walking Moderate MET = 3.8 * 70kg * 1 hour = 266.0 kcal
    assert calculate_calories_burned("Walking", 70.0, 60, "Moderate") == 266.0


def test_suggestions_never_include_allergens_or_wrong_diet():
    foods = [
        Food(id=1, name_en="Paneer", name_hi="पनीर", category="Dairy", calories_per_100g=265,
             protein_per_100g=18.3, carbs_per_100g=3.4, fat_per_100g=20.8,
             serving_sizes=[{"label": "100g", "grams": 100}], diet_tags=["vegetarian"], allergen_tags=["dairy"], is_active=True),
        Food(id=2, name_en="Chicken", name_hi="चिकन", category="Meat", calories_per_100g=165,
             protein_per_100g=31.0, carbs_per_100g=0.0, fat_per_100g=3.6,
             serving_sizes=[{"label": "150g", "grams": 150}], diet_tags=["non-vegetarian"], allergen_tags=[], is_active=True),
        Food(id=3, name_en="Yellow Dal", name_hi="दाल", category="Legumes and pulses", calories_per_100g=116,
             protein_per_100g=6.4, carbs_per_100g=15.8, fat_per_100g=3.1,
             serving_sizes=[{"label": "150g", "grams": 150}], diet_tags=["vegetarian", "vegan"], allergen_tags=[], is_active=True),
    ]
    res = generate_suggestions(
        remaining_calories=500, remaining_protein=30, remaining_carbs=50, remaining_fat=15,
        foods=foods, diet_type="Vegetarian", allergies=["dairy"]
    )
    names = [s["name_en"] for s in res["suggestions"]]
    assert "Paneer" not in names  # Allergy blocked
    assert "Chicken" not in names  # Non-veg blocked
    assert "Yellow Dal" in names
