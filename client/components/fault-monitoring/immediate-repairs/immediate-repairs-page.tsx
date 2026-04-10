"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { useGetStreetlightsQuery } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery } from "@/lib/redux/api/alertApi";
import {
  useAssignTaskMutation,
  useClaimTaskMutation,
  useGetActiveTasksQuery,
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

export function ImmediateRepairsPage() {
  const { data: streetlights = [], isLoading: slLoading } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });
  const { data: alerts = [], isLoading: alertsLoading } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: unassignedBase = [], isLoading: uLoading } = useGetUnassignedTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: activeBase = [], isLoading: aLoading } = useGetActiveTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: availableTechnicians = [] } = useGetAvailableTechniciansQuery(undefined, { pollingInterval: 30000 });
  const { data: resolvedToday = 0, isLoading: rtLoading } = useGetResolvedTodayCountQuery(undefined, { pollingInterval: 15000 });

  const [assignMutate] = useAssignTaskMutation();
  const [claimMutate] = useClaimTaskMutation();
  const [statusMutate] = useUpdateTaskStatusMutation();

  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const alertById = useMemo(() => {
    const m = new Map<number, any>();
    for (const a of alerts as any[]) {
      if (a && typeof a.id === "number") m.set(a.id, a);
    }
    return m;
  }, [alerts]);

  const streetlightById = useMemo(() => {
    const m = new Map<number, any>();
    for (const s of streetlights as any[]) {
      if (s && typeof s.id === "number") m.set(s.id, s);
    }
    return m;
  }, [streetlights]);

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
    const q = search.trim().toLowerCase();
    if (!q) return dbTasks;
    return dbTasks.filter((task) => task.node.toLowerCase().includes(q) || task.faultType.toLowerCase().includes(q));
  }, [dbTasks, search]);

  const unassignedTasks = useMemo(() => filteredTasks.filter((task) => !task.assignedTo), [filteredTasks]);
  const assignedTasks = useMemo(() => filteredTasks.filter((task) => task.assignedTo), [filteredTasks]);

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

  const isLoading = slLoading || alertsLoading || uLoading || aLoading || rtLoading;
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground font-medium">Synchronizing fault data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative">
      <NotificationBanner notification={notification} />
      <PageHeader search={search} onSearchChange={setSearch} />
      <StatsCards pendingCount={unassignedTasks.length} activeCount={assignedTasks.length} resolvedToday={resolvedToday} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4">
          <TaskSectionHeader variant="pending" title="Unassigned / Pending" count={unassignedTasks.length} />
          {renderTaskTable(unassignedTasks)}
        </div>

        <div className="space-y-4">
          <TaskSectionHeader variant="active" title="Assigned / In Progress" count={assignedTasks.length} />
          {renderTaskTable(assignedTasks)}
        </div>
      </div>
    </div>
  );
}

