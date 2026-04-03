from sqlalchemy.orm import Session
from datetime import datetime
from app.models.refresh_token import RefreshToken

class RefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, token: str, expires_at):
        """
        Create a new refresh token.
        
        Args:
            user_id: The ID of the user
            token: The refresh token
            expires_at: The expiration time of the token
            
        Returns:
            The created refresh token
        """
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
        """
        Get a refresh token by its token.
        
        Args:
            refresh_token: The refresh token to retrieve
            
        Returns:
            The refresh token with the given token
        """
        return self.db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).first()

    def get_by_id(self, token_id: int):
        """
        Get a refresh token by its ID.
        
        Args:
            token_id: The ID of the refresh token to retrieve
            
        Returns:
            The refresh token with the given ID
        """
        return self.db.query(RefreshToken).filter(
            RefreshToken.id == token_id
        ).first()

    def get_all_active_by_user(self, user_id):
        """
        Get all active refresh tokens for a user.
        
        Args:
            user_id: The ID of the user
            
        Returns:
            A list of all active refresh tokens for the user
        """
        return self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).all()

    def revoke(self, refresh_token: str):
        """
        Revoke a refresh token.
        
        Args:
            refresh_token: The refresh token to revoke
            
        Returns:
            True if the refresh token was revoked successfully, False otherwise
        """
        db_token = self.get_by_token(refresh_token)
        if db_token:
            db_token.is_revoked = True
            self.db.commit()

    def delete(self, refresh_token: str):
        """
        Delete a refresh token.
        
        Args:
            refresh_token: The refresh token to delete
            
        Returns:
            True if the refresh token was deleted successfully, False otherwise
        """
        db_token = self.get_by_token(refresh_token)
        if db_token:
            self.db.delete(db_token)
            self.db.commit()