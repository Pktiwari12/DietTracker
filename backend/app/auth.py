import base64
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User

basic_security = HTTPBasic()


def create_dev_token(auth_uid: str) -> str:
    payload = {
        "sub": auth_uid,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def verify_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": "Please sign in to continue."},
        )
    token = authorization.split(" ", 1)[1].strip()

    # Optional Firebase verification if FIREBASE_CREDENTIALS_PATH is configured
    if settings.firebase_credentials_path:
        try:
            import firebase_admin
            from firebase_admin import auth as fb_auth
            decoded = fb_auth.verify_id_token(token)
            return decoded["uid"]
        except Exception:
            pass

    # Local JWT verification for Expo dev / self-hosted setups
    try:
        decoded = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return str(decoded["sub"])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Your session expired. Please log in again."},
        )


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    auth_uid = verify_bearer_token(authorization)
    user = db.query(User).filter(User.auth_uid == auth_uid, User.is_deleted == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "Account not found. Please sign in again."},
        )
    return user


def verify_admin(credentials: HTTPBasicCredentials = Depends(basic_security)) -> str:
    valid_user = secrets.compare_digest(credentials.username, settings.admin_username)
    valid_pass = secrets.compare_digest(credentials.password, settings.admin_password)
    if not (valid_user and valid_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username
