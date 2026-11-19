from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import create_dev_token, get_current_user
from app.config import settings
from app.database import get_db
from app.models import (
    AdminConfig, Consent, Device, ExerciseLog, Feedback, Food, Meal, MealItem,
    TrackingPref, User, UserDietPref, UserGoal, UserTarget, WaterLog, WeightLog,
)
from app.schemas import (
    AuthSessionRequest, DeviceRegisterRequest, ExerciseLogRequest, FeedbackRequest,
    MealCreateRequest, OnboardingRequest, ProfileUpdateRequest, SettingsUpdateRequest,
    WaterLogRequest, WeightLogRequest,
)
from app.services.pdf_exporter import build_report_pdf
from app.services.suggestion_engine import generate_suggestions
from app.services.target_calculator import calculate_calories_burned, calculate_daily_targets
from app.services.yolo_service import yolo_recognizer

router = APIRouter(prefix="/v1", tags=["InformedDiet v1"])


def _get_latest_target(db: Session, user_id: int) -> Optional[UserTarget]:
    return (
        db.query(UserTarget)
        .filter(UserTarget.user_id == user_id)
        .order_by(UserTarget.valid_from.desc(), UserTarget.id.desc())
        .first()
    )


def _day_bounds(target_date: date):
    start = datetime(target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    return start, end


@router.post("/auth/session")
def auth_session(payload: AuthSessionRequest, db: Session = Depends(get_db)):
    uid = payload.auth_uid or (payload.email or payload.phone or f"user_{uuid.uuid4().hex[:10]}")
    user = db.query(User).filter(User.auth_uid == uid, User.is_deleted == False).first()
    is_new = False
    if not user:
        is_new = True
        user = User(
            auth_uid=uid,
            name=payload.name or "",
            email=payload.email,
            phone=payload.phone,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        # Default training photo consent = OFF (Section 5.5)
        db.add(Consent(user_id=user.id, consent_type="training_photos", granted=False))
        db.commit()

    token = create_dev_token(user.auth_uid)
    has_targets = _get_latest_target(db, user.id) is not None
    return {
        "token": token,
        "is_new_user": is_new,
        "onboarding_complete": has_targets,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "language": user.language,
            "units": user.units,
            "plan_type": user.plan_type,
        },
    }


@router.post("/onboarding")
def save_onboarding(
    payload: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.name = payload.name
    user.age = payload.age
    user.sex = payload.sex
    user.country = payload.country
    user.height_cm = payload.height_cm
    user.weight_kg = payload.weight_kg

    goal = db.query(UserGoal).filter(UserGoal.user_id == user.id).first() or UserGoal(user_id=user.id)
    goal.primary_goal = payload.primary_goal
    goal.secondary_goals = payload.secondary_goals
    goal.target_weight = payload.target_weight
    goal.pace = payload.pace
    goal.activity_level = payload.activity_level
    goal.exercise_frequency = payload.exercise_frequency
    goal.exercise_types = payload.exercise_types
    goal.is_pregnant = payload.is_pregnant
    goal.medical_conditions = payload.medical_conditions
    db.add(goal)

    diet = db.query(UserDietPref).filter(UserDietPref.user_id == user.id).first() or UserDietPref(user_id=user.id)
    diet.diet_type = payload.diet_type
    diet.restrictions = payload.restrictions
    diet.allergies = payload.allergies
    diet.preferred_categories = payload.preferred_categories
    diet.meals_per_day = payload.meals_per_day
    diet.snack_frequency = payload.snack_frequency
    diet.water_habit = payload.water_habit
    diet.home_or_outside = payload.home_or_outside
    db.add(diet)

    track = db.query(TrackingPref).filter(TrackingPref.user_id == user.id).first() or TrackingPref(user_id=user.id)
    track.tracked_items = payload.tracked_items
    track.log_method = payload.log_method
    track.reminders_enabled = payload.reminders_enabled
    track.reminder_types = payload.reminder_types
    db.add(track)

    # Record initial weight entry
    db.add(WeightLog(user_id=user.id, weight_kg=payload.weight_kg))

    calc = calculate_daily_targets(
        age=payload.age,
        sex=payload.sex,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        activity_level=payload.activity_level,
        primary_goal=payload.primary_goal,
        pace=payload.pace,
        target_weight=payload.target_weight,
        has_moderate_or_heavy_exercise=payload.exercise_regularly.lower() == "yes",
        is_pregnant=payload.is_pregnant,
        medical_conditions=payload.medical_conditions,
    )

    target = UserTarget(
        user_id=user.id,
        calories=calc["calories"],
        protein_g=calc["protein_g"],
        carbs_g=calc["carbs_g"],
        fat_g=calc["fat_g"],
        water_ml=calc["water_ml"],
        micronutrient_targets=calc["micronutrient_targets"],
    )
    db.add(target)
    db.commit()

    return {"targets": calc}


@router.get("/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(UserGoal).filter(UserGoal.user_id == user.id).first()
    diet = db.query(UserDietPref).filter(UserDietPref.user_id == user.id).first()
    target = _get_latest_target(db, user.id)
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "age": user.age,
            "sex": user.sex,
            "country": user.country,
            "height_cm": user.height_cm,
            "weight_kg": user.weight_kg,
            "language": user.language,
            "units": user.units,
            "plan_type": user.plan_type,
        },
        "goals": {
            "primary_goal": goal.primary_goal if goal else "Maintain weight",
            "target_weight": goal.target_weight if goal else None,
            "activity_level": goal.activity_level if goal else "Moderately active",
            "pace": goal.pace if goal else "Moderate pace",
        },
        "diet": {
            "diet_type": diet.diet_type if diet else "No preference",
            "restrictions": diet.restrictions if diet else [],
            "allergies": diet.allergies if diet else [],
            "preferred_categories": diet.preferred_categories if diet else [],
        },
        "targets": {
            "calories": target.calories,
            "protein_g": target.protein_g,
            "carbs_g": target.carbs_g,
            "fat_g": target.fat_g,
            "water_ml": target.water_ml,
            "micronutrient_targets": target.micronutrient_targets,
        } if target else None,
    }


@router.put("/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field in ("name", "age", "sex", "country", "height_cm", "weight_kg", "language", "units"):
        val = getattr(payload, field)
        if val is not None:
            setattr(user, field, val)

    goal = db.query(UserGoal).filter(UserGoal.user_id == user.id).first() or UserGoal(user_id=user.id)
    if payload.primary_goal is not None:
        goal.primary_goal = payload.primary_goal
    if payload.target_weight is not None:
        goal.target_weight = payload.target_weight
    if payload.activity_level is not None:
        goal.activity_level = payload.activity_level
    db.add(goal)

    diet = db.query(UserDietPref).filter(UserDietPref.user_id == user.id).first() or UserDietPref(user_id=user.id)
    if payload.diet_type is not None:
        diet.diet_type = payload.diet_type
    if payload.restrictions is not None:
        diet.restrictions = payload.restrictions
    if payload.allergies is not None:
        diet.allergies = payload.allergies
    db.add(diet)

    if payload.custom_targets:
        cur = _get_latest_target(db, user.id)
        db.add(UserTarget(
            user_id=user.id,
            calories=payload.custom_targets.get("calories", cur.calories if cur else 2000),
            protein_g=payload.custom_targets.get("protein_g", cur.protein_g if cur else 75),
            carbs_g=payload.custom_targets.get("carbs_g", cur.carbs_g if cur else 250),
            fat_g=payload.custom_targets.get("fat_g", cur.fat_g if cur else 65),
            water_ml=payload.custom_targets.get("water_ml", cur.water_ml if cur else 2500),
            micronutrient_targets=cur.micronutrient_targets if cur else {},
        ))
    elif user.age and user.height_cm and user.weight_kg and user.sex:
        calc = calculate_daily_targets(
            age=user.age,
            sex=user.sex,
            height_cm=user.height_cm,
            weight_kg=user.weight_kg,
            activity_level=goal.activity_level,
            primary_goal=goal.primary_goal,
            pace=goal.pace,
            target_weight=goal.target_weight,
        )
        db.add(UserTarget(
            user_id=user.id,
            calories=calc["calories"],
            protein_g=calc["protein_g"],
            carbs_g=calc["carbs_g"],
            fat_g=calc["fat_g"],
            water_ml=calc["water_ml"],
            micronutrient_targets=calc["micronutrient_targets"],
        ))

    db.commit()
    return {"status": "updated"}


@router.get("/targets")
def get_targets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = _get_latest_target(db, user.id)
    if not t:
        raise HTTPException(status_code=404, detail={"code": "NO_TARGETS", "message": "Complete onboarding first."})
    return {
        "calories": t.calories,
        "protein_g": t.protein_g,
        "carbs_g": t.carbs_g,
        "fat_g": t.fat_g,
        "water_ml": t.water_ml,
        "micronutrient_targets": t.micronutrient_targets,
    }


@router.post("/meals/analyze")
async def analyze_meal(
    meal_type: str = Form("Lunch"),
    photo: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = await photo.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail={"code": "FILE_TOO_LARGE", "message": f"Photo must be under {settings.max_upload_mb} MB."},
        )
    result = yolo_recognizer.analyze_image(content, meal_type, db)
    # Check declared allergies (Section 4 #16)
    diet = db.query(UserDietPref).filter(UserDietPref.user_id == user.id).first()
    user_allergies = [a.lower() for a in (diet.allergies if diet and diet.allergies else [])]
    for item in result["items"]:
        matched = [
            a for a in user_allergies
            if any(a in tag.lower() for tag in item.get("allergen_tags", []))
            or a in item.get("name_en", "").lower()
        ]
        item["allergy_alerts"] = matched
    return result


@router.post("/meals")
def create_meal(
    payload: MealCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_cal = round(sum(i.calories for i in payload.items), 1)
    total_p = round(sum(i.protein for i in payload.items), 1)
    total_c = round(sum(i.carbs for i in payload.items), 1)
    total_f = round(sum(i.fat for i in payload.items), 1)

    meal = Meal(
        user_id=user.id,
        meal_type=payload.meal_type,
        eaten_at=payload.eaten_at or datetime.now(timezone.utc),
        photo_url=payload.photo_url,
        total_calories=total_cal,
        total_protein=total_p,
        total_carbs=total_c,
        total_fat=total_f,
        source=payload.source,
        model_version=payload.model_version,
    )
    db.add(meal)
    db.flush()

    for it in payload.items:
        db.add(MealItem(
            meal_id=meal.id,
            food_id=it.food_id,
            name_shown=it.name_shown,
            grams=it.grams,
            estimated_grams=it.estimated_grams,
            calories=it.calories,
            protein=it.protein,
            carbs=it.carbs,
            fat=it.fat,
            micronutrients=it.micronutrients,
            confidence=it.confidence,
            was_edited_by_user=it.was_edited_by_user,
        ))

    db.commit()
    db.refresh(meal)
    return {"id": meal.id, "total_calories": meal.total_calories, "status": "saved"}


@router.get("/meals")
def list_meals(
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Meal).filter(Meal.user_id == user.id, Meal.is_deleted == False)
    if from_date:
        start = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
        q = q.filter(Meal.eaten_at >= start)
    if to_date:
        end = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc) + timedelta(days=1)
        q = q.filter(Meal.eaten_at < end)
    meals = q.order_by(Meal.eaten_at.desc()).all()
    return [
        {
            "id": m.id,
            "meal_type": m.meal_type,
            "eaten_at": m.eaten_at.isoformat(),
            "photo_url": m.photo_url,
            "total_calories": m.total_calories,
            "total_protein": m.total_protein,
            "total_carbs": m.total_carbs,
            "total_fat": m.total_fat,
            "source": m.source,
            "items": [
                {
                    "id": i.id,
                    "food_id": i.food_id,
                    "name_shown": i.name_shown,
                    "grams": i.grams,
                    "calories": i.calories,
                    "protein": i.protein,
                    "carbs": i.carbs,
                    "fat": i.fat,
                    "confidence": i.confidence,
                }
                for i in m.items
            ],
        }
        for m in meals
    ]


@router.put("/meals/{meal_id}")
def update_meal(
    meal_id: int,
    payload: MealCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user.id, Meal.is_deleted == False).first()
    if not meal:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Meal not found."})
    meal.meal_type = payload.meal_type
    meal.total_calories = round(sum(i.calories for i in payload.items), 1)
    meal.total_protein = round(sum(i.protein for i in payload.items), 1)
    meal.total_carbs = round(sum(i.carbs for i in payload.items), 1)
    meal.total_fat = round(sum(i.fat for i in payload.items), 1)
    db.query(MealItem).filter(MealItem.meal_id == meal.id).delete()
    for it in payload.items:
        db.add(MealItem(
            meal_id=meal.id,
            food_id=it.food_id,
            name_shown=it.name_shown,
            grams=it.grams,
            calories=it.calories,
            protein=it.protein,
            carbs=it.carbs,
            fat=it.fat,
            micronutrients=it.micronutrients,
            confidence=it.confidence,
            was_edited_by_user=True,
        ))
    db.commit()
    return {"id": meal.id, "status": "updated"}


@router.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user.id, Meal.is_deleted == False).first()
    if not meal:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Meal not found."})
    meal.is_deleted = True
    meal.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "deleted"}


@router.get("/foods/search")
def search_foods(
    q: str = Query(default=""),
    lang: str = Query(default="en"),
    db: Session = Depends(get_db),
):
    query = db.query(Food).filter(Food.is_active == True)
    if q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(Food.name_en.ilike(like), Food.name_hi.ilike(like), Food.category.ilike(like)))
    results = query.limit(40).all()
    return [
        {
            "id": f.id,
            "name_en": f.name_en,
            "name_hi": f.name_hi,
            "display_name": f.name_hi if lang == "hi" else f.name_en,
            "category": f.category,
            "cuisine": f.cuisine,
            "calories_per_100g": f.calories_per_100g,
            "protein_per_100g": f.protein_per_100g,
            "carbs_per_100g": f.carbs_per_100g,
            "fat_per_100g": f.fat_per_100g,
            "micronutrients": f.micronutrients,
            "serving_sizes": f.serving_sizes,
            "grams_per_piece": f.grams_per_piece,
            "diet_tags": f.diet_tags,
            "allergen_tags": f.allergen_tags,
            "source": f.source,
        }
        for f in results
    ]


@router.post("/water")
def add_water(payload: WaterLogRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = WaterLog(user_id=user.id, amount_ml=payload.amount_ml, logged_at=payload.logged_at or datetime.now(timezone.utc))
    db.add(w)
    db.commit()
    db.refresh(w)
    return {"id": w.id, "amount_ml": w.amount_ml, "logged_at": w.logged_at.isoformat()}


@router.get("/water")
def list_water(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user.id, WaterLog.is_deleted == False)
        .order_by(WaterLog.logged_at.desc())
        .limit(200)
        .all()
    )
    return [{"id": r.id, "amount_ml": r.amount_ml, "logged_at": r.logged_at.isoformat()} for r in rows]


@router.put("/water/{water_id}")
def update_water(water_id: int, payload: WaterLogRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = db.query(WaterLog).filter(WaterLog.id == water_id, WaterLog.user_id == user.id, WaterLog.is_deleted == False).first()
    if not w:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Water entry not found."})
    w.amount_ml = payload.amount_ml
    db.commit()
    return {"id": w.id, "amount_ml": w.amount_ml}


@router.delete("/water/{water_id}")
def delete_water(water_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = db.query(WaterLog).filter(WaterLog.id == water_id, WaterLog.user_id == user.id, WaterLog.is_deleted == False).first()
    if not w:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Water entry not found."})
    w.is_deleted = True
    w.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "deleted"}


@router.post("/weight")
def add_weight(payload: WeightLogRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Never overwrites old records (Section 4 #9 & Section 9)
    entry = WeightLog(user_id=user.id, weight_kg=payload.weight_kg, logged_at=payload.logged_at or datetime.now(timezone.utc))
    user.weight_kg = payload.weight_kg
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "weight_kg": entry.weight_kg, "logged_at": entry.logged_at.isoformat()}


@router.get("/weight")
def list_weight(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == user.id, WeightLog.is_deleted == False)
        .order_by(WeightLog.logged_at.desc())
        .all()
    )
    return [{"id": r.id, "weight_kg": r.weight_kg, "logged_at": r.logged_at.isoformat()} for r in rows]


@router.delete("/weight/{weight_id}")
def delete_weight(weight_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = db.query(WeightLog).filter(WeightLog.id == weight_id, WeightLog.user_id == user.id, WeightLog.is_deleted == False).first()
    if not w:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Weight entry not found."})
    w.is_deleted = True
    w.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "deleted"}


@router.post("/exercise")
def add_exercise(payload: ExerciseLogRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    weight = user.weight_kg or 70.0
    met_cfg = db.query(AdminConfig).filter(AdminConfig.key == "met_table").first()
    met_table = met_cfg.value if met_cfg else None
    burned = calculate_calories_burned(payload.activity_type, weight, payload.duration_min, payload.intensity, met_table)
    ex = ExerciseLog(
        user_id=user.id,
        activity_type=payload.activity_type,
        duration_min=payload.duration_min,
        intensity=payload.intensity,
        calories_burned=burned,
        logged_at=payload.logged_at or datetime.now(timezone.utc),
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return {
        "id": ex.id,
        "activity_type": ex.activity_type,
        "duration_min": ex.duration_min,
        "intensity": ex.intensity,
        "calories_burned": ex.calories_burned,
        "logged_at": ex.logged_at.isoformat(),
    }


@router.get("/exercise")
def list_exercise(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == user.id, ExerciseLog.is_deleted == False)
        .order_by(ExerciseLog.logged_at.desc())
        .limit(200)
        .all()
    )
    return [
        {
            "id": r.id,
            "activity_type": r.activity_type,
            "duration_min": r.duration_min,
            "intensity": r.intensity,
            "calories_burned": r.calories_burned,
            "logged_at": r.logged_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/summary/day")
def day_summary(
    date_str: Optional[str] = Query(default=None, alias="date"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_date = date.fromisoformat(date_str) if date_str else datetime.now(timezone.utc).date()
    start, end = _day_bounds(target_date)

    meals = (
        db.query(Meal)
        .filter(Meal.user_id == user.id, Meal.is_deleted == False, Meal.eaten_at >= start, Meal.eaten_at < end)
        .all()
    )
    water_logs = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user.id, WaterLog.is_deleted == False, WaterLog.logged_at >= start, WaterLog.logged_at < end)
        .all()
    )
    exercises = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == user.id, ExerciseLog.is_deleted == False, ExerciseLog.logged_at >= start, ExerciseLog.logged_at < end)
        .all()
    )

    eaten_cal = round(sum(m.total_calories for m in meals), 1)
    eaten_p = round(sum(m.total_protein for m in meals), 1)
    eaten_c = round(sum(m.total_carbs for m in meals), 1)
    eaten_f = round(sum(m.total_fat for m in meals), 1)
    water_ml = sum(w.amount_ml for w in water_logs)
    burned_cal = round(sum(e.calories_burned for e in exercises), 1)

    target = _get_latest_target(db, user.id)
    t_cal = target.calories if target else 2000
    t_p = target.protein_g if target else 75
    t_c = target.carbs_g if target else 250
    t_f = target.fat_g if target else 65
    t_w = target.water_ml if target else 2500

    rem_cal = round(max(0.0, t_cal - eaten_cal), 1)
    rem_p = round(max(0.0, t_p - eaten_p), 1)
    rem_c = round(max(0.0, t_c - eaten_c), 1)
    rem_f = round(max(0.0, t_f - eaten_f), 1)

    diet = db.query(UserDietPref).filter(UserDietPref.user_id == user.id).first()
    foods = db.query(Food).filter(Food.is_active == True).all()
    suggestions = generate_suggestions(
        remaining_calories=rem_cal,
        remaining_protein=rem_p,
        remaining_carbs=rem_c,
        remaining_fat=rem_f,
        foods=foods,
        diet_type=diet.diet_type if diet else "No preference",
        restrictions=diet.restrictions if diet else [],
        allergies=diet.allergies if diet else [],
        preferred_categories=diet.preferred_categories if diet else [],
    )

    return {
        "date": target_date.isoformat(),
        "eaten": {"calories": eaten_cal, "protein": eaten_p, "carbs": eaten_c, "fat": eaten_f},
        "target": {"calories": t_cal, "protein": t_p, "carbs": t_c, "fat": t_f, "water_ml": t_w},
        "remaining": {"calories": rem_cal, "protein": rem_p, "carbs": rem_c, "fat": rem_f},
        "water_ml": water_ml,
        "calories_burned": burned_cal,
        "net_calories": round(eaten_cal - burned_cal, 1),
        "what_to_eat_next": suggestions,
    }


def _build_report_data(db: Session, user: User, period: str, ref_date: date) -> Dict:
    days = 7 if period == "week" else 30
    start_date = ref_date - timedelta(days=days - 1)
    target = _get_latest_target(db, user.id)
    t_cal = target.calories if target else 2000
    t_p = target.protein_g if target else 75

    daily_series = []
    protein_below_days = 0
    for i in range(days):
        d = start_date + timedelta(days=i)
        s, e = _day_bounds(d)
        ms = db.query(Meal).filter(Meal.user_id == user.id, Meal.is_deleted == False, Meal.eaten_at >= s, Meal.eaten_at < e).all()
        ws = db.query(WaterLog).filter(WaterLog.user_id == user.id, WaterLog.is_deleted == False, WaterLog.logged_at >= s, WaterLog.logged_at < e).all()
        cals = round(sum(m.total_calories for m in ms), 1)
        prot = round(sum(m.total_protein for m in ms), 1)
        carbs = round(sum(m.total_carbs for m in ms), 1)
        fat = round(sum(m.total_fat for m in ms), 1)
        water = sum(w.amount_ml for w in ws)
        if ms and prot < t_p:
            protein_below_days += 1
        daily_series.append({
            "date": d.isoformat(),
            "calories": cals,
            "target_calories": t_cal,
            "protein": prot,
            "carbs": carbs,
            "fat": fat,
            "water_ml": water,
        })

    weights = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == user.id, WeightLog.is_deleted == False)
        .order_by(WeightLog.logged_at.asc())
        .all()
    )
    weight_series = [{"date": w.logged_at.date().isoformat(), "weight_kg": w.weight_kg} for w in weights[-days:]]
    weight_change = round(weight_series[-1]["weight_kg"] - weight_series[0]["weight_kg"], 2) if len(weight_series) >= 2 else 0.0

    logged_days = [d for d in daily_series if d["calories"] > 0]
    denom = max(1, len(logged_days))
    summary = {
        "avg_calories": round(sum(d["calories"] for d in logged_days) / denom, 1),
        "avg_protein": round(sum(d["protein"] for d in logged_days) / denom, 1),
        "avg_carbs": round(sum(d["carbs"] for d in logged_days) / denom, 1),
        "avg_fat": round(sum(d["fat"] for d in logged_days) / denom, 1),
        "avg_water_ml": round(sum(d["water_ml"] for d in daily_series) / days, 0),
        "weight_change_kg": weight_change,
    }
    insights = []
    if protein_below_days > 0:
        insights.append(f"Protein was below target on {protein_below_days} of {len(logged_days)} logged days.")
    if summary["avg_water_ml"] < (target.water_ml if target else 2500):
        insights.append("Average water intake is below your daily hydration goal.")
    if not insights:
        insights.append("Consistent logging! Keep tracking your meals and water daily.")

    return {"period": period, "summary": summary, "daily": daily_series, "weight": weight_series, "insights": insights}


@router.get("/reports")
def get_reports(
    period: str = Query(default="week", pattern="^(week|month)$"),
    date_str: Optional[str] = Query(default=None, alias="date"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ref_date = date.fromisoformat(date_str) if date_str else datetime.now(timezone.utc).date()
    return _build_report_data(db, user, period, ref_date)


@router.get("/reports/export")
def export_report_pdf(
    period: str = Query(default="week", pattern="^(week|month)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _build_report_data(db, user, period, datetime.now(timezone.utc).date())
    pdf_bytes = build_report_pdf(user.name, period, report)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="InformedDiet_{period}_report.pdf"'},
    )


@router.get("/settings")
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    track = db.query(TrackingPref).filter(TrackingPref.user_id == user.id).first()
    consent = (
        db.query(Consent)
        .filter(Consent.user_id == user.id, Consent.consent_type == "training_photos")
        .order_by(Consent.changed_at.desc())
        .first()
    )
    return {
        "language": user.language,
        "units": user.units,
        "reminders_enabled": track.reminders_enabled if track else True,
        "reminder_types": track.reminder_types if track else ["Meal", "Water", "Food logging", "Weight"],
        "reminder_times": track.reminder_times if track else {"meal": "13:00", "water": "every_2h", "logging": "20:30", "weight": "08:00"},
        "wifi_only_upload": track.wifi_only_upload if track else False,
        "dark_mode": track.dark_mode if track else "system",
        "training_photo_consent": consent.granted if consent else False,
    }


@router.put("/settings")
def update_settings(payload: SettingsUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    track = db.query(TrackingPref).filter(TrackingPref.user_id == user.id).first() or TrackingPref(user_id=user.id)
    if payload.reminders_enabled is not None:
        track.reminders_enabled = payload.reminders_enabled
    if payload.reminder_types is not None:
        track.reminder_types = payload.reminder_types
    if payload.reminder_times is not None:
        track.reminder_times = payload.reminder_times
    if payload.wifi_only_upload is not None:
        track.wifi_only_upload = payload.wifi_only_upload
    if payload.dark_mode is not None:
        track.dark_mode = payload.dark_mode
    if payload.language is not None:
        user.language = payload.language
    if payload.units is not None:
        user.units = payload.units
    db.add(track)
    if payload.training_photo_consent is not None:
        db.add(Consent(user_id=user.id, consent_type="training_photos", granted=payload.training_photo_consent))
    db.commit()
    return {"status": "updated"}


@router.post("/devices")
def register_device(payload: DeviceRegisterRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(Device(user_id=user.id, fcm_token=payload.fcm_token, app_version=payload.app_version))
    db.commit()
    return {"status": "registered"}


@router.post("/feedback")
def submit_feedback(payload: FeedbackRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fb = Feedback(
        user_id=user.id,
        meal_id=payload.meal_id,
        category=payload.category,
        message=payload.message,
        photo_url=payload.photo_url,
    )
    db.add(fb)
    db.commit()
    return {"id": fb.id, "status": "received"}


@router.get("/export")
def export_all_user_data(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": get_profile(user=user, db=db),
        "meals": list_meals(user=user, db=db),
        "water": list_water(user=user, db=db),
        "weight": list_weight(user=user, db=db),
        "exercise": list_exercise(user=user, db=db),
    }


@router.delete("/account")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "scheduled_for_permanent_deletion_within_30_days"}
