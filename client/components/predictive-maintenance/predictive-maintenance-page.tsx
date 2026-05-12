"use client";

import { useMemo, useState, useEffect } from "react";
import { Loader2, BrainCircuit, Activity, Wrench, History, LayoutDashboard } from "lucide-react";

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
import { PredictionsTable, type PredictionRow } from "@/components/predictive-maintenance/parts/predictions-table";
import { ScheduledTasksTable, type ScheduledTaskRow } from "@/components/predictive-maintenance/parts/scheduled-tasks-table";
import { ActivePredictiveAlerts } from "@/components/predictive-maintenance/parts/active-predictive-alerts";
import { MaintenanceLogsTable, type EnhancedMaintenanceLog } from "@/components/predictive-maintenance/parts/maintenance-logs-table";
import { indexStreetlightsById } from "@/components/predictive-maintenance/utils";
import { PredictiveAnalyticsPage } from "@/components/analytics/predictive-analytics/predictive-analytics-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/analytics/predictive-analytics/parts/summary-cards";
import { isOfflineFromLastUpdated } from "@/components/analytics/predictive-analytics/utils";

export function PredictiveMaintenancePage() {
  const { data: streetlights = [], isLoading: slLoading } = useGetStreetlightsQuery(undefined, { pollingInterval: 15000 });
  const { data: pmLogs = [], isLoading: pmLoading } = useGetPredictiveMaintenanceLogsQuery(undefined, { pollingInterval: 1800000 });
  const { data: predictiveTasks = [] } = useGetActiveTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: availableTechnicians = [] } = useGetAvailableTechniciansQuery(undefined, { pollingInterval: 30000 });
  const { data: maintenanceLogs = [] } = useGetAllMaintenanceLogsQuery(undefined, { pollingInterval: 30000 });

  const [scheduleTask] = useCreateTaskMutation();
  const [assignMutate] = useAssignTechnicianMutation();
  const [analyzeAllLogs] = useAnalyzeAllLogsMutation();

  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    // Initially run predictive analysis
    analyzeAllLogs().catch(console.error);

    // Run every 30 minutes (30 * 60 * 1000 ms)
    const interval = setInterval(() => {
      analyzeAllLogs().catch(console.error);
      setNowTick(Date.now());
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

  const { onlineCount, normalCount, warningCount, criticalCount } = useMemo(() => {
    let offline = 0;
    let warning = 0;
    let critical = 0;

    for (const l of (streetlights as Streetlight[])) {
      const pm = (pmLogs as PredictiveMaintenanceLog[]).find((p) => p.streetlight_id === l.id);
      const isOffline = isOfflineFromLastUpdated(pm?.last_updated, nowTick);
      if (isOffline) {
        offline++;
        continue;
      }
      if (pm?.urgency_level === "medium") warning++;
      else if (pm?.urgency_level === "critical" || pm?.urgency_level === "high") critical++;
    }

    const total = streetlights.length;
    const online = total - offline;
    const normal = total - critical - warning - offline;
    return { onlineCount: online, normalCount: normal, warningCount: warning, criticalCount: critical };
  }, [streetlights, pmLogs, nowTick]);

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
      const priority = pm.urgency_level === "critical" ? "critical" : pm.urgency_level === "high" ? "high" : "medium";
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-[80vh]">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <BrainCircuit className="h-6 w-6 text-violet-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="mt-4 text-lg font-medium text-muted-foreground animate-pulse">Initializing Neural Diagnostics...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
      <NotificationBanner notification={notification} />
      <PageHeader />

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white dark:bg-zinc-900 border shadow-sm p-1 h-12 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black transition-all gap-2 px-6">
              <LayoutDashboard className="h-4 w-4" />
              Intelligence Dashboard
            </TabsTrigger>
            <TabsTrigger value="operations" className="rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black transition-all gap-2 px-6">
              <Wrench className="h-4 w-4" />
              Maintenance Operations
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8 border-none p-0 outline-none">
          <SummaryCards
            onlineCount={onlineCount}
            normalCount={normalCount}
            warningCount={warningCount}
            criticalCount={criticalCount}
            scheduledCount={scheduledCount}
            completedTasksCount={enhancedMaintenanceLogs.length}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-8">
              <PredictiveAnalyticsPage
                embedded
                hideSummary
                maintenanceSummary={{
                  scheduledCount,
                  completedTasksCount: enhancedMaintenanceLogs.length,
                }}
              />
            </div>
            <div className="xl:col-span-4 space-y-6">
               <ActivePredictiveAlerts 
                rows={mergedNodes} 
                onScheduleMaintenance={handleScheduleMaintenance} 
                hasActiveTask={hasActiveTask} 
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-8 border-none p-0 outline-none">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-7 space-y-12">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Activity className="h-5 w-5 text-violet-500" />
                    <h3 className="text-xl font-bold">Failure Probability Index</h3>
                  </div>
                  <PredictionsTable rows={mergedNodes} />
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <History className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-xl font-bold">Historical Maintenance</h3>
                  </div>
                  <MaintenanceLogsTable logs={enhancedMaintenanceLogs} />
               </div>
            </div>
            
            <div className="xl:col-span-5 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Wrench className="h-5 w-5 text-blue-500" />
                <h3 className="text-xl font-bold">Active Repair Queue</h3>
              </div>
              <ScheduledTasksTable 
                tasks={scheduledTaskRows} 
                availableTechnicians={availableTechnicians} 
                onAssign={handleAssign} 
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
