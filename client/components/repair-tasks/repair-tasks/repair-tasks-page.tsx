"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery, type Alert } from "@/lib/redux/api/alertApi";
import { useGetAllRepairTasksQuery, type RepairTask } from "@/lib/redux/api/repairTaskApi";

import { FilterBar } from "@/components/repair-tasks/repair-tasks/parts/filter-bar";
import { StatsCards } from "@/components/repair-tasks/repair-tasks/parts/stats-cards";
import { TasksTable, type RepairTaskRow } from "@/components/repair-tasks/repair-tasks/parts/tasks-table";
import { indexAlertsById, indexStreetlightsById } from "@/components/repair-tasks/repair-tasks/utils";

export function RepairTasksPage() {
  const { data: allTasks = [], isLoading: tasksLoading } = useGetAllRepairTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: alerts = [] } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: streetlights = [] } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const alertById = useMemo(() => indexAlertsById(alerts as Alert[]), [alerts]);
  const streetlightById = useMemo(() => indexStreetlightsById(streetlights as Streetlight[]), [streetlights]);

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

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedTasks.filter((task) => {
      const matchesSearch =
        task.nodeName.toLowerCase().includes(q) ||
        task.alertType.toLowerCase().includes(q) ||
        (task.description || "").toLowerCase().includes(q);

      const matchesType = filterType === "ALL" || task.source_type === filterType;
      const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [enrichedTasks, search, filterType, filterStatus]);

  const { totalFault, totalPredictive, totalCompleted } = useMemo(() => {
    const tasks = allTasks as RepairTask[];
    return {
      totalFault: tasks.filter((t) => t.source_type === "FAULT").length,
      totalPredictive: tasks.filter((t) => t.source_type === "PREDICTIVE").length,
      totalCompleted: tasks.filter((t) => t.status === "completed").length,
    };
  }, [allTasks]);

  if (tasksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading repair tasks...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repair Tasks</h2>
          <p className="text-muted-foreground italic">
            Unified view of all repair tasks from Fault Detection and Predictive Maintenance.
          </p>
        </div>
      </div>

      <StatsCards
        totalTasks={(allTasks as RepairTask[]).length}
        faultTasks={totalFault}
        predictiveTasks={totalPredictive}
        completedTasks={totalCompleted}
      />

      <FilterBar
        search={search}
        filterType={filterType}
        filterStatus={filterStatus}
        onSearchChange={setSearch}
        onFilterTypeChange={setFilterType}
        onFilterStatusChange={setFilterStatus}
      />

      <TasksTable tasks={filteredTasks} />
    </div>
  );
}

