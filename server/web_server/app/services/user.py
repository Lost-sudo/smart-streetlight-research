from app.schemas.auth import TokenServiceResponse
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.schemas.user import UserCreate, UserRead

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.refresh_repo = RefreshTokenRepository(db)

    def __hash_password(self, password: str):
        return pwd_context.hash(password)

    def __verify_password(self, plain_password: str, hashed_password: str):
        return pwd_context.verify(plain_password, hashed_password)

    def __hash_token(self, token: str):
        return pwd_context.hash(token)

    def __verify_token(self, plain_token: str, hashed_token: str):
        return pwd_context.verify(plain_token, hashed_token)

    def __get_user(self, username: str):
        return self.user_repo.get_by_username(username)

    def create_access_token(self, user: User):
        expire = datetime.now() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

        payload = {
            "sub": user.username,
            "user_id": user.id,
            "role": user.role,
            "type": "access_token",
            "exp": expire
        }

        return jwt.encode (
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

    def create_refresh_token(self, user: User):
        expires_at = datetime.utcnow() + timedelta(
            minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )

        payload = {
            "sub": user.username,
            "user_id": user.id,
            "role": user.role,
            "type": "refresh_token",
            "exp": expires_at
        }

        encoded_jwt = jwt.encode(
            payload,
            settings.REFRESH_SECRET_KEY,
            algorithm=settings.REFRESH_ALGORITHM
        )

        return encoded_jwt, expires_at
        

    def save_refresh_token(self, token: str, user_id: int, expires_at: datetime):
        hashed_token = self.__hash_token(token)

        self.refresh_repo.create(
            user_id=user_id,
            token=hashed_token,
            expires_at=expires_at
        )

    
    def refresh_access_token(self, refresh_token: str) -> TokenServiceResponse:
        try:
            payload = jwt.decode(
                refresh_token,
                settings.REFRESH_SECRET_KEY,
                algorithms=settings.REFRESH_ALGORITHM
            )
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        if payload.get("type") != "refresh_token":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        user_id = payload.get("user_id")

        db_tokens = self.refresh_repo.get_all_active_by_user(user_id=user_id)

        matched_token = None

        for db_token in db_tokens:
            if self.__verify_token(refresh_token, db_token.token):
                matched_token = db_token
                break

        if not matched_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not recognized")

        if matched_token.expires_at < datetime.now():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is expired")

        self.refresh_repo.revoke(matched_token.token)

        user = matched_token.user

        new_access_token = self.create_access_token(user)
        new_refresh_token, expires_at = self.create_refresh_token(user)

        self.save_refresh_token(new_refresh_token, user.id, expires_at=expires_at)

        return TokenServiceResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )

    def create_user(self, user: UserCreate) -> User:
        if self.__get_user(user.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
        hashed_password = self.__hash_password(user.password)

        new_user = User(
            username=user.username,
            hashed_password=hashed_password,
        )

        return self.user_repo.create(user=new_user)
        
    def authenticate_user(self, username: str, password: str) -> User:
        user = self.user_repo.get_by_username(username)

        if not user or not self.__verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

        return user

    def logout(self, refresh_token: str):
        try:
            payload = jwt.decode(refresh_token, settings.REFRESH_SECRET_KEY, algorithms=[settings.REFRESH_ALGORITHM])
        except:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        user_id = payload.get("user_id")

        db_tokens = self.refresh_repo.get_all_active_by_user(user_id)

        for db_token in db_tokens:
            if self.__verify_token(refresh_token, db_token.token):
                self.refresh_repo.revoke(db_token.token)
                return

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not recognized")

    def get_current_user(self, token: str):

        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )

            user_id: int = payload.get("user_id")

            if user_id is None:
                raise credentials_exception

        except JWTError:
            raise credentials_exception

        user = self.user_repo.get_by_id(user_id)

        if user is None:
            raise credentials_exception

        return user