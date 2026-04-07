import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.services.repair_task import RepairTaskService
from app.schemas.repair_task import RepairTaskCreate
from app.models.repair_task import RepairTask, RepairTaskStatus, TechnicianAvailability, AssignedByType
from app.models.user import User, UserRole


@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)


@pytest.fixture
def repair_task_service(mock_db):
    return RepairTaskService(mock_db)


@pytest.fixture
def sample_task():
    return RepairTask(
        id=1,
        alert_id=10,
        technician_id=None,
        assigned_by_user_id=None,
        assigned_by_type=None,
        status=RepairTaskStatus.pending,
        description="Repair flickering light",
        created_at=datetime.utcnow(),
        assigned_at=None,
        completed_at=None,
        version=1,
    )


@pytest.fixture
def assigned_task():
    return RepairTask(
        id=1,
        alert_id=10,
        technician_id=3,
        assigned_by_user_id=1,
        assigned_by_type=AssignedByType.admin,
        status=RepairTaskStatus.assigned,
        description="Repair flickering light",
        created_at=datetime.utcnow(),
        assigned_at=datetime.utcnow(),
        completed_at=None,
        version=2,
    )


@pytest.fixture
def in_progress_task():
    return RepairTask(
        id=1,
        alert_id=10,
        technician_id=3,
        assigned_by_user_id=3,
        assigned_by_type=AssignedByType.self_assigned,
        status=RepairTaskStatus.in_progress,
        description="Repair flickering light",
        created_at=datetime.utcnow(),
        assigned_at=datetime.utcnow(),
        completed_at=None,
        version=2,
    )


@pytest.fixture
def completed_task():
    return RepairTask(
        id=1,
        alert_id=10,
        technician_id=3,
        assigned_by_user_id=3,
        assigned_by_type=AssignedByType.self_assigned,
        status=RepairTaskStatus.completed,
        description="Repair flickering light",
        created_at=datetime.utcnow(),
        assigned_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        version=2,
    )


@pytest.fixture
def sample_technician():
    user = MagicMock(spec=User)
    user.id = 3
    user.username = "tech_john"
    user.role = UserRole.technician
    user.availability = TechnicianAvailability.available
    user.is_active = True
    return user


# ──────────────────────────────────────────────
# Create
# ──────────────────────────────────────────────

def test_create_repair_task_success(repair_task_service, sample_task):
    task_data = RepairTaskCreate(
        alert_id=10,
        description="Repair flickering light",
    )

    with patch.object(repair_task_service.repair_task_repo, "create", return_value=sample_task) as mock_create:
        result = repair_task_service.create_repair_task(task_data)

        assert result.id == 1
        assert result.alert_id == 10
        assert result.status == RepairTaskStatus.pending
        assert result.technician_id is None
        mock_create.assert_called_once_with(task_data)


# ──────────────────────────────────────────────
# Read
# ──────────────────────────────────────────────

def test_get_repair_task_by_id_success(repair_task_service, sample_task):
    with patch.object(repair_task_service.repair_task_repo, "get_by_id", return_value=sample_task) as mock_get:
        result = repair_task_service.get_repair_task_by_id(1)

        assert result == sample_task
        mock_get.assert_called_once_with(1)


def test_get_all_repair_tasks(repair_task_service, sample_task):
    with patch.object(repair_task_service.repair_task_repo, "get_all", return_value=[sample_task]) as mock_get_all:
        result = repair_task_service.get_all_repair_tasks()

        assert len(result) == 1
        assert result[0] == sample_task
        mock_get_all.assert_called_once()


def test_get_unassigned_tasks(repair_task_service, sample_task):
    with patch.object(repair_task_service.repair_task_repo, "get_unassigned", return_value=[sample_task]) as mock_get:
        result = repair_task_service.get_unassigned_tasks()

        assert len(result) == 1
        assert result[0].status == RepairTaskStatus.pending
        mock_get.assert_called_once()


def test_get_active_tasks(repair_task_service, sample_task):
    with patch.object(repair_task_service.repair_task_repo, "get_active_unresolved", return_value=[sample_task]) as mock_get:
        result = repair_task_service.get_active_tasks()

        assert len(result) == 1
        mock_get.assert_called_once()


def test_get_tasks_by_technician(repair_task_service, assigned_task):
    with patch.object(repair_task_service.repair_task_repo, "get_by_technician", return_value=[assigned_task]) as mock_get:
        result = repair_task_service.get_tasks_by_technician(3)

        assert len(result) == 1
        assert result[0].technician_id == 3
        mock_get.assert_called_once_with(3)


# ──────────────────────────────────────────────
# Assign (admin/operator)
# ──────────────────────────────────────────────

def test_assign_task_by_admin(repair_task_service, assigned_task):
    with patch.object(repair_task_service.repair_task_repo, "assign_technician", return_value=assigned_task) as mock_assign:
        result = repair_task_service.assign_task(
            task_id=1,
            technician_id=3,
            assigner_id=1,
            assigner_role="admin",
        )

        assert result.status == RepairTaskStatus.assigned
        assert result.technician_id == 3
        assert result.assigned_by_type == AssignedByType.admin
        mock_assign.assert_called_once_with(
            task_id=1,
            technician_id=3,
            assigner_id=1,
            assigned_by_type=AssignedByType.admin,
        )


def test_assign_task_by_operator(repair_task_service, assigned_task):
    assigned_task.assigned_by_type = AssignedByType.operator

    with patch.object(repair_task_service.repair_task_repo, "assign_technician", return_value=assigned_task) as mock_assign:
        result = repair_task_service.assign_task(
            task_id=1,
            technician_id=3,
            assigner_id=2,
            assigner_role="operator",
        )

        assert result.assigned_by_type == AssignedByType.operator
        mock_assign.assert_called_once_with(
            task_id=1,
            technician_id=3,
            assigner_id=2,
            assigned_by_type=AssignedByType.operator,
        )


# ──────────────────────────────────────────────
# Self-assign (technician)
# ──────────────────────────────────────────────

def test_self_assign_task(repair_task_service, assigned_task):
    assigned_task.assigned_by_type = AssignedByType.self_assigned
    assigned_task.assigned_by_user_id = 3

    with patch.object(repair_task_service.repair_task_repo, "assign_technician", return_value=assigned_task) as mock_assign:
        result = repair_task_service.self_assign_task(task_id=1, technician_id=3)

        assert result.status == RepairTaskStatus.assigned
        assert result.technician_id == 3
        assert result.assigned_by_type == AssignedByType.self_assigned
        mock_assign.assert_called_once_with(
            task_id=1,
            technician_id=3,
            assigner_id=3,
            assigned_by_type=AssignedByType.self_assigned,
        )


# ──────────────────────────────────────────────
# Status update
# ──────────────────────────────────────────────

def test_update_task_status_to_in_progress(repair_task_service, in_progress_task):
    with patch.object(repair_task_service.repair_task_repo, "update_status", return_value=in_progress_task) as mock_update:
        result = repair_task_service.update_task_status(
            task_id=1,
            new_status="in_progress",
            technician_id=3,
        )

        assert result.status == RepairTaskStatus.in_progress
        mock_update.assert_called_once_with(1, "in_progress", 3)


def test_update_task_status_to_completed(repair_task_service, completed_task):
    with patch.object(repair_task_service.repair_task_repo, "update_status", return_value=completed_task) as mock_update:
        result = repair_task_service.update_task_status(
            task_id=1,
            new_status="completed",
            technician_id=3,
        )

        assert result.status == RepairTaskStatus.completed
        assert result.completed_at is not None
        mock_update.assert_called_once_with(1, "completed", 3)


# ──────────────────────────────────────────────
# Technician availability
# ──────────────────────────────────────────────

def test_get_available_technicians(repair_task_service, sample_technician):
    with patch.object(repair_task_service.repair_task_repo, "get_available_technicians", return_value=[sample_technician]) as mock_get:
        result = repair_task_service.get_available_technicians()

        assert len(result) == 1
        assert result[0].availability == TechnicianAvailability.available
        mock_get.assert_called_once()


def test_update_technician_availability(repair_task_service, sample_technician):
    sample_technician.availability = TechnicianAvailability.offline

    with patch.object(repair_task_service.repair_task_repo, "update_technician_availability", return_value=sample_technician) as mock_update:
        result = repair_task_service.update_technician_availability(3, "offline")

        assert result.availability == TechnicianAvailability.offline
        mock_update.assert_called_once_with(3, "offline")


# ──────────────────────────────────────────────
# Delete
# ──────────────────────────────────────────────

def test_delete_repair_task_success(repair_task_service):
    with patch.object(repair_task_service.repair_task_repo, "delete", return_value={"message": "Repair task deleted successfully"}) as mock_delete:
        result = repair_task_service.delete_repair_task(1)

        assert result == {"message": "Repair task deleted successfully"}
        mock_delete.assert_called_once_with(1)
