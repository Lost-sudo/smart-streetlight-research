import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session

from app.services.user import UserService
from app.schemas.user import UserCreate, UserUpdate, UserRole
from app.models.user import User


@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)


@pytest.fixture
def user_service(mock_db):
    return UserService(mock_db)


def test_create_user_hashes_password(user_service):
    user_data = UserCreate(username="newuser", password="password123", role=UserRole.viewer)

    with patch("app.services.user.hash_password", return_value="hashed") as mock_hash, \
         patch.object(user_service.user_repo, "create") as mock_create:
        mock_create.return_value = User(username="newuser", hashed_password="hashed", role=UserRole.viewer)

        created = user_service.create_user(user_data)

        mock_hash.assert_called_once_with("password123")
        assert created.hashed_password == "hashed"


def test_update_user_password_hashes_when_provided(user_service):
    existing = User(id=1, username="u1", hashed_password="old", role=UserRole.viewer, is_active=True)
    update = UserUpdate(password="newpass")

    with patch.object(user_service, "get_by_id", return_value=existing), \
         patch("app.services.user.hash_password", return_value="newhashed") as mock_hash, \
         patch.object(user_service.user_repo, "update", return_value=existing) as mock_update:
        updated = user_service.update_user(1, update)

        mock_hash.assert_called_once_with("newpass")
        mock_update.assert_called_once()
        assert updated.hashed_password == "newhashed"


def test_delete_user_returns_false_when_missing(user_service):
    with patch.object(user_service.user_repo, "delete", return_value=None):
        assert user_service.delete(999) is None

