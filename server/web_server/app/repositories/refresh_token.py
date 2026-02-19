from sqlalchemy.orm import Session
from datetime import datetime
from app.models.refresh_token import RefreshToken

class RefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, token: str, expires_at):
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )

        self.db.add(refresh_token)
        self.db.commit()
        self.db.refresh(refresh_token)
        return refresh_token

    def get_by_token(self, token: str):
        return self.db.query(RefreshToken).filter(RefreshToken.token == token).first()

    def revoke(self, refresh_token: RefreshToken):
        refresh_token.is_revoked = True
        self.db.commit()