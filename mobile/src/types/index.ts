export type LanguageCode = 'en' | 'hi';
export type UnitSystem = 'metric' | 'imperial';
export type ThemePreference = 'system' | 'light' | 'dark';
export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface Micronutrients {
  vit_a_mcg?: number;
  vit_b12_mcg?: number;
  vit_c_mg?: number;
  vit_d_mcg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
  magnesium_mg?: number;
  zinc_mg?: number;
  folate_mcg?: number;
}

export interface FoodItem {
  id: number;
  name_en: string;
  name_hi: string;
  category: string;
  cuisine: 'Indian' | 'Global';
  yolo_class?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fibre_per_100g?: number;
  sugar_per_100g?: number;
  micronutrients: Micronutrients;
  serving_sizes: { label: string; grams: number }[];
  grams_per_piece?: number;
  diet_tags: string[];
  allergen_tags: string[];
  source: string;
}

export interface MealFoodEntry {
  id: string;
  food_id?: number;
  name_en: string;
  name_hi?: string;
  grams: number;
  estimated_grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients: Micronutrients;
  confidence: number;
  is_low_confidence?: boolean;
  alternatives?: { food_id: number; name_en: string; name_hi: string }[];
  bbox?: [number, number, number, number];
  allergen_tags?: string[];
  allergy_alerts?: string[];
  was_edited_by_user?: boolean;
}

export interface MealRecord {
  id: string;
  meal_type: MealCategory;
  eaten_at: string; // ISO string
  photo_uri?: string;
  items: MealFoodEntry[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  source: 'photo' | 'manual';
  synced?: boolean;
}

export interface WaterRecord {
  id: string;
  amount_ml: number;
  logged_at: string;
}

export interface WeightRecord {
  id: string;
  weight_kg: number;
  logged_at: string;
}

export interface ExerciseRecord {
  id: string;
  activity_type: string;
  duration_min: number;
  intensity: 'Light' | 'Moderate' | 'Vigorous';
  calories_burned: number;
  logged_at: string;
}

export interface FavouriteMeal {
  id: string;
  title: string;
  items: MealFoodEntry[];
}

export interface PendingPhotoJob {
  id: string;
  photo_uri: string;
  meal_type: MealCategory;
  created_at: string;
}

export interface DailyTargets {
  bmr: number;
  maintenance_calories: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  expected_weekly_change_kg: number;
  micronutrient_targets: Required<Micronutrients>;
  safe_limit_applied: boolean;
  notices: string[];
}

export interface OnboardingAnswers {
  // Step 1: Basic Info (Q1-Q6)
  name: string;
  age: string;
  sex: 'Male' | 'Female' | 'Prefer not to say' | '';
  country: string;
  height_cm: string;
  weight_kg: string;
  // Step 2: Goals (Q7-Q10)
  primary_goal: string;
  secondary_goals: string[];
  target_weight: string;
  pace: string;
  // Step 3: Activity (Q11-Q14)
  activity_level: string;
  exercise_regularly: string;
  exercise_types: string[];
  exercise_frequency: string;
  // Step 4: Diet (Q15-Q18)
  diet_type: string;
  restrictions: string[];
  has_allergies: 'Yes' | 'No';
  allergies_text: string;
  preferred_categories: string[];
  // Step 5: Eating Habits (Q19-Q22)
  meals_per_day: string;
  snack_frequency: string;
  water_habit: string;
  home_or_outside: string;
  // Step 6: Tracking Prefs (Q23-Q25)
  tracked_items: string[];
  log_method: string;
  reminders_enabled: boolean;
  reminder_types: string[];
  // Special cases
  is_pregnant: boolean;
  medical_conditions: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  meal: { enabled: boolean; time: string };
  water: { enabled: boolean; intervalHours: number };
  logging: { enabled: boolean; time: string };
  weight: { enabled: boolean; time: string };
}

export interface AppSettings {
  language: LanguageCode;
  units: UnitSystem;
  theme: ThemePreference;
  wifiOnlyUpload: boolean;
  trainingPhotoConsent: boolean; // Default OFF (Section 5.5)
  reminders: ReminderSettings;
}

export interface UserSession {
  loggedIn: boolean;
  onboardingComplete: boolean;
  seenWelcome: boolean;
  acceptedDisclaimer: boolean;
  emailOrPhone: string;
  token?: string;
  planType: 'free' | 'premium'; // Prepared for future monetisation
}
