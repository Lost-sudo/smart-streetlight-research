import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.streetlight import StreetlightService
from app.schemas.streetlight import StreetlightCreate, StreetlightUpdate, StreetlightRead
from app.models.streetlight import Streetlight

@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.fixture
def streetlight_service(mock_db):
    return StreetlightService(mock_db)

@pytest.fixture
def sample_streetlight_create():
    return StreetlightCreate(
        name="Main St 1",
        latitude=14.5995,
        longitude=120.9842,
        model_info="LED-V1",
        installation_date=datetime.utcnow(),
        status="active",
        is_on=True
    )

@pytest.fixture
def sample_streetlight_model():
    return Streetlight(
        id=1,
        name="Main St 1",
        latitude=14.5995,
        longitude=120.9842,
        model_info="LED-V1",
        installation_date=datetime.utcnow(),
        status="active",
        is_on=True
    )

def test_create_streetlight_success(streetlight_service, sample_streetlight_create, sample_streetlight_model):
    """
    Test successful creation of a streetlight.
    """
    with patch.object(streetlight_service.streetlight_repo, "get_by_name", return_value=None), \
         patch.object(streetlight_service.streetlight_repo, "create", return_value=sample_streetlight_model) as mock_create:
        
        result = streetlight_service.create_streetlight(sample_streetlight_create)
        
        assert result.name == sample_streetlight_create.name
        assert result.id == 1
        mock_create.assert_called_once()

def test_create_streetlight_conflict(streetlight_service, sample_streetlight_create, sample_streetlight_model):
    """
    Test creation of a streetlight when the name already exists.
    """
    with patch.object(streetlight_service.streetlight_repo, "get_by_name", return_value=sample_streetlight_model):
        with pytest.raises(HTTPException) as exc:
            streetlight_service.create_streetlight(sample_streetlight_create)
        
        assert exc.value.status_code == status.HTTP_409_CONFLICT
        assert "name already exists" in exc.value.detail.lower()

def test_get_streetlight_by_id_success(streetlight_service, sample_streetlight_model):
    """
    Test successful retrieval of a streetlight by ID.
    """
    with patch.object(streetlight_service.streetlight_repo, "get_by_id", return_value=sample_streetlight_model):
        result = streetlight_service.get_streetlight_by_id(1)
        assert result == sample_streetlight_model

def test_get_all_streetlight(streetlight_service, sample_streetlight_model):
    """
    Test retrieval of all streetlights.
    """
    with patch.object(streetlight_service.streetlight_repo, "get_all", return_value=[sample_streetlight_model]):
        result = streetlight_service.get_all_streetlight()
        assert len(result) == 1
        assert result[0] == sample_streetlight_model

def test_update_streetlight_success(streetlight_service, sample_streetlight_model):
    """
    Test successful update of a streetlight.
    """
    update_data = StreetlightUpdate(status="maintenance")
    updated_model = sample_streetlight_model
    updated_model.status = "maintenance"
    
    with patch.object(streetlight_service, "get_streetlight_by_id", return_value=sample_streetlight_model), \
         patch.object(streetlight_service.streetlight_repo, "update", return_value=updated_model):
        
        result = streetlight_service.update_streetlight(1, update_data)
        assert result.status == "maintenance"

def test_update_streetlight_not_found(streetlight_service):
    """
    Test update of a non-existent streetlight.
    """
    update_data = StreetlightUpdate(status="maintenance")
    with patch.object(streetlight_service, "get_streetlight_by_id", return_value=None):
        with pytest.raises(HTTPException) as exc:
            streetlight_service.update_streetlight(999, update_data)
        assert exc.value.status_code == status.HTTP_404_NOT_FOUND

def test_delete_streetlight_success(streetlight_service, sample_streetlight_model):
    """
    Test successful deletion of a streetlight.
    """
    with patch.object(streetlight_service, "get_streetlight_by_id", return_value=sample_streetlight_model), \
         patch.object(streetlight_service.streetlight_repo, "delete") as mock_delete:
        
        result = streetlight_service.delete_streetlight(1)
        assert result is True
        mock_delete.assert_called_once_with(streetlight_id=1)

def test_delete_streetlight_not_found(streetlight_service):
    """
    Test deletion of a non-existent streetlight.
    """
    with patch.object(streetlight_service, "get_streetlight_by_id", return_value=None):
        with pytest.raises(HTTPException) as exc:
            streetlight_service.delete_streetlight(999)
        assert exc.value.status_code == status.HTTP_404_NOT_FOUND
