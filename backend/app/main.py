import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import admin, api_v1, vlm_nutrition
from app.services.nutrition_engine import get_nutrition_engine
from app.services.nutrition_seed import seed_nutrition_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_nutrition_db(db)
    finally:
        db.close()
    # Preload master_nutrition.csv engine if present
    if os.path.exists(settings.master_nutrition_csv):
        get_nutrition_engine(settings.master_nutrition_csv)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.1.0",
    description="InformedDiet REST API — Qwen3-VL Food Identification + Master Nutrition Engine + Admin Panel",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import re
from time import perf_counter
from uuid import uuid4

from fastapi import Request
from app.services.vlm_service import food_photo_request_id, logger as food_photo_logger

@app.middleware("http")
async def log_food_photo(request: Request, call_next):
    if request.method != "POST" or request.url.path != "/api/identify-food":
        return await call_next(request)

    incoming_id = request.headers.get("X-Request-ID", "")
    request_id = incoming_id if re.fullmatch(r"[A-Za-z0-9_-]{1,64}", incoming_id) else uuid4().hex
    token = food_photo_request_id.set(request_id)
    started_at = perf_counter()
    food_photo_logger.info(
        "[%s] PHONE -> LOCAL POST /api/identify-food mode=%s",
        request_id, settings.vlm_mode,
    )
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        food_photo_logger.info(
            "[%s] LOCAL -> PHONE status=%d elapsed_ms=%.0f",
            request_id, response.status_code, (perf_counter() - started_at) * 1000,
        )
        return response
    except Exception as exc:
        food_photo_logger.error(
            "[%s] LOCAL handler failed error=%s", request_id, type(exc).__name__,
        )
        raise
    finally:
        food_photo_request_id.reset(token)


app.include_router(api_v1.router)
app.include_router(vlm_nutrition.router)
app.include_router(admin.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "vlm_mode": settings.vlm_mode,
        "master_csv_loaded": os.path.exists(settings.master_nutrition_csv),
    }
