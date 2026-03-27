from app.repositories.user import UserRepository
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.models.user import User
from app.core.security import hash_password
from typing import List, Optional

class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def get_all_users(self) -> List[UserRead]:
        return self.user_repo.get_all_users()

    def get_by_username(self, username: str) -> Optional[User]:
        return self.user_repo.get_by_username(username)

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.user_repo.get_by_id(user_id)

    def create_user(self, user_data: UserCreate) -> User:
        hashed_password = hash_password(user_data.password)
        new_user = User(
            username=user_data.username,
            hashed_password=hashed_password,
            role=user_data.role
        )
        return self.user_repo.create(new_user)

    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        if user_data.username:
            user.username = user_data.username
        if user_data.password:
            user.hashed_password = hash_password(user_data.password)
        if user_data.role:
            user.role = user_data.role
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
            
        return self.user_repo.update(user)

    def delete(self, user_id: int) -> bool:
        return self.user_repo.delete(user_id)