"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, BrainCircuit, CheckCircle2, Clock } from "lucide-react";

import { priorityColors, sourceTypeConfig, statusConfig } from "@/components/repair-tasks/my-assigned-tasks/utils";

export type ActiveTaskRow = {
  id: string;
  priority: string;
  nodeName: string;
  alertType: string;
  status: string;
  source_type: string;
};

export function ActiveTasksTable({
  tasks,
  isUpdating,
  onStartRepair,
  onCompleteRepair,
}: {
  tasks: ActiveTaskRow[];
  isUpdating: boolean;
  onStartRepair: (taskId: string) => void;
  onCompleteRepair: (taskId: string) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-muted/10">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[100px]">Priority</TableHead>
          <TableHead>Node/Streetlight</TableHead>
          <TableHead>Fault Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const source = sourceTypeConfig[task.source_type] ?? sourceTypeConfig.FAULT;
            const status = statusConfig[task.status] ?? statusConfig.assigned;
            const SourceIcon = task.source_type === "PREDICTIVE" ? BrainCircuit : AlertTriangle;

            return (
              <TableRow key={task.id} className="cursor-default group hover:bg-muted/5">
                <TableCell>
                  <Badge className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityColors[task.priority]}`}>
                    {String(task.priority).toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{task.nodeName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`${source.color} ${source.bg} p-1 rounded-sm`}>
                      <SourceIcon className="h-3 w-3" />
                    </span>
                    <span className="text-sm">{task.alertType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="text-[10px] uppercase font-bold tracking-wider">
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {task.status === "assigned" && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 font-semibold h-8"
                      onClick={() => onStartRepair(task.id)}
                      disabled={isUpdating}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" /> Start Repair
                    </Button>
                  )}
                  {task.status === "in_progress" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 font-semibold h-8"
                      onClick={() => onCompleteRepair(task.id)}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Complete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
              No active tasks assigned to you.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

