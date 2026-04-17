"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery, type Alert } from "@/lib/redux/api/alertApi";
import { useGetMyTasksQuery, useUpdateTaskStatusMutation, type RepairTask } from "@/lib/redux/api/repairTaskApi";
import { showNotification } from "@/lib/utils/notifications";

import { ActiveTasksTable, type ActiveTaskRow } from "@/components/repair-tasks/my-assigned-tasks/parts/active-tasks-table";
import { CompletedTasks } from "@/components/repair-tasks/my-assigned-tasks/parts/completed-tasks";
import { CompleteRepairDialog } from "@/components/repair-tasks/my-assigned-tasks/parts/complete-repair-dialog";
import { indexAlertsById, indexStreetlightsById } from "@/components/repair-tasks/my-assigned-tasks/utils";

type EnrichedTask = RepairTask & { nodeName: string; alertType: string };

export function MyAssignedTasksPage() {
  const { data: myTasks = [], isLoading: tasksLoading } = useGetMyTasksQuery(undefined, { pollingInterval: 10000 });
  const { data: alerts = [] } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: streetlights = [] } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateTaskStatusMutation();

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [repairNotes, setRepairNotes] = useState("");

  const alertById = useMemo(() => indexAlertsById(alerts as Alert[]), [alerts]);
  const streetlightById = useMemo(() => indexStreetlightsById(streetlights as Streetlight[]), [streetlights]);

  const enrichedTasks: EnrichedTask[] = useMemo(() => {
    return (myTasks as RepairTask[]).map((task) => {
      const alert = task.alert_id ? alertById.get(task.alert_id) : undefined;
      const sl = streetlightById.get(task.streetlight_id);
      return {
        ...task,
        nodeName: sl?.name || "Unknown Node",
        alertType: alert?.type || (task.source_type === "PREDICTIVE" ? "Predictive maintenance" : "General Alert"),
      };
    });
  }, [myTasks, alertById, streetlightById]);

  const handleStatusChange = async (taskId: number, status: string, notes?: string) => {
    try {
      await updateStatus({ taskId, status, description: notes }).unwrap();
      const action = status === "in_progress" ? "started" : "completed";
      showNotification(`Repair ${action} successfully!`, "success");
      if (status === "completed") {
        setCompleteDialogOpen(false);
        setRepairNotes("");
      }
    } catch (e) {
      showNotification("Failed to update status. Please try again.", "info");
      console.error(e);
    }
  };

  const openCompleteDialog = (taskId: number) => {
    setSelectedTaskId(taskId);
    setCompleteDialogOpen(true);
  };

  if (tasksLoading) {
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

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Assigned Tasks</h2>
          <p className="text-muted-foreground italic">Manage your repair assignments and update progress.</p>
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
              isUpdating={isUpdating}
              onStartRepair={(id) => handleStatusChange(id, "in_progress")}
              onCompleteRepair={openCompleteDialog}
            />
          </CardContent>
        </Card>

        <CompletedTasks tasks={completedTasks.map((t) => ({ id: t.id, nodeName: t.nodeName, alertType: t.alertType }))} />
      </div>

      <CompleteRepairDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        notes={repairNotes}
        onNotesChange={setRepairNotes}
        isUpdating={isUpdating}
        onFinalize={() => selectedTaskId && handleStatusChange(selectedTaskId, "completed", repairNotes)}
      />
    </div>
  );
}

