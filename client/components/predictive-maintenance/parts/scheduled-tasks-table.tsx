"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, User, Calendar, AlertCircle } from "lucide-react";

import { RoleGate } from "@/components/auth/role-gate";
import { AssignTechnicianDialog } from "@/components/predictive-maintenance/parts/assign-technician-dialog";
import { priorityColors } from "@/components/predictive-maintenance/utils";

import type { Technician } from "@/lib/redux/api/repairTaskApi";
import type { MaintenanceTask } from "@/lib/redux/api/maintenanceTaskApi";

export type ScheduledTaskRow = MaintenanceTask & { nodeName: string };

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
    <div className="rounded-2xl border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-none">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-bold py-4">Task / Node</TableHead>
              <TableHead className="font-bold py-4">Priority</TableHead>
              <TableHead className="font-bold py-4">Status</TableHead>
              <TableHead className="font-bold py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id} className="group transition-all duration-300 hover:bg-muted/30 border-muted/20">
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{task.nodeName}</span>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-zinc-100 dark:bg-zinc-800">#{task.id}</Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground line-clamp-1 italic max-w-[200px]">
                        {task.description || "Routine proactive maintenance"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className={`capitalize font-bold border-2 rounded-full px-2.5 py-0 ${priorityColors[task.priority] || ""}`}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                     <div className="flex flex-col gap-1">
                        <Badge
                          variant={task.status === "completed" ? "default" : task.status === "pending" ? "secondary" : "outline"}
                          className="capitalize text-[10px] font-black w-fit rounded-lg shadow-sm"
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                          {task.technician_id ? (
                            <>
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tighter">Tech #{task.technician_id} Assigned</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-2.5 w-2.5 text-orange-500" />
                              <span className="uppercase tracking-tighter italic">Pending Assignment</span>
                            </>
                          )}
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <RoleGate allowedRoles={["admin", "operator"]}>
                      {task.status === "pending" && !task.technician_id && (
                        <AssignTechnicianDialog
                          availableTechnicians={availableTechnicians}
                          onAssign={(technicianId) => onAssign(task.id, technicianId)}
                          triggerClassName="h-9 w-9 p-0 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                        />
                      )}
                    </RoleGate>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <p className="text-muted-foreground font-semibold">Queue Clear</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">No active repair tasks</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
