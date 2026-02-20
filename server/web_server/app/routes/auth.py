from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserRead
from app.schemas.auth import TokenResponse
from app.controllers.auth import AuthController
from app.controllers.refresh_token import RefreshTokenController

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register", response_model=UserRead)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return AuthController(db).register(user)

@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return AuthController(db).login(response, form_data.username, form_data.password)

@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    return RefreshTokenController(db).refresh(request, response)

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    return AuthController(db).logout(request, response)

@router.get("/me", response_model=UserRead)
def read_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return AuthController(db).get_current_user(token)
