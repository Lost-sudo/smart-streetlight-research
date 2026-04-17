"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery, type Alert } from "@/lib/redux/api/alertApi";
import { useGetMyTasksQuery, useUpdateTaskStatusMutation, type RepairTask } from "@/lib/redux/api/repairTaskApi";
import { 
  useGetMyTasksQuery as useGetMyMaintenanceTasksQuery,
  useUpdateStatusMutation as useUpdateMaintenanceTaskStatusMutation,
  useCompleteWithLogMutation,
  type MaintenanceTask
} from "@/lib/redux/api/maintenanceTaskApi";
import { useCreateRepairLogMutation } from "@/lib/redux/api/repairLogApi";
import { showNotification } from "@/lib/utils/notifications";

import { ActiveTasksTable, type ActiveTaskRow } from "@/components/repair-tasks/my-assigned-tasks/parts/active-tasks-table";
import { CompletedTasks } from "@/components/repair-tasks/my-assigned-tasks/parts/completed-tasks";
import {
  CompleteRepairDialog,
  emptyRepairLogForm,
  type RepairLogFormData,
} from "@/components/repair-tasks/my-assigned-tasks/parts/complete-repair-dialog";
import { indexAlertsById, indexStreetlightsById } from "@/components/repair-tasks/my-assigned-tasks/utils";

type EnrichedTask = {
  id: string; // r-X or m-X
  originalId: number;
  type: "REPAIR" | "MAINTENANCE";
  priority: string;
  nodeName: string;
  alertType: string;
  status: string;
  source_type: string;
};

export function MyAssignedTasksPage() {
  const { data: myTasks = [], isLoading: tasksLoading } = useGetMyTasksQuery(undefined, { pollingInterval: 10000 });
  const { data: myMaintenanceTasks = [], isLoading: mTasksLoading } = useGetMyMaintenanceTasksQuery(undefined, { pollingInterval: 10000 });
  const { data: alerts = [] } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: streetlights = [] } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateTaskStatusMutation();
  const [createRepairLog, { isLoading: isCreatingLog }] = useCreateRepairLogMutation();

  const [updateMaintenanceStatus, { isLoading: isUpdatingM }] = useUpdateMaintenanceTaskStatusMutation();
  const [completeMaintenanceLog, { isLoading: isCreatingMLog }] = useCompleteWithLogMutation();

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: number; type: "REPAIR" | "MAINTENANCE" } | null>(null);
  const [repairForm, setRepairForm] = useState<RepairLogFormData>(emptyRepairLogForm);

  const alertById = useMemo(() => indexAlertsById(alerts as Alert[]), [alerts]);
  const streetlightById = useMemo(() => indexStreetlightsById(streetlights as Streetlight[]), [streetlights]);

  const enrichedTasks: EnrichedTask[] = useMemo(() => {
    const list: EnrichedTask[] = [];

    // Map repair tasks
    (myTasks as RepairTask[]).forEach((task) => {
      const alert = task.alert_id ? alertById.get(task.alert_id) : undefined;
      const sl = streetlightById.get(task.streetlight_id);
      list.push({
        id: `r-${task.id}`,
        originalId: task.id,
        type: "REPAIR",
        priority: task.priority,
        nodeName: sl?.name || "Unknown Node",
        alertType: alert?.type || (task.source_type === "PREDICTIVE" ? "Predictive maintenance" : "General Alert"),
        status: task.status,
        source_type: task.source_type,
      });
    });

    // Map maintenance tasks
    (myMaintenanceTasks as MaintenanceTask[]).forEach((task) => {
      const sl = streetlightById.get(task.streetlight_id);
      list.push({
        id: `m-${task.id}`,
        originalId: task.id,
        type: "MAINTENANCE",
        priority: task.priority,
        nodeName: sl?.name || "Unknown Node",
        alertType: "Predictive maintenance",
        status: task.status,
        source_type: "PREDICTIVE",
      });
    });

    return list;
  }, [myTasks, myMaintenanceTasks, alertById, streetlightById]);

  const handleStartRepair = async (idValue: string) => {
    const isMaintenance = idValue.startsWith("m-");
    const taskId = parseInt(idValue.substring(2));

    try {
      if (isMaintenance) {
        await updateMaintenanceStatus({ taskId, status: "in_progress" }).unwrap();
      } else {
        await updateStatus({ taskId, status: "in_progress" }).unwrap();
      }
      showNotification("Task started successfully!", "success");
    } catch (e) {
      showNotification("Failed to start task. Please try again.", "info");
      console.error(e);
    }
  };

  const openCompleteDialog = (idValue: string) => {
    const isMaintenance = idValue.startsWith("m-");
    const taskId = parseInt(idValue.substring(2));
    
    setSelectedTask({ id: taskId, type: isMaintenance ? "MAINTENANCE" : "REPAIR" });
    setRepairForm(emptyRepairLogForm);
    setCompleteDialogOpen(true);
  };

  const handleFormChange = (field: keyof RepairLogFormData, value: string) => {
    setRepairForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFinalizeRepair = async () => {
    if (!selectedTask) return;

    try {
      if (selectedTask.type === "MAINTENANCE") {
        await completeMaintenanceLog({
          taskId: selectedTask.id,
          completion: {
            description: repairForm.diagnosis || undefined,
            parts_replaced: repairForm.parts_replaced || undefined,
            notes: repairForm.notes || undefined,
          }
        }).unwrap();
      } else {
        // 1. Update the task status to completed
        await updateStatus({
          taskId: selectedTask.id,
          status: "completed",
          description: repairForm.diagnosis,
        }).unwrap();

        // 2. Create the repair log
        await createRepairLog({
          repair_task_id: selectedTask.id,
          diagnosis: repairForm.diagnosis || undefined,
          action_taken: repairForm.action_taken || undefined,
          parts_replaced: repairForm.parts_replaced || undefined,
          repair_duration_minutes: repairForm.repair_duration_minutes
            ? parseFloat(repairForm.repair_duration_minutes)
            : undefined,
          notes: repairForm.notes || undefined,
        }).unwrap();
      }

      showNotification("Task completed and log created successfully!", "success");
      setCompleteDialogOpen(false);
      setRepairForm(emptyRepairLogForm);
    } catch (e) {
      showNotification("Failed to complete task. Please try again.", "info");
      console.error(e);
    }
  };

  if (tasksLoading || mTasksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeTasks = enrichedTasks.filter((t) => t.status !== "completed");
  const completedTasks = enrichedTasks.filter((t) => t.status === "completed");

  const activeRows: ActiveTaskRow[] = activeTasks.map((t) => ({
    id: t.id,
    priority: t.priority,
    nodeName: t.nodeName,
    alertType: t.alertType,
    status: t.status,
    source_type: t.source_type,
  }));

  const isBusy = isUpdating || isCreatingLog || isUpdatingM || isCreatingMLog;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Assigned Tasks</h2>
          <p className="text-muted-foreground italic">Manage your assignments and update progress.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Active Assignments</CardTitle>
                <CardDescription>Tasks requiring your attention.</CardDescription>
              </div>
              <Badge variant="outline" className="text-primary font-bold">
                {activeRows.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ActiveTasksTable
              tasks={activeRows}
              isUpdating={isBusy}
              onStartRepair={handleStartRepair}
              onCompleteRepair={openCompleteDialog}
            />
          </CardContent>
        </Card>

        <CompletedTasks tasks={completedTasks.map((t) => ({ id: t.id, nodeName: t.nodeName, alertType: t.alertType }))} />
      </div>

      <CompleteRepairDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        formData={repairForm}
        onFormChange={handleFormChange}
        isUpdating={isBusy}
        onFinalize={handleFinalizeRepair}
      />
    </div>
  );
}
