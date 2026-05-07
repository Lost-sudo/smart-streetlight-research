import type { Alert } from "@/lib/redux/api/alertApi";
import type { RepairTask } from "@/lib/redux/api/repairTaskApi";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

export interface MaintenanceTask {
  id: string;
  node: string;
  faultType: string;
  priority: "High" | "Medium" | "Low";
  dateDetected: string;
  suggestedAction: string;
  explanation: string;
  status: "Pending" | "Assigned" | "In Progress" | "Resolved";
  assignedTo?: string;
}

export function mapRepairTaskToMaintenanceTask({
  task,
  alertById,
  streetlightById,
}: {
  task: RepairTask;
  alertById: Map<number, Alert>;
  streetlightById: Map<number, Streetlight>;
}): MaintenanceTask {
  const alert = task.alert_id ? alertById.get(task.alert_id) : undefined;
  const sl = alert?.streetlight_id ? streetlightById.get(alert.streetlight_id) : undefined;

  const priorityStr = alert?.severity === "critical" ? "High" : alert?.severity === "high" ? "Medium" : "Low";
  return {
    id: String(task.id),
    node: sl?.name || "Unknown Node",
    faultType: alert?.type?.replace(/_/g, " ") || "Anomaly Alert",
    priority: priorityStr,
    dateDetected: alert?.created_at ? new Date(alert.created_at).toLocaleDateString() : "Unknown Date",
    suggestedAction: alert?.message || "Verify Node State manually.",
    explanation: task.description || "System flagged an anomaly requiring service.",
    status:
      task.status === "pending"
        ? "Pending"
        : task.status === "assigned"
        ? "Assigned"
        : task.status === "in_progress"
        ? "In Progress"
        : "Resolved",
    assignedTo: task.technician_id ? `Tech #${task.technician_id}` : undefined,
  };
}

