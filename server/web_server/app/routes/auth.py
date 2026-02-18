from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.controllers.auth import AuthController

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register", response_model=UserRead)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return AuthController(db).register(user)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return AuthController(db).login(form_data.username, form_data.password)

@router.get("/me", response_model=UserRead)
def read_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return AuthController(db).get_current_user(token)
