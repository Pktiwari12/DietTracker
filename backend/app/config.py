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
    active_yolo_model_version: str = os.getenv("ACTIVE_YOLO_MODEL_VERSION", "v1-informeddiet-food")
    yolo_weights_path: str = os.getenv("YOLO_WEIGHTS_PATH", "")
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "5"))
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")

    class Config:
        env_file = ".env"


settings = Settings()
