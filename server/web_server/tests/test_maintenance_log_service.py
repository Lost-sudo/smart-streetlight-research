import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.maintenance_log import MaintenanceLogService
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogUpdate
from app.models.streetlight import MaintenanceLog

@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.fixture
def log_service(mock_db):
    return MaintenanceLogService(mock_db)

@pytest.fixture
def sample_log():
    return MaintenanceLog(
        id=1,
        streetlight_id=15,
        technician_id=3,
        description="Replaced faulty sensor",
        parts_replaced="Voltage Sensor v2",
        scheduled_date=datetime.utcnow(),
        completion_date=None,
        status="pending"
    )


def test_create_log_success(log_service, sample_log):
    log_data = MaintenanceLogCreate(
        streetlight_id=15,
        technician_id=3,
        description="Replaced faulty sensor",
        parts_replaced="Voltage Sensor v2",
        scheduled_date=sample_log.scheduled_date,
        status="pending"
    )
    
    with patch.object(log_service.log_repo, 'create', return_value=sample_log) as mock_create:
        result = log_service.create_log(log_data)
        
        assert result.id == 1
        assert result.streetlight_id == 15
        assert result.technician_id == 3
        mock_create.assert_called_once_with(log_data)


def test_get_log_by_id_success(log_service, sample_log):
    with patch.object(log_service.log_repo, 'get_by_id', return_value=sample_log) as mock_get:
        result = log_service.get_log_by_id(1)
        
        assert result == sample_log
        mock_get.assert_called_once_with(1)


def test_get_all_logs(log_service, sample_log):
    with patch.object(log_service.log_repo, 'get_all', return_value=[sample_log]) as mock_get_all:
        result = log_service.get_all_logs()
        
        assert len(result) == 1
        assert result[0] == sample_log
        mock_get_all.assert_called_once()


def test_update_log_success(log_service, sample_log):
    update_data = MaintenanceLogUpdate(status="completed", completion_date=datetime.utcnow())
    
    updated_log = MaintenanceLog(
        id=sample_log.id,
        streetlight_id=sample_log.streetlight_id,
        technician_id=sample_log.technician_id,
        description=sample_log.description,
        parts_replaced=sample_log.parts_replaced,
        scheduled_date=sample_log.scheduled_date,
        completion_date=update_data.completion_date,
        status="completed"
    )
    
    with patch.object(log_service.log_repo, 'update', return_value=updated_log) as mock_update:
        result = log_service.update_log(1, update_data)
        
        assert result.status == "completed"
        assert result.completion_date is not None
        mock_update.assert_called_once_with(1, update_data)


def test_delete_log_success(log_service):
    with patch.object(log_service.log_repo, 'delete', return_value={"message": "Maintenance log deleted successfully"}) as mock_delete:
        result = log_service.delete_log(1)
        
        assert result == {"message": "Maintenance log deleted successfully"}
        mock_delete.assert_called_once_with(1)

