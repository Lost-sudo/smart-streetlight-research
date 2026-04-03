from sqlalchemy.orm import Session
from app.models.user import User
from fastapi import HTTPException

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_users(self):
        """
        Get all users.
        
        Returns:
            A list of all users
        """
        return self.db.query(User).all()

    def get_by_username(self, username: str):
        """
        Get a user by their username.
        
        Args:
            username: The username of the user to retrieve
            
        Returns:
            The user with the given username
        """
        return self.db.query(User).filter(User.username == username).first()

    def get_by_id(self, user_id: int):
        """
        Get a user by their ID.
        
        Args:
            user_id: The ID of the user to retrieve
            
        Returns:
            The user with the given ID
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, user: User):
        """
        Create a new user.
        
        Args:
            user: The user data to create
            
        Returns:
            The created user
        """
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User):
        """
        Update a user.
        
        Args:
            user: The user data to update
            
        Returns:
            The updated user
        """
        self.db.query(User).filter(User.id == user.id).update({
            User.username: user.username,
            User.email: user.email,
            User.role: user.role,
            User.is_active: user.is_active
        })
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int):
        """
        Delete a user.
        
        Args:
            user_id: The ID of the user to delete
            
        Returns:
            True if the user was deleted successfully, False otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        self.db.delete(user)
        self.db.commit()
        return user