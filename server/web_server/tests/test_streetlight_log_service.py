import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.streetlight_log import StreetlightLogService
from app.schemas.streetlight import StreetlightLogCreate, StreetlightLogRead
from app.models.streetlight import StreetlightLog

@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.fixture
def streetlight_log_service(mock_db):
    return StreetlightLogService(mock_db)

@pytest.fixture
def sample_log_create():
    return StreetlightLogCreate(
        streetlight_id=1,
        voltage=220.5,
        current=0.45,
        power_consumption=99.2,
        light_intensity=850.0,
        timestamp=datetime.utcnow()
    )

@pytest.fixture
def sample_log_model():
    return StreetlightLog(
        id=101,
        streetlight_id=1,
        voltage=220.5,
        current=0.45,
        power_consumption=99.2,
        light_intensity=850.0,
        timestamp=datetime.utcnow()
    )

def test_create_streetlight_log_success(streetlight_log_service, sample_log_create, sample_log_model):
    """
    Test successful creation of a streetlight log.
    """
    with patch.object(streetlight_log_service.streetlight_log_repo, "create", return_value=sample_log_model) as mock_create:
        result = streetlight_log_service.create_streetlight_log(sample_log_create)
        
        assert result.streetlight_id == sample_log_create.streetlight_id
        assert result.id == 101
        mock_create.assert_called_once()

def test_get_streetlight_log_by_id_success(streetlight_log_service, sample_log_model):
    """
    Test successful retrieval of a log by ID.
    """
    with patch.object(streetlight_log_service.streetlight_log_repo, "get_by_id", return_value=sample_log_model):
        result = streetlight_log_service.get_streetlight_log_by_id(101)
        assert result.id == 101

def test_get_streetlight_log_by_id_not_found(streetlight_log_service):
    """
    Test retrieval of a non-existent log.
    """
    with patch.object(streetlight_log_service.streetlight_log_repo, "get_by_id", return_value=None):
        with pytest.raises(HTTPException) as exc:
            streetlight_log_service.get_streetlight_log_by_id(999)
        assert exc.value.status_code == status.HTTP_404_NOT_FOUND

def test_get_streetlight_logs_by_streetlight_id(streetlight_log_service, sample_log_model):
    """
    Test retrieval of logs for a specific streetlight with limit.
    """
    logs = [sample_log_model] * 5
    with patch.object(streetlight_log_service.streetlight_log_repo, "get_by_streetlight_id", return_value=logs) as mock_get:
        result = streetlight_log_service.get_streetlight_logs_by_streetlight_id(1, limit=5)
        assert len(result) == 5
        mock_get.assert_called_once_with(1, limit=5)

def test_streetlight_log_stress_simulated(streetlight_log_service, sample_log_create):
    """
    Stress test simulation: Verify the service can handle 1000 consecutive log creations
    without errors in the service logic.
    """
    iterations = 1000
    mock_log = MagicMock(spec=StreetlightLog)
    
    with patch.object(streetlight_log_service.streetlight_log_repo, "create", return_value=mock_log) as mock_create:
        for i in range(iterations):
            # Simulate logs coming in every minute
            sample_log_create.timestamp = datetime.utcnow() + timedelta(minutes=i)
            result = streetlight_log_service.create_streetlight_log(sample_log_create)
            assert result is not None
        
        assert mock_create.call_count == iterations

def test_latest_logs_retrieval_limit(streetlight_log_service):
    """
    Verify that the limit parameter is passed correctly through the service.
    """
    with patch.object(streetlight_log_service.streetlight_log_repo, "get_by_streetlight_id") as mock_get:
        streetlight_log_service.get_streetlight_logs_by_streetlight_id(1, limit=10)
        mock_get.assert_called_once_with(1, limit=10)
