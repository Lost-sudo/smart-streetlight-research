from app.repositories.user import UserRepository
from sqlalchemy.orm import Session
from app.schemas.user import UserRead
from typing import List

class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def get_all_users(self) -> List[UserRead]:
        return self.user_repo.get_all_users()

    def get_by_username(self, username: str) -> UserRead:
        return self.user_repo.get_by_username(username)

    def get_by_id(self, user_id: int) -> UserRead:
        return self.user_repo.get_by_id(user_id)

    def delete(self, user_id: int) -> UserRead:
        return self.user_repo.delete(user_id)