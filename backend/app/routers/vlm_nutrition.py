from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel

from app.config import settings
from app.services.nutrition_engine import get_nutrition_engine
from app.services.vlm_service import vlm_service

router = APIRouter(prefix="/api", tags=["VLM & Deterministic Nutrition"])


class CalculateNutrientsRequest(BaseModel):
    detected_output: Dict[str, Any]
    delete_names: Optional[List[str]] = None
    rename_map: Optional[Dict[str, str]] = None
    add_items: Optional[List[Dict[str, Any]]] = None
    user_quantities: Optional[Dict[str, Dict[str, Any]]] = None
    fallback_grams: float = 100.0
    user_allergies: Optional[List[str]] = None


@router.post("/identify-food")
async def identify_food(
    photo: UploadFile = File(...),
    meal_type: str = Form("Lunch"),
):
    """
    Step 1 of the two-step pipeline:
    Accepts a meal photo, runs Qwen3-VL-8B-Instruct (or configured VLM_MODE),
    and returns strict JSON listing detected items and visible_toppings.
    Never asks the VLM to guess calories or nutrients.
    """
    content = await photo.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail={"code": "FILE_TOO_LARGE", "message": f"Photo must be under {settings.max_upload_mb} MB."},
        )
    result = vlm_service.identify_food(content, meal_type=meal_type)
    return {
        "image_scope": result.get("image_scope", "multi_item"),
        "items": result.get("items", []),
        "vlm_mode": settings.vlm_mode,
        "model_name": settings.vlm_model_name,
    }


@router.post("/calculate-nutrients")
def calculate_nutrients(payload: CalculateNutrientsRequest):
    """
    Step 2 of the two-step pipeline:
    Applies user edits (delete, rename, add, grams or piece/default unit quantities)
    and computes exact deterministic nutrients from data/master_nutrition.csv.
    """
    engine = get_nutrition_engine(settings.master_nutrition_csv)
    result = engine.calculate_nutrients(
        detected_output=payload.detected_output,
        delete_names=payload.delete_names,
        rename_map=payload.rename_map,
        add_items=payload.add_items,
        user_quantities=payload.user_quantities,
        fallback_grams=payload.fallback_grams,
    )

    # Flag declared user allergies on matched items
    allergies = [a.strip().lower() for a in (payload.user_allergies or []) if a.strip()]
    if allergies:
        for item in result["items"]:
            haystack = f"{item.get('input_name', '')} {item.get('matched_name', '')}".lower()
            item["allergy_alerts"] = [a for a in allergies if a in haystack]
    else:
        for item in result["items"]:
            item["allergy_alerts"] = []

    return result


@router.get("/foods/search")
def search_master_foods(
    q: str = Query(default=""),
    limit: int = Query(default=20, ge=1, le=50),
):
    """Search across all 1,224 rows of data/master_nutrition.csv."""
    engine = get_nutrition_engine(settings.master_nutrition_csv)
    return engine.search_foods(query=q, limit=limit)
