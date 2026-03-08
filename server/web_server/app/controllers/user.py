from sqlalchemy.orm import Session
from app.services.user import UserService
from app.schemas.user import UserCreate, UserRead, UserUpdate
from fastapi import HTTPException, status

class UserController:
    def __init__(self, db: Session):
        self.user_service = UserService(db)

    def get_all_users(self) -> List[UserRead]:
        users = self.user_service.get_all_users()

        return [
            UserRead.model_validate(user, from_attributes=True)
            for user in users
        ]

    def get_user_by_username(self, username: str) -> UserRead:
        user = self.user_service.get_by_username(username)

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return UserRead.model_validate(user, from_attributes=True)

    def get_user_by_id(self, user_id: int) -> UserRead:
        user = self.user_service.get_by_id(user_id)

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return UserRead.model_validate(user, from_attributes=True)

    def delete_user(self, user_id: int) -> bool:
        user = self.user_service.get_by_id(user_id)

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        self.user_service.delete(user_id)
        return True
