from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.refresh_repo = RefreshTokenRepository(db)

    def hash_password(self, password: str):
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str):
        return pwd_context.verify(plain_password, hashed_password)

    def get_user(self, username: str):
        return self.user_repo.get_by_username(username)

    def create_access_token(self, user: User):
        expire = datetime.now() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

        payload = {
            "sub": user.username,
            "user_id": user.id,
            "type": "access_token",
            "exp": expire
        }

        return jwt.encode (
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

    def create_refresh_token(self, user: User):
        expire = datetime.utcnow() + timedelta(
            minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )

        payload = {
            "sub": user.username,
            "user_id": user.id,
            "type": "refresh_token",
            "exp": expire
        }

        encoded_jwt = jwt.encode(
            payload,
            settings.REFRESH_SECRET_KEY,
            algorithm=settings.REFRESH_ALGORITHM
        )

        return {
            encoded_jwt,
            expire
        }

    def save_refresh_token(self, token: str, user_id: int):
        self.refresh_repo.create(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
    def verify_refresh_token(self, refresh_token: str):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(
                refresh_token,
                settings.REFRESH_SECRET_KEY,
                algorithms=[settings.REFRESH_ALGORITHM],
            )

            if payload.get("type") != "refresh_token":
                raise credentials_exception

            username = payload.get("sub")
            user_id = payload.get("user_id")

            if username is None or user_id is None:
                raise credentials_exception

            return payload

        except JWTError:
            raise credentials_exception

    
    def refresh_access_token(self, refresh_token: str):
        payload = self.verify_refresh_token(refresh_token)

        db_token = self.refresh_repo.get_by_token(refresh_token)

        if not db_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        if db_token.is_revoked:
            raise HTTPException(status_code=401, detail="Token revoked")

        if db_token.expires_at < datetime.now():
            raise HTTPException(status_code=401, detail="Token expired")

        user = db_token.user

        new_access_token = self.create_access_token(user)

        return {
            "access_token": new_access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
            }
        
    def authenticate_user(self, username: str, password: str):
        user = self.user_repo.get_by_username(username)

        if not user or not self.verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

        return user

    def get_current_user(self, token: str) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = self.user_repo.get_by_username(username)
        if user is None:
            raise credentials_exception

        return user