import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.alert import AlertService
from app.schemas.streetlight import AlertCreate, AlertUpdate
from app.models.streetlight import Alert

@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.fixture
def alert_service(mock_db):
    return AlertService(mock_db)

@pytest.fixture
def sample_alert():
    return Alert(
        id=1,
        streetlight_id=10,
        type="anomaly",
        severity="high",
        message="Test alert message",
        is_resolved=False,
        created_at=datetime.utcnow()
    )


def test_create_alert_success(alert_service, sample_alert):
    alert_data = AlertCreate(
        streetlight_id=10,
        type="anomaly",
        severity="high",
        message="Test alert message",
        is_resolved=False,
        created_at=sample_alert.created_at
    )
    
    with patch.object(alert_service.alert_repo, 'create', return_value=sample_alert) as mock_create:
        result = alert_service.create_alert(alert_data)
        
        assert result.id == 1
        assert result.streetlight_id == 10
        assert result.severity == "high"
        mock_create.assert_called_once_with(alert_data)


def test_get_alert_by_id_success(alert_service, sample_alert):
    with patch.object(alert_service.alert_repo, 'get_by_id', return_value=sample_alert) as mock_get:
        result = alert_service.get_alert_by_id(1)
        
        assert result == sample_alert
        mock_get.assert_called_once_with(1)


def test_get_all_alerts(alert_service, sample_alert):
    with patch.object(alert_service.alert_repo, 'get_all', return_value=[sample_alert]) as mock_get_all:
        result = alert_service.get_all_alerts()
        
        assert len(result) == 1
        assert result[0] == sample_alert
        mock_get_all.assert_called_once()


def test_update_alert_success(alert_service, sample_alert):
    update_data = AlertUpdate(is_resolved=True)
    
    # Create the updated version to be returned
    updated_alert = Alert(
        id=sample_alert.id,
        streetlight_id=sample_alert.streetlight_id,
        type=sample_alert.type,
        severity=sample_alert.severity,
        message=sample_alert.message,
        is_resolved=True,
        created_at=sample_alert.created_at
    )
    
    with patch.object(alert_service.alert_repo, 'update', return_value=updated_alert) as mock_update:
        result = alert_service.update_alert(1, update_data)
        
        assert result.is_resolved is True
        mock_update.assert_called_once_with(1, update_data)


def test_delete_alert_success(alert_service):
    with patch.object(alert_service.alert_repo, 'delete', return_value={"message": "Alert deleted successfully"}) as mock_delete:
        result = alert_service.delete_alert(1)
        
        assert result == {"message": "Alert deleted successfully"}
        mock_delete.assert_called_once_with(1)

