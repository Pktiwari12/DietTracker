"""
Section 7: Target Calculation Rules (kept in one place so a nutritionist can adjust).
Implements Mifflin-St Jeor BMR, activity factors, goal adjustments, safe limits,
macro splits, water targets, editable MET table, and editable micronutrient RDAs.
"""
from typing import Dict, List, Optional, Tuple

ACTIVITY_FACTORS: Dict[str, float] = {
    "Sedentary": 1.2,
    "Lightly active": 1.375,
    "Moderately active": 1.55,
    "Very active": 1.725,
}

# Editable MET values table (Section 7 & Section 12)
DEFAULT_MET_TABLE: Dict[str, Dict[str, float]] = {
    "Walking": {"Light": 2.8, "Moderate": 3.8, "Vigorous": 5.0},
    "Running": {"Light": 7.0, "Moderate": 9.8, "Vigorous": 11.5},
    "Cycling": {"Light": 4.0, "Moderate": 7.5, "Vigorous": 10.0},
    "Gym": {"Light": 3.5, "Moderate": 5.5, "Vigorous": 8.0},
    "Yoga": {"Light": 2.5, "Moderate": 3.3, "Vigorous": 4.0},
    "Swimming": {"Light": 5.8, "Moderate": 7.0, "Vigorous": 9.8},
    "Sports": {"Light": 5.0, "Moderate": 7.0, "Vigorous": 9.0},
    "Other": {"Light": 3.5, "Moderate": 5.0, "Vigorous": 6.5},
}

# Editable standard recommended daily values by sex (Section 7)
DEFAULT_MICRONUTRIENT_RDA: Dict[str, Dict[str, float]] = {
    "Male": {
        "vit_a_mcg": 900.0,
        "vit_b12_mcg": 2.4,
        "vit_c_mg": 90.0,
        "vit_d_mcg": 15.0,
        "calcium_mg": 1000.0,
        "iron_mg": 8.0,
        "potassium_mg": 3400.0,
        "magnesium_mg": 420.0,
        "zinc_mg": 11.0,
        "folate_mcg": 400.0,
    },
    "Female": {
        "vit_a_mcg": 700.0,
        "vit_b12_mcg": 2.4,
        "vit_c_mg": 75.0,
        "vit_d_mcg": 15.0,
        "calcium_mg": 1000.0,
        "iron_mg": 18.0,
        "potassium_mg": 2600.0,
        "magnesium_mg": 320.0,
        "zinc_mg": 8.0,
        "folate_mcg": 400.0,
    },
}


def get_micronutrient_rda(sex: str, custom_rda: Optional[Dict] = None) -> Dict[str, float]:
    table = custom_rda or DEFAULT_MICRONUTRIENT_RDA
    if sex in table:
        return dict(table[sex])
    male = table["Male"]
    female = table["Female"]
    return {k: round((male[k] + female[k]) / 2.0, 2) for k in male}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, sex: str) -> float:
    men = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age + 5.0
    women = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age - 161.0
    s = (sex or "").strip().lower()
    if s == "male":
        return men
    if s == "female":
        return women
    return (men + women) / 2.0


def calculate_calories_burned(
    activity_type: str,
    weight_kg: float,
    duration_min: int,
    intensity: str = "Moderate",
    met_table: Optional[Dict[str, Dict[str, float]]] = None,
) -> float:
    table = met_table or DEFAULT_MET_TABLE
    activity_mets = table.get(activity_type, table["Other"])
    met = activity_mets.get(intensity, activity_mets.get("Moderate", 5.0))
    hours = duration_min / 60.0
    return round(met * weight_kg * hours, 1)


def calculate_daily_targets(
    age: int,
    sex: str,
    height_cm: float,
    weight_kg: float,
    activity_level: str,
    primary_goal: str,
    pace: str = "Moderate pace",
    target_weight: Optional[float] = None,
    has_moderate_or_heavy_exercise: bool = False,
    is_pregnant: bool = False,
    medical_conditions: bool = False,
    custom_rda: Optional[Dict] = None,
) -> Dict:
    notices: List[str] = []
    safe_limit_applied = False

    # Minors and special cases (Section 7)
    is_minor = age < 18
    if is_minor:
        notices.append(
            "Because you are under 18, we recommend speaking with a doctor or qualified dietitian. "
            "Weight-loss calorie deficits are disabled for users under 18."
        )
    if is_pregnant:
        notices.append(
            "During pregnancy, please consult your doctor or dietitian for personalized nutrition targets."
        )
    if medical_conditions:
        notices.append(
            "Because you noted a medical condition, please review these targets with your doctor or dietitian."
        )

    bmr = calculate_bmr(weight_kg, height_cm, age, sex)
    factor = ACTIVITY_FACTORS.get(activity_level, 1.375)
    maintenance = bmr * factor

    goal_norm = (primary_goal or "Maintain weight").strip().lower()
    pace_norm = (pace or "Moderate pace").strip().lower()

    # Determine calorie adjustment
    if goal_norm == "lose weight" and not is_minor and not is_pregnant:
        if "gradual" in pace_norm:
            adj_pct = -0.15
        elif "fast" in pace_norm:
            adj_pct = -0.25
        else:
            adj_pct = -0.20
        raw_calories = maintenance * (1.0 + adj_pct)
    elif goal_norm in ("gain weight", "build muscle"):
        adj_pct = 0.10 if "gradual" in pace_norm else 0.15
        raw_calories = maintenance * (1.0 + adj_pct)
    else:
        adj_pct = 0.0
        raw_calories = maintenance

    # Safe limits (Section 7):
    # 1. Never below 1200 kcal for women, 1500 for men (1350 for prefer not to say)
    sex_norm = (sex or "").strip().lower()
    min_floor = 1500.0 if sex_norm == "male" else (1200.0 if sex_norm == "female" else 1350.0)
    # 2. Never more than 1000 kcal below maintenance
    max_deficit_floor = maintenance - 1000.0
    effective_floor = max(min_floor, max_deficit_floor)

    target_calories = raw_calories
    if target_calories < effective_floor:
        target_calories = effective_floor
        safe_limit_applied = True
        notices.append(
            f"We adjusted your daily target to {int(round(target_calories))} kcal to keep your plan within safe daily limits."
        )

    # Check weekly weight change cap: max 1% of body weight per week
    max_weekly_change_kg = round(weight_kg * 0.01, 2)
    expected_weekly_change_kg = round(((target_calories - maintenance) * 7.0) / 7700.0, 2)
    if abs(expected_weekly_change_kg) > max_weekly_change_kg and goal_norm in ("lose weight", "gain weight"):
        sign = -1.0 if expected_weekly_change_kg < 0 else 1.0
        capped_delta = (max_weekly_change_kg * 7700.0) / 7.0
        target_calories = max(effective_floor, maintenance + sign * capped_delta)
        expected_weekly_change_kg = round(sign * max_weekly_change_kg, 2)
        safe_limit_applied = True
        notices.append(
            f"Your pace was capped at {max_weekly_change_kg} kg/week (1% of body weight) for safe, sustainable progress."
        )

    target_calories_int = int(round(target_calories))

    # Protein (Section 7)
    if goal_norm == "build muscle":
        protein_per_kg = 1.8
    elif goal_norm == "lose weight" and not is_minor:
        protein_per_kg = 1.4
    else:
        protein_per_kg = 1.0
    protein_g = int(round(weight_kg * protein_per_kg))
    protein_kcal = protein_g * 4

    # Fat: 25 to 30 percent of calories (use 27.5% midpoint)
    fat_kcal = target_calories_int * 0.275
    fat_g = int(round(fat_kcal / 9.0))

    # Carbs: remaining calories after protein and fat
    remaining_kcal = max(0.0, target_calories_int - protein_kcal - (fat_g * 9))
    carbs_g = int(round(remaining_kcal / 4.0))

    # Water: 35 ml per kg + 500 ml on days with moderate/heavy exercise
    water_ml = int(round(weight_kg * 35.0)) + (500 if has_moderate_or_heavy_exercise else 0)
    water_ml = max(1500, water_ml)

    micronutrients = get_micronutrient_rda(sex, custom_rda)

    return {
        "bmr": int(round(bmr)),
        "maintenance_calories": int(round(maintenance)),
        "calories": target_calories_int,
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g,
        "water_ml": water_ml,
        "expected_weekly_change_kg": expected_weekly_change_kg,
        "micronutrient_targets": micronutrients,
        "safe_limit_applied": safe_limit_applied,
        "notices": notices,
    }
