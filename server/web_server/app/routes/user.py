from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.controllers.user import UserController
from app.schemas.user import UserRead, UserCreate, UserUpdate
from app.dependencies.rbac import require_roles
from app.models.user import UserRole
from typing import List

router = APIRouter(
    prefix="/user",
    tags=["User"]
)

@router.get("/", dependencies=[Depends(require_roles([UserRole.admin]))], response_model=List[UserRead])
def get_all_users(db: Session = Depends(get_db)):
    return UserController(db).get_all_users()

@router.post("/", dependencies=[Depends(require_roles([UserRole.admin]))], response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return UserController(db).create_user(user_data=user)

@router.get("/{user_id}", dependencies=[Depends(require_roles([UserRole.admin]))], response_model=UserRead)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    return UserController(db).get_user_by_id(user_id=user_id)

@router.put("/{user_id}", dependencies=[Depends(require_roles([UserRole.admin]))], response_model=UserRead)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    return UserController(db).update_user(user_id=user_id, user_data=user)

@router.get("/username/{username}", dependencies=[Depends(require_roles([UserRole.admin]))], response_model=UserRead)
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    return UserController(db).get_user_by_username(username=username)

@router.delete("/{user_id}", dependencies=[Depends(require_roles([UserRole.admin]))])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return UserController(db).delete_user(user_id=user_id)
