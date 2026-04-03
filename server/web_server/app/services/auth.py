from app.schemas.auth import TokenServiceResponse
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User

from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.schemas.user import UserCreate, UserRead

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.refresh_repo = RefreshTokenRepository(db)

    def __hash_password(self, password: str):
        """
        Hash a password.
        
        Args:
            password: The password to hash
            
        Returns:
            The hashed password
        """
        return hash_password(password)

    def __verify_password(self, plain_password: str, hashed_password: str):
        """
        Verify a password.
        
        Args:
            plain_password: The plain password to verify
            hashed_password: The hashed password to verify against
            
        Returns:
            True if the password is correct, False otherwise
        """
        return verify_password(plain_password, hashed_password)

    def __hash_token(self, token: str):
        """
        Hash a token.
        
        Args:
            token: The token to hash
            
        Returns:
            The hashed token
        """
        return hash_password(token)

    def __verify_token(self, plain_token: str, hashed_token: str):
        """
        Verify a token.
        
        Args:
            plain_token: The plain token to verify
            hashed_token: The hashed token to verify against
            
        Returns:
            True if the token is correct, False otherwise
        """
        return verify_password(plain_token, hashed_token)



    def __get_user(self, username: str):
        """
        Get a user by username.
        
        Args:
            username: The username of the user to retrieve
            
        Returns:
            The user with the given username
        """
        return self.user_repo.get_by_username(username)

    def create_access_token(self, user: User, refresh_token_id: int):
        """
        Create an access token.
        
        Args:
            user: The user to create an access token for
            refresh_token_id: The ID of the refresh token
            
        Returns:
            The access token
        """
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

        payload = {
            "sub": user.username,
            "user_id": user.id,
            "role": user.role,
            "type": "access_token",
            "session_id": refresh_token_id,
            "exp": expire
        }

        return jwt.encode (
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

    def create_refresh_token(self, user: User):
        """
        Create a refresh token.
        
        Args:
            user: The user to create a refresh token for
            
        Returns:
            The refresh token and its expiration time
        """
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
        """
        Save a refresh token.
        
        Args:
            token: The refresh token to save
            user_id: The ID of the user
            expires_at: The expiration time of the refresh token
            
        Returns:
            The saved refresh token
        """
        hashed_token = self.__hash_token(token)

        return self.refresh_repo.create(
            user_id=user_id,
            token=hashed_token,
            expires_at=expires_at
        )

    
    def refresh_access_token(self, refresh_token: str) -> TokenServiceResponse:
        """
        Refresh an access token.
        
        Args:
            refresh_token: The refresh token to use
            
        Returns:
            The new access token and refresh token
            
        Raises:
            HTTPException: If the refresh token is invalid or expired
        """
        try:
            payload = jwt.decode(
                refresh_token,
                settings.REFRESH_SECRET_KEY,
                algorithms=[settings.REFRESH_ALGORITHM]
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

        if matched_token.expires_at < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is expired")

        self.refresh_repo.revoke(matched_token.token)

        user = matched_token.user

        new_refresh_token, expires_at = self.create_refresh_token(user)
        db_refresh_token = self.save_refresh_token(new_refresh_token, user.id, expires_at=expires_at)
        new_access_token = self.create_access_token(user, db_refresh_token.id)

        return TokenServiceResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )


    def create_user(self, user: UserCreate) -> User:
        """
        Create a new user.
        
        Args:
            user: The user data to create
            
        Returns:
            The created user
            
        Raises:
            HTTPException: If the username already exists
        """
        if self.__get_user(user.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
        hashed_password = self.__hash_password(user.password)

        new_user = User(
            username=user.username,
            hashed_password=hashed_password,
        )

        return self.user_repo.create(user=new_user)
        
    def authenticate_user(self, username: str, password: str) -> User:
        """
        Authenticate a user.
        
        Args:
            username: The username of the user to authenticate
            password: The password of the user to authenticate
            
        Returns:
            The authenticated user
            
        Raises:
            HTTPException: If the username or password is incorrect
        """
        user = self.user_repo.get_by_username(username)

        if not user or not self.__verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

        return user

    def logout(self, refresh_token: str):
        """
        Logout a user.
        
        Args:
            refresh_token: The refresh token to use
            
        Raises:
            HTTPException: If the refresh token is invalid or expired
        """
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
        """
        Get the current user.
        
        Args:
            token: The access token to use
            
        Returns:
            The current user
            
        Raises:
            HTTPException: If the token is invalid or expired
        """
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
            token_type: str = payload.get("type")

            if user_id is None or token_type != "access_token":
                raise credentials_exception

        except JWTError:
            raise credentials_exception

        user = self.user_repo.get_by_id(user_id)

        if user is None:
            raise credentials_exception

        return user