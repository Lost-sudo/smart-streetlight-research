"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, BrainCircuit, Clock, Wrench } from "lucide-react";

import { priorityColors, sourceTypeConfig, statusConfig } from "@/components/repair-tasks/repair-tasks/utils";

export type RepairTaskRow = {
  id: number;
  nodeName: string;
  deviceId: string;
  description?: string | null;
  created_at: string;
  scheduled_at?: string | null;
  technician_id?: number | null;
  priority: string;
  status: string;
  source_type: string;
  alertType: string;
};

export function TasksTable({ tasks }: { tasks: RepairTaskRow[] }) {
  return (
    <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Node</TableHead>
              <TableHead className="font-bold">Source</TableHead>
              <TableHead className="font-bold">Priority</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Technician</TableHead>
              <TableHead className="font-bold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const stConfig = sourceTypeConfig[task.source_type] || sourceTypeConfig.FAULT;
                const sConfig = statusConfig[task.status] || statusConfig.pending;
                const SourceIcon = task.source_type === "PREDICTIVE" ? BrainCircuit : AlertTriangle;

                return (
                  <TableRow key={task.id} className="transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm">{task.nodeName}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {task.alertType?.replace(/_/g, " ") || task.description || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 text-xs capitalize ${stConfig.color} ${stConfig.bg}`}>
                        <SourceIcon className="h-3 w-3" />
                        {stConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize text-xs ${priorityColors[task.priority] || ""}`}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sConfig.variant} className="capitalize text-xs">
                        {sConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.technician_id ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-sm font-medium">Tech #{task.technician_id}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(task.created_at).toLocaleDateString()}
                        </div>
                        {task.scheduled_at && (
                          <div className="flex items-center gap-1 text-violet-500">
                            <Wrench className="h-3 w-3" />
                            {new Date(task.scheduled_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                  No repair tasks match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

