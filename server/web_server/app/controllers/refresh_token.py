from app.schemas.auth import TokenResponse
from fastapi import HTTPException, status, Request, Response
from sqlalchemy.orm import Session

from app.services.auth import AuthService
from app.core.config import settings

class RefreshTokenController:
    def __init__(self, db: Session):
        self.auth_service = AuthService(db)

    def refresh(self, request: Request, response: Response):
        """
        Refresh the access token.
        
        Args:
            request: The request object
            response: The response object
            
        Returns:
            The new access token
        """
        refresh_token = request.cookies.get(settings.REFRESH_COOKIE_NAME)

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is missing"
            )

        tokens = self.auth_service.refresh_access_token(refresh_token)

        response.set_cookie(
            key=settings.REFRESH_COOKIE_NAME,
            value=tokens.refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.REFRESH_COOKIE_SAMESITE,
            max_age=settings.REFRESH_COOKIE_MAX_AGE_SECONDS,
        )

        return TokenResponse(
            access_token=tokens.access_token,
            token_type=tokens.token_type,
            user=tokens.user,
        )