from fastapi import HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserRead
from app.schemas.auth import TokenResponse
from app.services.auth import AuthService

class AuthController:
    def __init__(self, db: Session):
        self.auth_service = AuthService(db)

    def register(self, user: UserCreate) -> UserRead:
        new_user = self.auth_service.create_user(user)
        return UserRead.model_validate(new_user, from_attributes=True)

    def login(self, response: Response, username: str, password: str) -> TokenResponse:
        user = self.auth_service.authenticate_user(username, password)

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

        refresh_token, expires_at = self.auth_service.create_refresh_token(user)
        db_refresh_token = self.auth_service.save_refresh_token(refresh_token, user.id, expires_at)
        access_token = self.auth_service.create_access_token(user, db_refresh_token.id)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=86400,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserRead.model_validate(user, from_attributes=True)
        )

    def logout(self, request: Request, response: Response):
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is missing")

        self.auth_service.logout(refresh_token)

        response.delete_cookie("refresh_token", httponly=True, secure=True, samesite="strict")

        return {"message": "Logout successful"}

    def get_current_user(self, token: str) -> UserRead:
        user = self.auth_service.get_current_user(token)
        return UserRead.model_validate(user, from_attributes=True)