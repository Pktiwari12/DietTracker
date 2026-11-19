from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AuthSessionRequest(BaseModel):
    auth_uid: Optional[str] = None
    name: Optional[str] = ""
    email: Optional[str] = None
    phone: Optional[str] = None


class OnboardingRequest(BaseModel):
    name: str
    age: int = Field(ge=5, le=120)
    sex: str  # Male, Female, Prefer not to say
    country: str = "India"
    height_cm: float = Field(gt=50, lt=280)
    weight_kg: float = Field(gt=15, lt=350)
    primary_goal: str
    secondary_goals: List[str] = []
    target_weight: Optional[float] = None
    pace: str = "Moderate pace"
    activity_level: str
    exercise_regularly: str = "Yes"
    exercise_types: List[str] = []
    exercise_frequency: str = "3-4 days"
    diet_type: str = "No preference"
    restrictions: List[str] = []
    allergies: List[str] = []
    preferred_categories: List[str] = []
    meals_per_day: str = "3"
    snack_frequency: str = "Once a day"
    water_habit: str = "1-2 L"
    home_or_outside: str = "Mostly home"
    tracked_items: List[str] = []
    log_method: str = "Upload food photos"
    reminders_enabled: bool = True
    reminder_types: List[str] = []
    is_pregnant: bool = False
    medical_conditions: bool = False


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    country: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    language: Optional[str] = None
    units: Optional[str] = None
    primary_goal: Optional[str] = None
    target_weight: Optional[float] = None
    activity_level: Optional[str] = None
    diet_type: Optional[str] = None
    restrictions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    custom_targets: Optional[Dict[str, int]] = None


class MealItemInput(BaseModel):
    food_id: Optional[int] = None
    name_shown: str
    grams: float = Field(gt=0)
    estimated_grams: Optional[float] = None
    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fat: float = Field(ge=0)
    micronutrients: Dict[str, float] = {}
    confidence: float = 1.0
    was_edited_by_user: bool = False


class MealCreateRequest(BaseModel):
    meal_type: str
    eaten_at: Optional[datetime] = None
    photo_url: Optional[str] = None
    source: str = "photo"
    model_version: Optional[str] = None
    items: List[MealItemInput]


class WaterLogRequest(BaseModel):
    amount_ml: int = Field(gt=0, le=5000)
    logged_at: Optional[datetime] = None


class WeightLogRequest(BaseModel):
    weight_kg: float = Field(gt=15, lt=350)
    logged_at: Optional[datetime] = None


class ExerciseLogRequest(BaseModel):
    activity_type: str
    duration_min: int = Field(gt=0, le=600)
    intensity: str = "Moderate"
    logged_at: Optional[datetime] = None


class SettingsUpdateRequest(BaseModel):
    reminders_enabled: Optional[bool] = None
    reminder_types: Optional[List[str]] = None
    reminder_times: Optional[Dict[str, str]] = None
    wifi_only_upload: Optional[bool] = None
    dark_mode: Optional[str] = None
    language: Optional[str] = None
    units: Optional[str] = None
    training_photo_consent: Optional[bool] = None


class DeviceRegisterRequest(BaseModel):
    fcm_token: str
    app_version: str = "1.0.0"


class FeedbackRequest(BaseModel):
    meal_id: Optional[int] = None
    category: str = "recognition"
    message: str
    photo_url: Optional[str] = None


class AdminFoodRequest(BaseModel):
    name_en: str
    name_hi: str
    category: str
    cuisine: str = "Indian"
    yolo_class: Optional[str] = None
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    fibre_per_100g: float = 0.0
    sugar_per_100g: float = 0.0
    sodium_mg_per_100g: float = 0.0
    micronutrients: Dict[str, float] = {}
    serving_sizes: List[Dict[str, Any]] = []
    grams_per_piece: Optional[float] = None
    diet_tags: List[str] = []
    allergen_tags: List[str] = []
    source: str = "Admin Custom"
    is_active: bool = True
