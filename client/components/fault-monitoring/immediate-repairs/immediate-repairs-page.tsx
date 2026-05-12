"use client";

import { useMemo, useState } from "react";
import { Loader2, Zap, Activity, History, ClipboardList, ShieldAlert, Wrench } from "lucide-react";

import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery, type Alert } from "@/lib/redux/api/alertApi";
import {
  useAssignTaskMutation,
  useClaimTaskMutation,
  useGetActiveTasksQuery,
  useGetAllRepairTasksQuery,
  useGetAvailableTechniciansQuery,
  useGetResolvedTodayCountQuery,
  useGetUnassignedTasksQuery,
  useUpdateTaskStatusMutation,
  type RepairTask,
} from "@/lib/redux/api/repairTaskApi";

import { mapRepairTaskToMaintenanceTask, type MaintenanceTask } from "@/components/fault-monitoring/immediate-repairs/data-mappers";
import { NotificationBanner } from "@/components/fault-monitoring/immediate-repairs/parts/notification-banner";
import { PageHeader } from "@/components/fault-monitoring/immediate-repairs/parts/page-header";
import { StatsCards, TaskSectionHeader } from "@/components/fault-monitoring/immediate-repairs/parts/stats-cards";
import { TaskTable } from "@/components/fault-monitoring/immediate-repairs/parts/task-table";
import { FilterBar } from "@/components/repair-tasks/repair-tasks/parts/filter-bar";
import { TasksTable, type RepairTaskRow } from "@/components/repair-tasks/repair-tasks/parts/tasks-table";
import { indexAlertsById, indexStreetlightsById } from "@/components/repair-tasks/repair-tasks/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ImmediateRepairsPage() {
  const { data: streetlights = [], isLoading: slLoading } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });
  const { data: alerts = [], isLoading: alertsLoading } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: unassignedBase = [], isLoading: uLoading } = useGetUnassignedTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: activeBase = [], isLoading: aLoading } = useGetActiveTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: allTasks = [], isLoading: allTasksLoading } = useGetAllRepairTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: availableTechnicians = [] } = useGetAvailableTechniciansQuery(undefined, { pollingInterval: 30000 });
  const { data: resolvedToday = 0, isLoading: rtLoading } = useGetResolvedTodayCountQuery(undefined, { pollingInterval: 15000 });

  const [assignMutate] = useAssignTaskMutation();
  const [claimMutate] = useClaimTaskMutation();
  const [statusMutate] = useUpdateTaskStatusMutation();

  const [faultSearch, setFaultSearch] = useState("");
  const [allTasksSearch, setAllTasksSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const alertById = useMemo(() => indexAlertsById(alerts as Alert[]), [alerts]);
  const streetlightById = useMemo(() => indexStreetlightsById(streetlights as Streetlight[]), [streetlights]);

  const dbTasks: MaintenanceTask[] = useMemo(() => {
    const mappedUnassigned = (unassignedBase as RepairTask[]).map((t) =>
      mapRepairTaskToMaintenanceTask({ task: t, alertById, streetlightById })
    );
    const mappedActive = (activeBase as RepairTask[])
      .filter((a) => a.status !== "pending")
      .map((t) => mapRepairTaskToMaintenanceTask({ task: t, alertById, streetlightById }));
    return [...mappedUnassigned, ...mappedActive];
  }, [unassignedBase, activeBase, alertById, streetlightById]);

  const filteredTasks = useMemo(() => {
    const q = faultSearch.trim().toLowerCase();
    if (!q) return dbTasks;
    return dbTasks.filter((task) => task.node.toLowerCase().includes(q) || task.faultType.toLowerCase().includes(q));
  }, [dbTasks, faultSearch]);

  const unassignedTasks = useMemo(() => filteredTasks.filter((task) => !task.assignedTo), [filteredTasks]);
  const assignedTasks = useMemo(() => filteredTasks.filter((task) => task.assignedTo), [filteredTasks]);

  const enrichedTasks: RepairTaskRow[] = useMemo(() => {
    return (allTasks as RepairTask[]).map((task) => {
      const alert = task.alert_id ? alertById.get(task.alert_id) : undefined;
      const sl = streetlightById.get(task.streetlight_id);
      return {
        id: task.id,
        nodeName: sl?.name || "Unknown Node",
        deviceId: sl?.device_id || "N/A",
        alertMessage: alert?.message || "",
        alertType: alert?.type || (task.source_type === "PREDICTIVE" ? "Predictive maintenance scheduled" : ""),
        alertSeverity: alert?.severity || (task.source_type === "PREDICTIVE" ? "medium" : ""),
        description: task.description,
        created_at: task.created_at,
        scheduled_at: task.scheduled_at,
        technician_id: task.technician_id,
        priority: task.priority,
        status: task.status,
        source_type: task.source_type,
      };
    });
  }, [allTasks, alertById, streetlightById]);

  const filteredAllTasks = useMemo(() => {
    const q = allTasksSearch.toLowerCase();
    return enrichedTasks.filter((task) => {
      const matchesSearch =
        task.nodeName.toLowerCase().includes(q) ||
        task.alertType.toLowerCase().includes(q) ||
        (task.description || "").toLowerCase().includes(q);

      const matchesType = filterType === "ALL" || task.source_type === filterType;
      const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [enrichedTasks, allTasksSearch, filterType, filterStatus]);

  const { totalCompleted, uncompleteTasks } = useMemo(() => {
    const tasks = allTasks as RepairTask[];
    return {
      totalCompleted: tasks.filter((task) => task.status === "completed").length,
      uncompleteTasks: tasks.filter((task) => task.status !== "completed").length,
    };
  }, [allTasks]);

  const handleAssign = async (taskId: string, technicianId: number) => {
    try {
      await assignMutate({ taskId: Number(taskId), technicianId }).unwrap();
      showNotification(`Technician assigned successfully!`, "info");
    } catch {
      showNotification("Failed to assign tech.", "info");
    }
  };

  const handleClaim = async (taskId: string) => {
    try {
      await claimMutate(Number(taskId)).unwrap();
      showNotification("Task claimed successfully. It is now assigned to you.", "success");
    } catch {
      showNotification("Failed to claim task.", "info");
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await statusMutate({ taskId: Number(taskId), status }).unwrap();
      const action = status === "in_progress" ? "started" : "completed";
      showNotification(`Repair ${action} successfully!`, "success");
    } catch (e) {
      console.error(e);
      showNotification(`Failed to move to ${status}.`, "info");
    }
  };

  const renderTaskTable = (taskList: MaintenanceTask[]) => (
    <TaskTable
      tasks={taskList}
      availableTechnicians={availableTechnicians}
      onAssign={handleAssign}
      onClaim={handleClaim}
      onUpdateStatus={handleUpdateStatus}
    />
  );

  const isLoading = slLoading || alertsLoading || uLoading || aLoading || rtLoading || allTasksLoading;
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-[80vh]">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <ShieldAlert className="h-6 w-6 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="mt-4 text-lg font-medium text-muted-foreground animate-pulse">Synchronizing Fault Network...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
      <NotificationBanner notification={notification} />
      <PageHeader search={faultSearch} onSearchChange={setFaultSearch} />
      
      <StatsCards
        pendingCount={unassignedTasks.length}
        activeCount={assignedTasks.length}
        resolvedToday={resolvedToday}
        totalTasks={(allTasks as RepairTask[]).length}
        openTasks={uncompleteTasks}
        completedTasks={totalCompleted}
      />

      <Tabs defaultValue="actions" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white dark:bg-zinc-900 border shadow-sm p-1 h-12 rounded-xl">
            <TabsTrigger value="actions" className="rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black transition-all gap-2 px-6">
              <Zap className="h-4 w-4" />
              Action Center
            </TabsTrigger>
            <TabsTrigger value="ledger" className="rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black transition-all gap-2 px-6">
              <ClipboardList className="h-4 w-4" />
              Repair Ledger
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>{unassignedTasks.length} Unassigned</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span>{assignedTasks.length} Active Repairs</span>
             </div>
          </div>
        </div>

        <TabsContent value="actions" className="space-y-12 border-none p-0 outline-none">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <TaskSectionHeader variant="pending" title="Awaiting Assignment" count={unassignedTasks.length} />
              {renderTaskTable(unassignedTasks)}
            </div>

            <div className="space-y-6">
              <TaskSectionHeader variant="active" title="In Progress" count={assignedTasks.length} />
              {renderTaskTable(assignedTasks)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-8 border-none p-0 outline-none">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
              <div>
                <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <History className="h-6 w-6 text-zinc-500" />
                  Repair Task Ledger
                </h3>
                <p className="text-muted-foreground italic">
                  Unified record of both fault-triggered and predictive maintenance tasks.
                </p>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl p-6 border shadow-sm space-y-6">
              <FilterBar
                search={allTasksSearch}
                filterType={filterType}
                filterStatus={filterStatus}
                onSearchChange={setAllTasksSearch}
                onFilterTypeChange={setFilterType}
                onFilterStatusChange={setFilterStatus}
              />

              <TasksTable tasks={filteredAllTasks} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
