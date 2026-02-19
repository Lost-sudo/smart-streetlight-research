from pydantic import BaseModel
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    operator = "operator"
    technician = "technician"
    viewer = "viewer"

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[UserRole] = None

class UserRead(BaseModel):
    id: int
    username: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None