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
