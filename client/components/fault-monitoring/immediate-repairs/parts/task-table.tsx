"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lightbulb, UserCheck, ShieldCheck } from "lucide-react";

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
    <div className="rounded-2xl border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-none">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-bold py-4">Response Unit</TableHead>
              <TableHead className="font-bold py-4">Risk Level</TableHead>
              <TableHead className="font-bold py-4">Status</TableHead>
              <TableHead className="text-right font-bold py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id} className="group transition-all duration-300 hover:bg-muted/30 border-muted/20">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 transition-transform group-hover:scale-110 shadow-inner`}>
                        <Lightbulb className={`h-4 w-4 text-zinc-500`} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-foreground">{task.node}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          <AlertTriangle className={`h-3 w-3 ${
                            task.priority === "Critical" ? "text-red-500" : 
                            task.priority === "High" ? "text-orange-500" : 
                            "text-yellow-500"
                          }`} />
                          {task.faultType}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className={`capitalize font-bold border-2 rounded-full px-3 py-0.5 shadow-sm ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {task.assignedTo ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                           <span className="text-sm font-bold text-foreground/90">{task.assignedTo}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                           <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 dark:text-emerald-400">Deployed</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground italic">
                        <span className="text-xs font-medium">Unassigned</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <TaskInspectDialog
                      task={task}
                      availableTechnicians={availableTechnicians}
                      onAssign={onAssign}
                      onClaim={onClaim}
                      onUpdateStatus={onUpdateStatus}
                      // triggerClassName="h-9 w-9 p-0 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500">
                       <ShieldCheck className="h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground font-semibold">Response Unit Standby</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">No active faults detected in this sector</p>
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
