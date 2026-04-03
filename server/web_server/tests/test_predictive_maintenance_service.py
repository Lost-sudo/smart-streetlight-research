import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.services.predictive_maintenance_log import PredictiveMaintenanceService
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceUpdate
from app.models.streetlight import PredictiveMaintenance

@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.fixture
def predictive_service(mock_db):
    return PredictiveMaintenanceService(mock_db)

@pytest.fixture
def sample_predictive_log():
    return PredictiveMaintenance(
        id=1,
        streetlight_id=20,
        failure_probability=0.85,
        predicted_failure_date=datetime.utcnow() + timedelta(days=5),
        urgency_level="high",
        last_updated=datetime.utcnow()
    )


def test_create_log_success(predictive_service, sample_predictive_log):
    log_data = PredictiveMaintenanceCreate(
        streetlight_id=20,
        failure_probability=0.85,
        predicted_failure_date=sample_predictive_log.predicted_failure_date,
        urgency_level="high"
    )
    
    with patch.object(predictive_service.log_repo, 'create', return_value=sample_predictive_log) as mock_create:
        result = predictive_service.create_log(log_data)
        
        assert result.id == 1
        assert result.streetlight_id == 20
        assert result.failure_probability == 0.85
        assert result.urgency_level == "high"
        mock_create.assert_called_once_with(log_data)


def test_get_log_by_id_success(predictive_service, sample_predictive_log):
    with patch.object(predictive_service.log_repo, 'get_by_id', return_value=sample_predictive_log) as mock_get:
        result = predictive_service.get_log_by_id(1)
        
        assert result == sample_predictive_log
        mock_get.assert_called_once_with(1)


def test_get_all_logs(predictive_service, sample_predictive_log):
    with patch.object(predictive_service.log_repo, 'get_all', return_value=[sample_predictive_log]) as mock_get_all:
        result = predictive_service.get_all_logs()
        
        assert len(result) == 1
        assert result[0] == sample_predictive_log
        mock_get_all.assert_called_once()


def test_update_log_success(predictive_service, sample_predictive_log):
    update_data = PredictiveMaintenanceUpdate(
        failure_probability=0.95,
        urgency_level="critical"
    )
    
    updated_log = PredictiveMaintenance(
        id=sample_predictive_log.id,
        streetlight_id=sample_predictive_log.streetlight_id,
        failure_probability=0.95,
        predicted_failure_date=sample_predictive_log.predicted_failure_date,
        urgency_level="critical",
        last_updated=datetime.utcnow()
    )
    
    with patch.object(predictive_service.log_repo, 'update', return_value=updated_log) as mock_update:
        result = predictive_service.update_log(1, update_data)
        
        assert result.failure_probability == 0.95
        assert result.urgency_level == "critical"
        mock_update.assert_called_once_with(1, update_data)


def test_delete_log_success(predictive_service):
    with patch.object(predictive_service.log_repo, 'delete', return_value={"message": "Predictive maintenance log deleted successfully"}) as mock_delete:
        result = predictive_service.delete_log(1)
        
        assert result == {"message": "Predictive maintenance log deleted successfully"}
        mock_delete.assert_called_once_with(1)

