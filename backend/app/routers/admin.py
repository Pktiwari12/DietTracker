import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import verify_admin
from app.config import settings
from app.database import get_db
from app.models import AdminConfig, Feedback, Food, Meal, MealItem, User
from app.schemas import AdminFoodRequest

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


@router.get("", response_class=HTMLResponse)
def admin_dashboard_page(_admin: str = Depends(verify_admin)):
    tpl_path = os.path.join(os.path.dirname(__file__), "..", "templates", "admin.html")
    with open(tpl_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@router.get("/stats")
def admin_stats(_admin: str = Depends(verify_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).filter(User.is_deleted == False).count()
    total_meals = db.query(Meal).filter(Meal.is_deleted == False).count()
    avg_conf = db.query(func.avg(MealItem.confidence)).scalar() or 0.0
    corrected = (
        db.query(MealItem.name_shown, func.count(MealItem.id).label("cnt"))
        .filter(MealItem.was_edited_by_user == True)
        .group_by(MealItem.name_shown)
        .order_by(func.count(MealItem.id).desc())
        .limit(5)
        .all()
    )
    cfg = db.query(AdminConfig).filter(AdminConfig.key == "active_yolo_model_version").first()
    active_model = cfg.value.get("version") if cfg and isinstance(cfg.value, dict) else settings.active_yolo_model_version
    return {
        "total_users": total_users,
        "total_meals": total_meals,
        "avg_recognition_confidence": round(float(avg_conf), 2),
        "active_yolo_model_version": active_model,
        "most_corrected_foods": [{"name": r[0], "corrections": r[1]} for r in corrected],
    }


@router.get("/foods")
def admin_list_foods(_admin: str = Depends(verify_admin), db: Session = Depends(get_db)):
    foods = db.query(Food).order_by(Food.id.desc()).all()
    return [
        {
            "id": f.id,
            "name_en": f.name_en,
            "name_hi": f.name_hi,
            "category": f.category,
            "cuisine": f.cuisine,
            "calories_per_100g": f.calories_per_100g,
            "protein_per_100g": f.protein_per_100g,
            "diet_tags": f.diet_tags,
            "allergen_tags": f.allergen_tags,
            "is_active": f.is_active,
        }
        for f in foods
    ]


@router.post("/foods")
def admin_add_food(payload: AdminFoodRequest, _admin: str = Depends(verify_admin), db: Session = Depends(get_db)):
    food = Food(**payload.model_dump())
    db.add(food)
    db.commit()
    db.refresh(food)
    return {"id": food.id, "status": "created"}


@router.put("/foods/{food_id}/toggle")
def admin_toggle_food(food_id: int, _admin: str = Depends(verify_admin), db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    food.is_active = not food.is_active
    db.commit()
    return {"id": food.id, "is_active": food.is_active}


@router.put("/model-version")
def admin_switch_model(version: str, _admin: str = Depends(verify_admin), db: Session = Depends(get_db)):
    cfg = db.query(AdminConfig).filter(AdminConfig.key == "active_yolo_model_version").first()
    if not cfg:
        cfg = AdminConfig(key="active_yolo_model_version", value={"version": version})
    else:
        cfg.value = {"version": version}
    db.add(cfg)
    db.commit()
    return {"active_yolo_model_version": version}


@router.get("/feedback")
def admin_list_feedback(_admin: str = Depends(verify_admin), db: Session = Depends(get_db)):
    rows = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(100).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "category": r.category,
            "message": r.message,
            "approved_for_training": r.approved_for_training,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.put("/feedback/{feedback_id}/approve")
def admin_approve_training(feedback_id: int, _admin: str = Depends(verify_admin), db: Session = Depends(get_db)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.approved_for_training = not fb.approved_for_training
    db.commit()
    return {"id": fb.id, "approved_for_training": fb.approved_for_training}
