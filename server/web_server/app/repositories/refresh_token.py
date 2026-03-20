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

    def get_by_token(self, refresh_token: str):
        return self.db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).first()

    def get_by_id(self, token_id: int):
        return self.db.query(RefreshToken).filter(
            RefreshToken.id == token_id
        ).first()

    def get_all_active_by_user(self, user_id):
        return self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).all()

    def revoke(self, refresh_token: str):
        db_token = self.get_by_token(refresh_token)
        if db_token:
            db_token.is_revoked = True
            self.db.commit()

    def delete(self, refresh_token: str):
        db_token = self.get_by_token(refresh_token)
        if db_token:
            self.db.delete(db_token)
            self.db.commit()