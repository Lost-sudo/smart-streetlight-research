"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench } from "lucide-react";

import { RoleGate } from "@/components/auth/role-gate";
import { AssignTechnicianDialog } from "@/components/predictive-maintenance/parts/assign-technician-dialog";
import { priorityColors } from "@/components/predictive-maintenance/utils";

import type { Technician, RepairTask } from "@/lib/redux/api/repairTaskApi";

export type ScheduledTaskRow = RepairTask & { nodeName: string };

export function ScheduledTasksTable({
  tasks,
  availableTechnicians,
  onAssign,
}: {
  tasks: ScheduledTaskRow[];
  availableTechnicians: Technician[];
  onAssign: (taskId: number, technicianId: number) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50">
        <Wrench className="h-6 w-6 text-blue-500 p-1 bg-blue-500/10 rounded-md" />
        <h3 className="text-xl font-bold tracking-tight text-foreground">Scheduled Maintenance Tasks</h3>
        <Badge variant="secondary" className="ml-auto bg-muted">
          {tasks.length}
        </Badge>
      </div>

      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Task</TableHead>
                <TableHead className="font-bold">Priority</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Scheduled</TableHead>
                <TableHead className="font-bold">Assignee</TableHead>
                <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TableRow key={task.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm">{task.nodeName}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {task.description || "Predictive maintenance task"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${priorityColors[task.priority] || ""}`}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={task.status === "completed" ? "default" : task.status === "pending" ? "secondary" : "outline"}
                        className="capitalize text-xs"
                      >
                        {task.status === "in_progress" ? "In Progress" : task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{task.scheduled_at ? new Date(task.scheduled_at).toLocaleDateString() : "Not set"}</span>
                    </TableCell>
                    <TableCell>
                      {task.technician_id ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-sm font-medium">Tech #{task.technician_id}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleGate allowedRoles={["admin", "operator"]}>
                        {task.status === "pending" && !task.technician_id && (
                          <AssignTechnicianDialog
                            availableTechnicians={availableTechnicians}
                            onAssign={(technicianId) => onAssign(task.id, technicianId)}
                            triggerClassName="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                          />
                        )}
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                    No scheduled maintenance tasks. Use the predictions above to schedule proactive maintenance.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

