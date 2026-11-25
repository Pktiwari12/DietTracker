import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "InformedDiet API"
    api_prefix: str = "/v1"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./informeddiet.db")
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-informeddiet-change-me")
    admin_username: str = os.getenv("ADMIN_USERNAME", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "changeme123")
    firebase_credentials_path: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

    # Qwen3-VL + Master Nutrition CSV settings
    vlm_mode: str = os.getenv("VLM_MODE", "demo_fallback")  # local_unsloth | remote_http | demo_fallback
    vlm_model_name: str = os.getenv("VLM_MODEL_NAME", "unsloth/Qwen3-VL-8B-Instruct-unsloth-bnb-4bit")
    vlm_remote_url: str = os.getenv("VLM_REMOTE_URL", "")
    master_nutrition_csv: str = os.getenv(
        "MASTER_NUTRITION_CSV",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "master_nutrition.csv"),
    )

    # Legacy alias kept for Admin Panel version display
    active_yolo_model_version: str = os.getenv("ACTIVE_YOLO_MODEL_VERSION", "Qwen3-VL-8B-Instruct-4bit")
    yolo_weights_path: str = os.getenv("YOLO_WEIGHTS_PATH", "")
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "5"))
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")

    class Config:
        env_file = ".env"


settings = Settings()
