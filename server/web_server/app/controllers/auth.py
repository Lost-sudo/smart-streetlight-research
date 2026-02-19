from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserRead
from app.schemas.auth import TokenResponse
from app.models.user import User
from app.services.user import AuthService

class AuthController:
    def __init__(self, db: Session):
        self.auth_service = AuthService(db)

    def register(self, user: UserCreate) -> UserRead:
        new_user = self.auth_service.create_user(user)
        return UserRead.model_validate(new_user, from_attributes=True)

    def login(self, username: str, password: str) -> UserRead:
        user = self.auth_service.authenticate_user(username, password)

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

        access_token = self.auth_service.create_access_token(user)
        refresh_token, expires_at = self.auth_service.create_refresh_token(user)
        self.auth_service.save_refresh_token(refresh_token, user.id, expires_at)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    def get_current_user(self, token: str) -> UserRead:
        user = self.auth_service.get_current_user(token)
        return UserRead.model_validate(user, from_attributes=True)