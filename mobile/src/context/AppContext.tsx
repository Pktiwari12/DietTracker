import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  AppSettings, DailyTargets, ExerciseRecord, FavouriteMeal, MealCategory,
  MealFoodEntry, MealRecord, OnboardingAnswers, PendingPhotoJob, UserSession,
  WaterRecord, WeightRecord,
} from '../types';
import { calculateCaloriesBurned, calculateDailyTargets } from '../utils/targetCalculator';
import { isSameLocalDay } from '../utils/units';

const STORAGE_KEY = '@informeddiet_state_v1';

const DEFAULT_ONBOARDING: OnboardingAnswers = {
  name: '',
  age: '',
  sex: '',
  country: '',
  height_cm: '',
  weight_kg: '',
  primary_goal: 'Improve overall health',
  secondary_goals: [],
  target_weight: '',
  pace: 'Moderate pace',
  activity_level: 'Moderately active',
  exercise_regularly: 'Occasionally',
  exercise_types: ['Walking'],
  exercise_frequency: '3-4 days',
  diet_type: 'No preference',
  restrictions: [],
  has_allergies: 'No',
  allergies_text: '',
  preferred_categories: [],
  meals_per_day: '3',
  snack_frequency: 'Once a day',
  water_habit: '1-2 L',
  home_or_outside: 'Mostly home',
  tracked_items: ['Calories', 'Protein', 'Water'],
  log_method: 'Upload food photos',
  reminders_enabled: true,
  reminder_types: ['Meal', 'Water', 'Food logging', 'Weight'],
  is_pregnant: false,
  medical_conditions: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  units: 'metric',
  theme: 'system',
  wifiOnlyUpload: false,
  trainingPhotoConsent: false, // Default OFF (Section 5.5)
  reminders: {
    enabled: true,
    meal: { enabled: true, time: '13:00' },
    water: { enabled: true, intervalHours: 2 },
    logging: { enabled: true, time: '20:30' },
    weight: { enabled: true, time: '08:00' },
  },
};

const DEFAULT_SESSION: UserSession = {
  loggedIn: false,
  onboardingComplete: false,
  seenWelcome: false,
  acceptedDisclaimer: false,
  emailOrPhone: '',
  planType: 'free',
};

interface AppContextValue {
  hydrated: boolean;
  session: UserSession;
  onboarding: OnboardingAnswers;
  targets: DailyTargets;
  settings: AppSettings;
  meals: MealRecord[];
  waterLogs: WaterRecord[];
  weightLogs: WeightRecord[];
  exerciseLogs: ExerciseRecord[];
  favourites: FavouriteMeal[];
  pendingPhotos: PendingPhotoJob[];
  streakDays: number;
  userAllergies: string[];
  setSeenWelcome: () => void;
  acceptDisclaimer: () => void;
  login: (emailOrPhone: string, name?: string) => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateOnboardingDraft: (partial: Partial<OnboardingAnswers>) => void;
  completeOnboarding: (finalAnswers: OnboardingAnswers) => DailyTargets;
  updateCustomTargets: (partial: Partial<Pick<DailyTargets, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'water_ml'>>) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  addMeal: (meal: Omit<MealRecord, 'id'>) => void;
  updateMeal: (id: string, mealType: MealCategory, items: MealFoodEntry[]) => void;
  deleteMeal: (id: string) => void;
  addWater: (amountMl: number) => void;
  updateWater: (id: string, amountMl: number) => void;
  deleteWater: (id: string) => void;
  addWeight: (weightKg: number) => void;
  deleteWeight: (id: string) => void;
  addExercise: (activityType: string, durationMin: number, intensity: 'Light' | 'Moderate' | 'Vigorous') => void;
  deleteExercise: (id: string) => void;
  toggleFavourite: (title: string, items: MealFoodEntry[]) => void;
  queueOfflinePhoto: (photoUri: string, mealType: MealCategory) => void;
  removePendingPhoto: (id: string) => void;
  scheduleLocalReminders: () => Promise<boolean>;
  exportAllDataJson: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<UserSession>(DEFAULT_SESSION);
  const [onboarding, setOnboarding] = useState<OnboardingAnswers>(DEFAULT_ONBOARDING);
  const [targets, setTargets] = useState<DailyTargets>(() => calculateDailyTargets(DEFAULT_ONBOARDING));
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterRecord[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightRecord[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseRecord[]>([]);
  const [favourites, setFavourites] = useState<FavouriteMeal[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhotoJob[]>([]);

  // Load persisted local state on cold start
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.session) setSession(parsed.session);
          if (parsed.onboarding) setOnboarding({ ...DEFAULT_ONBOARDING, ...parsed.onboarding });
          if (parsed.targets) setTargets(parsed.targets);
          if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
          if (parsed.meals) setMeals(parsed.meals);
          if (parsed.waterLogs) setWaterLogs(parsed.waterLogs);
          if (parsed.weightLogs) setWeightLogs(parsed.weightLogs);
          if (parsed.exerciseLogs) setExerciseLogs(parsed.exerciseLogs);
          if (parsed.favourites) setFavourites(parsed.favourites);
          if (parsed.pendingPhotos) setPendingPhotos(parsed.pendingPhotos);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  // Persist on changes
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        session, onboarding, targets, settings, meals, waterLogs, weightLogs, exerciseLogs, favourites, pendingPhotos,
      })
    ).catch(() => {});
  }, [hydrated, session, onboarding, targets, settings, meals, waterLogs, weightLogs, exerciseLogs, favourites, pendingPhotos]);

  const userAllergies = useMemo(() => {
    if (onboarding.has_allergies !== 'Yes' || !onboarding.allergies_text.trim()) return [];
    return onboarding.allergies_text.split(',').map((s) => s.trim()).filter(Boolean);
  }, [onboarding.has_allergies, onboarding.allergies_text]);

  const streakDays = useMemo(() => {
    if (meals.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const hasMeal = meals.some((m) => isSameLocalDay(m.eaten_at, d));
      if (hasMeal) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [meals]);

  const setSeenWelcome = () => setSession((s) => ({ ...s, seenWelcome: true }));
  const acceptDisclaimer = () => setSession((s) => ({ ...s, acceptedDisclaimer: true }));

  const login = (emailOrPhone: string, name?: string) => {
    setSession((s) => ({ ...s, loggedIn: true, emailOrPhone }));
    if (name) setOnboarding((o) => ({ ...o, name }));
  };

  const logout = async () => {
    // Section 4 #1: Logout clears local private data
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSession({ ...DEFAULT_SESSION, seenWelcome: true });
    setOnboarding(DEFAULT_ONBOARDING);
    setMeals([]);
    setWaterLogs([]);
    setWeightLogs([]);
    setExerciseLogs([]);
    setFavourites([]);
    setPendingPhotos([]);
  };

  const deleteAccount = async () => {
    await logout();
  };

  const updateOnboardingDraft = (partial: Partial<OnboardingAnswers>) => {
    setOnboarding((prev) => ({ ...prev, ...partial }));
  };

  const completeOnboarding = (finalAnswers: OnboardingAnswers) => {
    const computed = calculateDailyTargets(finalAnswers);
    setOnboarding(finalAnswers);
    setTargets(computed);
    setSession((s) => ({ ...s, onboardingComplete: true }));
    const w = Number(finalAnswers.weight_kg);
    if (w > 0 && weightLogs.length === 0) {
      setWeightLogs([{ id: `w_${Date.now()}`, weight_kg: w, logged_at: new Date().toISOString() }]);
    }
    return computed;
  };

  const updateCustomTargets = (partial: Partial<Pick<DailyTargets, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'water_ml'>>) => {
    setTargets((prev) => ({ ...prev, ...partial }));
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const addMeal = (meal: Omit<MealRecord, 'id'>) => {
    setMeals((prev) => [{ ...meal, id: `m_${Date.now()}` }, ...prev]);
  };

  const updateMeal = (id: string, mealType: MealCategory, items: MealFoodEntry[]) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              meal_type: mealType,
              items,
              total_calories: Math.round(items.reduce((s, i) => s + i.calories, 0)),
              total_protein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
              total_carbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
              total_fat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
            }
          : m
      )
    );
  };

  const deleteMeal = (id: string) => setMeals((prev) => prev.filter((m) => m.id !== id));

  const addWater = (amountMl: number) => {
    setWaterLogs((prev) => [{ id: `wt_${Date.now()}`, amount_ml: amountMl, logged_at: new Date().toISOString() }, ...prev]);
  };

  const updateWater = (id: string, amountMl: number) => {
    setWaterLogs((prev) => prev.map((w) => (w.id === id ? { ...w, amount_ml: amountMl } : w)));
  };

  const deleteWater = (id: string) => setWaterLogs((prev) => prev.filter((w) => w.id !== id));

  const addWeight = (weightKg: number) => {
    // Never overwrites old records
    setWeightLogs((prev) => [{ id: `wg_${Date.now()}`, weight_kg: weightKg, logged_at: new Date().toISOString() }, ...prev]);
    setOnboarding((prev) => ({ ...prev, weight_kg: String(weightKg) }));
  };

  const deleteWeight = (id: string) => setWeightLogs((prev) => prev.filter((w) => w.id !== id));

  const addExercise = (activityType: string, durationMin: number, intensity: 'Light' | 'Moderate' | 'Vigorous') => {
    const weight = Number(onboarding.weight_kg) || 70;
    const burned = calculateCaloriesBurned(activityType, weight, durationMin, intensity);
    setExerciseLogs((prev) => [
      {
        id: `ex_${Date.now()}`,
        activity_type: activityType,
        duration_min: durationMin,
        intensity,
        calories_burned: burned,
        logged_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const deleteExercise = (id: string) => setExerciseLogs((prev) => prev.filter((e) => e.id !== id));

  const toggleFavourite = (title: string, items: MealFoodEntry[]) => {
    setFavourites((prev) => {
      const exists = prev.find((f) => f.title === title);
      if (exists) return prev.filter((f) => f.title !== title);
      return [{ id: `fav_${Date.now()}`, title, items }, ...prev];
    });
  };

  const queueOfflinePhoto = (photoUri: string, mealType: MealCategory) => {
    setPendingPhotos((prev) => [
      { id: `pq_${Date.now()}`, photo_uri: photoUri, meal_type: mealType, created_at: new Date().toISOString() },
      ...prev,
    ]);
  };

  const removePendingPhoto = (id: string) => setPendingPhotos((prev) => prev.filter((p) => p.id !== id));

  const scheduleLocalReminders = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return false;
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!settings.reminders.enabled) return true;

      if (settings.reminders.water.enabled) {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Hydration Reminder', body: 'Time for a glass of water.' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: settings.reminders.water.intervalHours * 3600, repeats: true },
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  const exportAllDataJson = () =>
    JSON.stringify({ exportedAt: new Date().toISOString(), onboarding, targets, meals, waterLogs, weightLogs, exerciseLogs }, null, 2);

  return (
    <AppContext.Provider
      value={{
        hydrated, session, onboarding, targets, settings, meals, waterLogs, weightLogs, exerciseLogs,
        favourites, pendingPhotos, streakDays, userAllergies,
        setSeenWelcome, acceptDisclaimer, login, logout, deleteAccount,
        updateOnboardingDraft, completeOnboarding, updateCustomTargets, updateSettings,
        addMeal, updateMeal, deleteMeal, addWater, updateWater, deleteWater,
        addWeight, deleteWeight, addExercise, deleteExercise, toggleFavourite,
        queueOfflinePhoto, removePendingPhoto, scheduleLocalReminders, exportAllDataJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
