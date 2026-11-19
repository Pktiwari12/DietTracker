from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    auth_uid = Column(String(128), unique=True, index=True, nullable=False)
    name = Column(String(120), default="")
    email = Column(String(255), index=True, nullable=True)
    phone = Column(String(32), index=True, nullable=True)
    age = Column(Integer, nullable=True)
    sex = Column(String(32), nullable=True)  # Male, Female, Prefer not to say
    country = Column(String(80), default="India")
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    language = Column(String(10), default="en")  # en, hi
    units = Column(String(16), default="metric")  # metric, imperial
    plan_type = Column(String(32), default="free")  # Prepared for future monetisation (Sec 14.1)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class UserGoal(Base):
    __tablename__ = "user_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    primary_goal = Column(String(64), default="Maintain weight")
    secondary_goals = Column(JSON, default=list)
    target_weight = Column(Float, nullable=True)
    pace = Column(String(32), default="Moderate pace")
    activity_level = Column(String(32), default="Moderately active")
    exercise_frequency = Column(String(32), default="3-4 days")
    exercise_types = Column(JSON, default=list)
    is_pregnant = Column(Boolean, default=False)
    medical_conditions = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class UserDietPref(Base):
    __tablename__ = "user_diet_prefs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    diet_type = Column(String(32), default="No preference")
    restrictions = Column(JSON, default=list)
    allergies = Column(JSON, default=list)
    preferred_categories = Column(JSON, default=list)
    meals_per_day = Column(String(32), default="3")
    snack_frequency = Column(String(32), default="Once a day")
    water_habit = Column(String(32), default="1-2 L")
    home_or_outside = Column(String(32), default="Mostly home")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class UserTarget(Base):
    __tablename__ = "user_targets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    calories = Column(Integer, nullable=False)
    protein_g = Column(Integer, nullable=False)
    carbs_g = Column(Integer, nullable=False)
    fat_g = Column(Integer, nullable=False)
    water_ml = Column(Integer, nullable=False)
    micronutrient_targets = Column(JSON, default=dict)
    valid_from = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class TrackingPref(Base):
    __tablename__ = "tracking_prefs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    tracked_items = Column(JSON, default=list)
    log_method = Column(String(64), default="Upload food photos")
    reminders_enabled = Column(Boolean, default=True)
    reminder_types = Column(JSON, default=list)
    reminder_times = Column(JSON, default=dict)
    wifi_only_upload = Column(Boolean, default=False)
    dark_mode = Column(String(16), default="system")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Food(Base):
    __tablename__ = "foods"
    id = Column(Integer, primary_key=True, index=True)
    name_en = Column(String(160), index=True, nullable=False)
    name_hi = Column(String(160), index=True, nullable=False)
    category = Column(String(64), index=True, nullable=False)
    cuisine = Column(String(32), default="Indian")  # Indian or Global
    yolo_class = Column(String(80), index=True, nullable=True)
    calories_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, nullable=False)
    carbs_per_100g = Column(Float, nullable=False)
    fat_per_100g = Column(Float, nullable=False)
    fibre_per_100g = Column(Float, default=0.0)
    sugar_per_100g = Column(Float, default=0.0)
    sodium_mg_per_100g = Column(Float, default=0.0)
    micronutrients = Column(JSON, default=dict)  # vit_a, vit_b12, vit_c, vit_d, calcium, iron, potassium, magnesium, zinc, folate
    serving_sizes = Column(JSON, default=list)   # [{"label": "1 bowl", "grams": 150}]
    grams_per_piece = Column(Float, nullable=True)
    grams_per_plate_unit = Column(Float, default=180.0)  # Used by YOLO area->grams estimator
    diet_tags = Column(JSON, default=list)       # vegetarian, vegan, eggetarian, non-vegetarian, gluten-free, etc.
    allergen_tags = Column(JSON, default=list)   # dairy, gluten, nuts, egg, fish, soy, peanut
    source = Column(String(64), default="IFCT 2017")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Meal(Base):
    __tablename__ = "meals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    meal_type = Column(String(32), nullable=False)  # Breakfast, Lunch, Dinner, Snacks
    eaten_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    photo_url = Column(Text, nullable=True)
    total_calories = Column(Float, default=0.0)
    total_protein = Column(Float, default=0.0)
    total_carbs = Column(Float, default=0.0)
    total_fat = Column(Float, default=0.0)
    source = Column(String(32), default="photo")  # photo or manual
    model_version = Column(String(64), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), index=True, nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=True)
    name_shown = Column(String(160), nullable=False)
    grams = Column(Float, nullable=False)
    estimated_grams = Column(Float, nullable=True)  # Logged for portion table improvement (Sec 5.3)
    calories = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    micronutrients = Column(JSON, default=dict)
    confidence = Column(Float, default=1.0)
    was_edited_by_user = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    meal = relationship("Meal", back_populates="items")


class WaterLog(Base):
    __tablename__ = "water_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    amount_ml = Column(Integer, nullable=False)
    logged_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class WeightLog(Base):
    __tablename__ = "weight_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    weight_kg = Column(Float, nullable=False)
    logged_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    activity_type = Column(String(64), nullable=False)
    duration_min = Column(Integer, nullable=False)
    intensity = Column(String(32), default="Moderate")
    calories_burned = Column(Float, nullable=False)
    logged_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Favourite(Base):
    __tablename__ = "favourites"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=True)
    title = Column(String(160), nullable=False)
    meal_template = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Consent(Base):
    __tablename__ = "consents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    consent_type = Column(String(64), nullable=False)  # training_photos, analytics, terms
    granted = Column(Boolean, default=False)
    changed_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    fcm_token = Column(String(512), nullable=False)
    app_version = Column(String(32), default="1.0.0")
    last_seen = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=True)
    category = Column(String(64), default="recognition")
    message = Column(Text, nullable=False)
    photo_url = Column(Text, nullable=True)
    approved_for_training = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class AdminConfig(Base):
    __tablename__ = "admin_config"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
