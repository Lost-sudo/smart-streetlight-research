from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.user import AuthService
from app.schemas.auth import RefreshTokenRequest

class RefreshTokenController:
    def __init__(self, db: Session):
        self.auth_service = AuthService(db)

    def refresh(self, request: RefreshTokenRequest):
        try:
            return self.auth_service.refresh_access_token(request.refresh_token)
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))