"use client";

import { useMemo, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetPredictiveMaintenanceLogsQuery, useAnalyzeAllLogsMutation, type PredictiveMaintenanceLog } from "@/lib/redux/api/predictiveMaintenanceApi";
import {
  useGetAvailableTechniciansQuery,
} from "@/lib/redux/api/repairTaskApi";
import {
  useGetActiveTasksQuery,
  useCreateTaskMutation,
  useAssignTechnicianMutation,
  type MaintenanceTask,
} from "@/lib/redux/api/maintenanceTaskApi";
import { useGetAllMaintenanceLogsQuery, type MaintenanceLog } from "@/lib/redux/api/maintenanceLogApi";


import { NotificationBanner } from "@/components/predictive-maintenance/parts/notification-banner";
import { PageHeader } from "@/components/predictive-maintenance/parts/page-header";
import { SummaryCards } from "@/components/predictive-maintenance/parts/summary-cards";
import { PredictionsTable, type PredictionRow } from "@/components/predictive-maintenance/parts/predictions-table";
import { ScheduledTasksTable, type ScheduledTaskRow } from "@/components/predictive-maintenance/parts/scheduled-tasks-table";
import { ActivePredictiveAlerts } from "@/components/predictive-maintenance/parts/active-predictive-alerts";
import { MaintenanceLogsTable, type EnhancedMaintenanceLog } from "@/components/predictive-maintenance/parts/maintenance-logs-table";
import { indexStreetlightsById } from "@/components/predictive-maintenance/utils";

export function PredictiveMaintenancePage() {
  const { data: streetlights = [], isLoading: slLoading } = useGetStreetlightsQuery(undefined, { pollingInterval: 15000 });
  const { data: pmLogs = [], isLoading: pmLoading } = useGetPredictiveMaintenanceLogsQuery(undefined, { pollingInterval: 1800000 });
  const { data: predictiveTasks = [] } = useGetActiveTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: availableTechnicians = [] } = useGetAvailableTechniciansQuery(undefined, { pollingInterval: 30000 });
  const { data: maintenanceLogs = [] } = useGetAllMaintenanceLogsQuery(undefined, { pollingInterval: 30000 });

  const [scheduleTask] = useCreateTaskMutation();
  const [assignMutate] = useAssignTechnicianMutation();
  const [analyzeAllLogs] = useAnalyzeAllLogsMutation();

  useEffect(() => {
    // Initially run predictive analysis
    analyzeAllLogs().catch(console.error);

    // Run every 30 minutes (30 * 60 * 1000 ms)
    const interval = setInterval(() => {
      analyzeAllLogs().catch(console.error);
    }, 1800000);

    return () => clearInterval(interval);
  }, [analyzeAllLogs]);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const streetlightById = useMemo(() => indexStreetlightsById(streetlights as Streetlight[]), [streetlights]);

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
    () => (predictiveTasks as MaintenanceTask[]).filter((t) => t.status !== "completed").length,
    [predictiveTasks]
  );

  // Check if a node already has an active predictive task
  const hasActiveTask = (streetlightId: number) => {
    return (predictiveTasks as MaintenanceTask[]).some(
      (t) => t.status !== "completed" && t.streetlight_id === streetlightId
    );
  };

  const handleScheduleMaintenance = async (
    pm: PredictionRow,
    args: { scheduledAt?: string; description?: string }
  ) => {
    try {
      const priority = pm.urgency_level === "high" ? "high" : "medium";
      await scheduleTask({
        streetlight_id: pm.streetlight_id,
        description:
          args.description ||
          `Scheduled preventive maintenance for ${pm.nodeName}. Predicted failure probability: ${(pm.failure_probability * 100).toFixed(0)}%.`,
        priority,
        scheduled_date: args.scheduledAt || undefined,
      }).unwrap();

      showNotification(`Maintenance scheduled for ${pm.nodeName}`, "success");
    } catch (e) {
      const err = e as { data?: { detail?: string } };
      showNotification(err?.data?.detail || "Failed to schedule maintenance.", "info");
    }
  };

  const handleAssign = async (taskId: number, technicianId: number) => {
    try {
      await assignMutate({ taskId, assignment: { technician_id: technicianId } }).unwrap();
      showNotification("Technician assigned successfully!", "info");
    } catch {
      showNotification("Failed to assign technician.", "info");
    }
  };

  const scheduledTaskRows: ScheduledTaskRow[] = useMemo(() => {
    return (predictiveTasks as MaintenanceTask[]).map((task) => {
      const sl = streetlightById.get(task.streetlight_id);
      return { ...task, nodeName: sl?.name || "Unknown Node" };
    });
  }, [predictiveTasks, streetlightById]);

  const enhancedMaintenanceLogs: EnhancedMaintenanceLog[] = useMemo(() => {
    return (maintenanceLogs as MaintenanceLog[]).map((log) => {
      const sl = streetlightById.get(log.streetlight_id);
      return { ...log, nodeName: sl?.name || "Unknown Node" };
    });
  }, [maintenanceLogs, streetlightById]);

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

      <SummaryCards 
        criticalCount={criticalCount} 
        warningCount={warningCount} 
        scheduledCount={scheduledCount} 
        completedCount={enhancedMaintenanceLogs.length} 
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-7 space-y-8">
          <div className="sticky top-6">
            <ActivePredictiveAlerts rows={mergedNodes} onScheduleMaintenance={handleScheduleMaintenance} hasActiveTask={hasActiveTask} />
          </div>
          
          <MaintenanceLogsTable logs={enhancedMaintenanceLogs} />
        </div>
        
        <div className="xl:col-span-5 space-y-8">
          <PredictionsTable rows={mergedNodes.slice(0, 10)} />
          <ScheduledTasksTable tasks={scheduledTaskRows} availableTechnicians={availableTechnicians} onAssign={handleAssign} />
        </div>
      </div>
    </div>
  );
}

