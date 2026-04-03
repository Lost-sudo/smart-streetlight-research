from sqlalchemy.orm import Session
from app.services.user import UserService
from app.schemas.user import UserCreate, UserRead, UserUpdate
from fastapi import HTTPException, status
from typing import List

class UserController:
    def __init__(self, db: Session):
        self.user_service = UserService(db)

    def get_all_users(self) -> List[UserRead]:
        """
        Get all users.
        
        Returns:
            A list of all users
        """
        users = self.user_service.get_all_users()

        return [
            UserRead.model_validate(user, from_attributes=True)
            for user in users
        ]

    def get_user_by_username(self, username: str) -> UserRead:
        """
        Get a user by their username.
        
        Args:
            username: The username of the user to retrieve
            
        Returns:
            The user with the given username
        """
        user = self.user_service.get_by_username(username)

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return UserRead.model_validate(user, from_attributes=True)

    def get_user_by_id(self, user_id: int) -> UserRead:
        """
        Get a user by their ID.
        
        Args:
            user_id: The ID of the user to retrieve
            
        Returns:
            The user with the given ID
        """
        user = self.user_service.get_by_id(user_id)

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return UserRead.model_validate(user, from_attributes=True)

    def create_user(self, user_data: UserCreate) -> UserRead:
        """
        Create a new user.
        
        Args:
            user_data: The user data to create
            
        Returns:
            The created user
        """
        if self.user_service.get_by_username(user_data.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
        
        user = self.user_service.create_user(user_data)
        return UserRead.model_validate(user, from_attributes=True)

    def update_user(self, user_id: int, user_data: UserUpdate) -> UserRead:
        """
        Update a user.
        
        Args:
            user_id: The ID of the user to update
            user_data: The user data to update
            
        Returns:
            The updated user
        """
        user = self.user_service.update_user(user_id, user_data)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        return UserRead.model_validate(user, from_attributes=True)

    def delete_user(self, user_id: int) -> bool:
        """
        Delete a user.
        
        Args:
            user_id: The ID of the user to delete
            
        Returns:
            True if the user was deleted successfully, False otherwise
        """
        user = self.user_service.get_by_id(user_id)

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        self.user_service.delete(user_id)
        return True

