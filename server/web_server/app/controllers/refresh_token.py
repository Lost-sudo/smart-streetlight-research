from app.schemas.auth import TokenResponse
from fastapi import HTTPException, status, Request, Response
from sqlalchemy.orm import Session

from app.services.user import AuthService

class RefreshTokenController:
    def __init__(self, db: Session):
        self.auth_service = AuthService(db)

    def refresh(self, request: Request, response: Response):
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is missing"
            )

        tokens = self.auth_service.refresh_access_token(refresh_token)

        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh_token"],
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=3600,
        )

        tokens.pop("refresh_token")

        return TokenResponse(
            access_token=tokens["access_token"],
            token_type=tokens["token_type"],
        )