from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.models.user import User
from app.services.user import AuthService

class AuthController:
    def __init__(self, db: Session):
        self.auth_service = AuthService(db)

    def register(self, user: UserCreate) -> UserRead:
        if self.auth_service.get_user(user.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

        hashed_password = self.auth_service.hash_password(user.password)
        db_user = User(username=user.username, hashed_password=hashed_password, role=user.role)
        self.auth_service.create_user(db_user)

        return UserRead.from_orm(db_user)

    def login(self, username: str, password: str) -> UserRead:
        user = self.auth_service.authenticate_user(username, password)

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

        access_token = self.auth_service.create_access_token(user)
        refresh_token, expires_at = self.auth_service.create_refresh_token(user)
        self.auth_service.save_refresh_token(refresh_token, user.id)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    def get_current_user(self, token: str) -> UserRead:
        user = self.auth_service.get_current_user(token)
        return UserRead.from_orm(user)