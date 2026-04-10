import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

import type { Technician } from "@/lib/redux/api/repairTaskApi";
import type { MaintenanceTask } from "@/components/fault-monitoring/immediate-repairs/data-mappers";
import { priorityColors } from "@/components/fault-monitoring/immediate-repairs/priority-config";
import { TaskInspectDialog } from "@/components/fault-monitoring/immediate-repairs/parts/task-inspect-dialog";

export function TaskTable({
  tasks,
  availableTechnicians,
  onAssign,
  onClaim,
  onUpdateStatus,
}: {
  tasks: MaintenanceTask[];
  availableTechnicians: Technician[];
  onAssign: (taskId: string, technicianId: number) => Promise<void>;
  onClaim: (taskId: string) => Promise<void>;
  onUpdateStatus: (taskId: string, status: string) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Node & Fault</TableHead>
              <TableHead className="font-bold">Priority</TableHead>
              <TableHead className="font-bold">Assignee</TableHead>
              <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">{task.node}</span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle
                          className={`h-3 w-3 ${
                            task.priority === "High"
                              ? "text-red-500"
                              : task.priority === "Medium"
                              ? "text-orange-500"
                              : "text-yellow-500"
                          }`}
                        />
                        {task.faultType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium">{task.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <TaskInspectDialog
                      task={task}
                      availableTechnicians={availableTechnicians}
                      onAssign={onAssign}
                      onClaim={onClaim}
                      onUpdateStatus={onUpdateStatus}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground font-medium">
                  No tasks here. All systems nominal.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

