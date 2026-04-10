"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetPredictiveMaintenanceLogsQuery, type PredictiveMaintenanceLog } from "@/lib/redux/api/predictiveMaintenanceApi";
import { useGetPredictiveAlertsQuery, useCreateAlertMutation, type Alert } from "@/lib/redux/api/alertApi";
import {
  useAssignTaskMutation,
  useGetAvailableTechniciansQuery,
  useGetTasksBySourceTypeQuery,
  useScheduleTaskMutation,
  type RepairTask,
} from "@/lib/redux/api/repairTaskApi";

import { NotificationBanner } from "@/components/predictive-maintenance/parts/notification-banner";
import { PageHeader } from "@/components/predictive-maintenance/parts/page-header";
import { SummaryCards } from "@/components/predictive-maintenance/parts/summary-cards";
import { PredictionsTable, type PredictionRow } from "@/components/predictive-maintenance/parts/predictions-table";
import { ScheduledTasksTable, type ScheduledTaskRow } from "@/components/predictive-maintenance/parts/scheduled-tasks-table";
import { indexAlertsById, indexStreetlightsById } from "@/components/predictive-maintenance/utils";

export function PredictiveMaintenancePage() {
  const { data: streetlights = [], isLoading: slLoading } = useGetStreetlightsQuery(undefined, { pollingInterval: 15000 });
  const { data: pmLogs = [], isLoading: pmLoading } = useGetPredictiveMaintenanceLogsQuery(undefined, { pollingInterval: 15000 });
  const { data: predictiveAlerts = [] } = useGetPredictiveAlertsQuery(undefined, { pollingInterval: 15000 });
  const { data: predictiveTasks = [] } = useGetTasksBySourceTypeQuery("PREDICTIVE", { pollingInterval: 15000 });
  const { data: availableTechnicians = [] } = useGetAvailableTechniciansQuery(undefined, { pollingInterval: 30000 });

  const [createAlert] = useCreateAlertMutation();
  const [scheduleTask] = useScheduleTaskMutation();
  const [assignMutate] = useAssignTaskMutation();

  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const streetlightById = useMemo(() => indexStreetlightsById(streetlights as Streetlight[]), [streetlights]);
  const predictiveAlertById = useMemo(() => indexAlertsById(predictiveAlerts as Alert[]), [predictiveAlerts]);

  const mergedNodes: PredictionRow[] = useMemo(() => {
    return (pmLogs as PredictiveMaintenanceLog[])
      .map((pm) => {
        const sl = streetlightById.get(pm.streetlight_id);
        return {
          ...pm,
          nodeName: sl?.name || `Node #${pm.streetlight_id}`,
          deviceId: sl?.device_id || "N/A",
        };
      })
      .sort((a, b) => b.failure_probability - a.failure_probability);
  }, [pmLogs, streetlightById]);

  const criticalCount = useMemo(() => mergedNodes.filter((n) => n.urgency_level === "high").length, [mergedNodes]);
  const warningCount = useMemo(() => mergedNodes.filter((n) => n.urgency_level === "medium").length, [mergedNodes]);
  const scheduledCount = useMemo(
    () => (predictiveTasks as RepairTask[]).filter((t) => t.status !== "completed").length,
    [predictiveTasks]
  );

  // Check if a node already has an active predictive task
  const hasActiveTask = (streetlightId: number) => {
    const nodeAlertIds = (predictiveAlerts as Alert[])
      .filter((a) => a.streetlight_id === streetlightId && !a.is_resolved)
      .map((a) => a.id);

    return (predictiveTasks as RepairTask[]).some((t) => t.status !== "completed" && nodeAlertIds.includes(t.alert_id));
  };

  const handleScheduleMaintenance = async (
    pm: PredictionRow,
    args: { scheduledAt?: string; description?: string }
  ) => {
    try {
      // Check if a predictive alert already exists for this node
      const existingAlert = (predictiveAlerts as Alert[]).find(
        (a) => a.streetlight_id === pm.streetlight_id && !a.is_resolved
      );

      let alertId: number;

      if (existingAlert) {
        alertId = existingAlert.id;
      } else {
        const newAlert = await createAlert({
          streetlight_id: pm.streetlight_id,
          alert_type: "PREDICTIVE",
          type: "predicted_failure",
          severity: pm.urgency_level === "high" ? "high" : "medium",
          message: `LSTM predicts ${(pm.failure_probability * 100).toFixed(0)}% failure probability. Estimated failure: ${new Date(pm.predicted_failure_date).toLocaleDateString()}.`,
          is_resolved: false,
          created_at: new Date().toISOString(),
        }).unwrap();
        alertId = newAlert.id;
      }

      const priority = pm.urgency_level === "high" ? "high" : "medium";
      await scheduleTask({
        alert_id: alertId,
        description:
          args.description ||
          `Scheduled preventive maintenance for ${pm.nodeName}. Predicted failure probability: ${(pm.failure_probability * 100).toFixed(0)}%.`,
        priority,
        scheduled_at: args.scheduledAt || undefined,
      }).unwrap();

      showNotification(`Maintenance scheduled for ${pm.nodeName}`, "success");
    } catch (e) {
      const err = e as { data?: { detail?: string } };
      showNotification(err?.data?.detail || "Failed to schedule maintenance.", "info");
    }
  };

  const handleAssign = async (taskId: number, technicianId: number) => {
    try {
      await assignMutate({ taskId, technicianId }).unwrap();
      showNotification("Technician assigned successfully!", "info");
    } catch {
      showNotification("Failed to assign technician.", "info");
    }
  };

  const scheduledTaskRows: ScheduledTaskRow[] = useMemo(() => {
    return (predictiveTasks as RepairTask[]).map((task) => {
      const alert = predictiveAlertById.get(task.alert_id);
      const sl = alert?.streetlight_id ? streetlightById.get(alert.streetlight_id) : undefined;
      return { ...task, nodeName: sl?.name || "Unknown Node" };
    });
  }, [predictiveTasks, predictiveAlertById, streetlightById]);

  if (slLoading || pmLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading predictive insights...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative">
      <NotificationBanner notification={notification} />
      <PageHeader />

      <SummaryCards criticalCount={criticalCount} warningCount={warningCount} scheduledCount={scheduledCount} />

      <PredictionsTable rows={mergedNodes} hasActiveTask={hasActiveTask} onScheduleMaintenance={handleScheduleMaintenance} />

      <ScheduledTasksTable tasks={scheduledTaskRows} availableTechnicians={availableTechnicians} onAssign={handleAssign} />
    </div>
  );
}

