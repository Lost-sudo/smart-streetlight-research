"""
Node Heartbeat Monitor Service
===============================
Periodically checks all active/faulty streetlight nodes for communication silence.
If a node has not sent telemetry data within the configured timeout window,
it is marked as "offline" and a communication fault repair task is created.

When the node resumes sending data, the auto-activate logic in
StreetlightLogService.add_log_from_iot() will restore it to "active".
"""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.streetlight import Streetlight, StreetlightStatus
from app.models.streetlight_log import StreetlightLog
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.repair_task import RepairTask, RepairTaskSourceType, RepairTaskStatus, RepairTaskPriority
from app.schemas.streetlight import AlertCreate, AlertUpdate, StreetlightUpdate

logger = logging.getLogger(__name__)

# --- Configuration ---
# How long a node can be silent before it's considered offline
HEARTBEAT_TIMEOUT_MINUTES = int(getattr(settings, "HEARTBEAT_TIMEOUT_MINUTES", 1))
# How often the monitor checks all nodes
CHECK_INTERVAL_SECONDS = int(getattr(settings, "HEARTBEAT_CHECK_INTERVAL_SECONDS", 60))


def _check_node_heartbeats(db: Session):
    """
    Core logic: scan all non-offline nodes and flag any that have gone silent.
    """
    now = datetime.utcnow()
    timeout_threshold = now - timedelta(minutes=HEARTBEAT_TIMEOUT_MINUTES)

    # Get all nodes that are NOT already offline/inactive
    active_nodes = (
        db.query(Streetlight)
        .filter(Streetlight.status.in_([
            StreetlightStatus.active,
            StreetlightStatus.faulty,
            StreetlightStatus.maintenance,
        ]))
        .all()
    )

    if not active_nodes:
        return

    offline_count = 0
    for node in active_nodes:
        # Find the most recent telemetry log for this node
        latest_log = (
            db.query(StreetlightLog)
            .filter(StreetlightLog.streetlight_id == node.id)
            .order_by(StreetlightLog.timestamp.desc())
            .first()
        )

        # If no logs exist, or the latest is older than the timeout → offline
        if latest_log is None or latest_log.timestamp < timeout_threshold:
            elapsed = "never" if latest_log is None else f"{(now - latest_log.timestamp).total_seconds() / 60:.0f}min ago"
            logger.warning(
                "Node %s (%s) silent since %s — marking OFFLINE.",
                node.name, node.device_id, elapsed,
            )

            # 1. Update node status to offline
            node.status = StreetlightStatus.offline
            db.add(node)

            # 2. Check if there's already an active communication fault alert
            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.streetlight_id == node.id,
                    Alert.type == "communication_fault",
                    Alert.is_resolved == False,
                )
                .first()
            )

            if not existing_alert:
                # 3. Create a communication fault alert
                db_alert = Alert(
                    streetlight_id=node.id,
                    alert_type=AlertType.FAULT,
                    type="communication_fault",
                    severity=AlertSeverity.high,
                    message=f"Communication lost — no telemetry received for {HEARTBEAT_TIMEOUT_MINUTES}+ minutes (last seen: {elapsed}).",
                    is_resolved=False,
                    created_at=now,
                )
                db.add(db_alert)
                db.flush()  # Get the alert ID

                # 4. Create a repair task for the communication fault
                db_task = RepairTask(
                    streetlight_id=node.id,
                    alert_id=db_alert.id,
                    source_type=RepairTaskSourceType.COMMUNICATION,
                    priority=RepairTaskPriority.high,
                    description=(
                        f"Communication fault: Node '{node.name}' ({node.device_id}) "
                        f"has stopped sending telemetry. Last data received {elapsed}. "
                        f"Check device connectivity, power supply, and network."
                    ),
                    status=RepairTaskStatus.pending,
                    created_at=now,
                )
                db.add(db_task)
                logger.info(
                    "Created communication fault alert + repair task for node %s.",
                    node.name,
                )

            offline_count += 1

    if offline_count > 0:
        db.commit()
        logger.info("Heartbeat check complete: %d node(s) marked offline.", offline_count)


def resolve_communication_fault(db: Session, streetlight_id: int):
    """
    Called when a node sends data again (from add_log_from_iot).
    Resolves any open communication fault alerts and removes pending repair tasks.
    """
    # Find and resolve active communication fault alerts
    active_alerts = (
        db.query(Alert)
        .filter(
            Alert.streetlight_id == streetlight_id,
            Alert.type == "communication_fault",
            Alert.is_resolved == False,
        )
        .all()
    )

    for alert in active_alerts:
        alert.is_resolved = True
        db.add(alert)

        # Remove pending repair task tied to this alert
        if alert.repair_task and alert.repair_task.status == RepairTaskStatus.pending:
            logger.info(
                "Auto-resolved communication fault for streetlight %s — removing pending repair task %s.",
                streetlight_id, alert.repair_task.id,
            )
            db.delete(alert.repair_task)
        else:
            logger.info(
                "Auto-resolved communication fault alert %s for streetlight %s.",
                alert.id, streetlight_id,
            )

    if active_alerts:
        db.commit()


async def heartbeat_monitor_loop():
    """
    Async background loop that periodically checks node heartbeats.
    Designed to be launched from FastAPI's startup event.
    """
    logger.info(
        "Heartbeat monitor started — timeout=%dmin, interval=%ds.",
        HEARTBEAT_TIMEOUT_MINUTES, CHECK_INTERVAL_SECONDS,
    )

    while True:
        try:
            db = SessionLocal()
            try:
                _check_node_heartbeats(db)
            finally:
                db.close()
        except Exception:
            logger.exception("Heartbeat monitor encountered an error.")

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)
