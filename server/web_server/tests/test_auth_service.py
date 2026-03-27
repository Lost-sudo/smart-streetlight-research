import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from jose import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.auth import AuthService
from app.schemas.user import UserCreate
from app.models.user import User, UserRole
from app.models.refresh_token import RefreshToken
from app.core.config import settings

@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.fixture
def auth_service(mock_db):
    return AuthService(mock_db)

@pytest.fixture
def sample_user():
    user = User(
        id=1,
        username="testuser",
        hashed_password="hashed_password",
        role=UserRole.viewer,
        is_active=True
    )
    return user

def test_create_user_success(auth_service, mock_db):
    """
    Test successful user creation.
    """
    user_data = UserCreate(username="newuser", password="password123")
    
    with patch("app.services.auth.AuthService._AuthService__get_user", return_value=None), \
         patch("app.services.auth.AuthService._AuthService__hash_password", return_value="hashed_pass"), \
         patch.object(auth_service.user_repo, "create") as mock_create:
        
        mock_create.return_value = User(username="newuser", hashed_password="hashed_pass")
        
        result = auth_service.create_user(user_data)
        
        assert result.username == "newuser"
        assert result.hashed_password == "hashed_pass"
        mock_create.assert_called_once()

def test_create_user_already_exists(auth_service):
    """
    Test that create_user raises HTTPException if username exists.
    """
    user_data = UserCreate(username="existinguser", password="password123")
    
    with patch("app.services.auth.AuthService._AuthService__get_user", return_value=True):
        with pytest.raises(HTTPException) as exc:
            auth_service.create_user(user_data)
        
        assert exc.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Username already exists" in exc.value.detail

def test_authenticate_user_success(auth_service, sample_user):
    """
    Test successful authentication.
    """
    with patch.object(auth_service.user_repo, "get_by_username", return_value=sample_user), \
         patch("app.services.auth.AuthService._AuthService__verify_password", return_value=True):
        
        result = auth_service.authenticate_user("testuser", "password123")
        assert result == sample_user

def test_authenticate_user_invalid(auth_service, sample_user):
    """
    Test authentication with invalid credentials.
    """
    # Case 1: User not found
    with patch.object(auth_service.user_repo, "get_by_username", return_value=None):
        with pytest.raises(HTTPException) as exc:
            auth_service.authenticate_user("wronguser", "pass")
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    # Case 2: Wrong password
    with patch.object(auth_service.user_repo, "get_by_username", return_value=sample_user), \
         patch("app.services.auth.AuthService._AuthService__verify_password", return_value=False):
        with pytest.raises(HTTPException) as exc:
            auth_service.authenticate_user("testuser", "wrongpass")
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_access_token(auth_service, sample_user):
    """
    Test generation of access token.
    """
    refresh_token_id = 123
    token = auth_service.create_access_token(sample_user, refresh_token_id)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert payload["sub"] == sample_user.username
    assert payload["user_id"] == sample_user.id
    assert payload["session_id"] == refresh_token_id
    assert payload["type"] == "access_token"

def test_create_refresh_token(auth_service, sample_user):
    """
    Test generation of refresh token.
    """
    token, expires_at = auth_service.create_refresh_token(sample_user)
    
    payload = jwt.decode(token, settings.REFRESH_SECRET_KEY, algorithms=[settings.REFRESH_ALGORITHM])
    
    assert payload["sub"] == sample_user.username
    assert payload["user_id"] == sample_user.id
    assert payload["type"] == "refresh_token"
    assert isinstance(expires_at, datetime)

def test_logout_success(auth_service, sample_user):
    """
    Test successful logout (revoking token).
    """
    refresh_token = "valid_refresh_token"
    mock_db_token = MagicMock(spec=RefreshToken)
    mock_db_token.token = "hashed_token"
    
    payload = {"user_id": sample_user.id, "type": "refresh_token"}
    
    with patch("jose.jwt.decode", return_value=payload), \
         patch.object(auth_service.refresh_repo, "get_all_active_by_user", return_value=[mock_db_token]), \
         patch("app.services.auth.AuthService._AuthService__verify_token", return_value=True), \
         patch.object(auth_service.refresh_repo, "revoke") as mock_revoke:
        
        auth_service.logout(refresh_token)
        mock_revoke.assert_called_once_with(mock_db_token.token)

def test_get_current_user_success(auth_service, sample_user):
    """
    Test getting current user from a valid token.
    """
    access_token = "valid_access_token"
    session_id = 456
    payload = {
        "user_id": sample_user.id,
        "session_id": session_id,
        "type": "access_token"
    }
    
    mock_session = MagicMock(spec=RefreshToken)
    mock_session.is_revoked = False
    mock_session.expires_at = datetime.utcnow() + timedelta(hours=1)
    
    with patch("jose.jwt.decode", return_value=payload), \
         patch.object(auth_service.refresh_repo, "get_by_id", return_value=mock_session), \
         patch.object(auth_service.user_repo, "get_by_id", return_value=sample_user):
        
        user = auth_service.get_current_user(access_token)
        assert user == sample_user
