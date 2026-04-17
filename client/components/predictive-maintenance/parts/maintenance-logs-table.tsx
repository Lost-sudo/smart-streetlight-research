"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Factory } from "lucide-react";
import type { MaintenanceLog } from "@/lib/redux/api/maintenanceLogApi";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

export type EnhancedMaintenanceLog = MaintenanceLog & { nodeName: string };

export function MaintenanceLogsTable({ logs }: { logs: EnhancedMaintenanceLog[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50 mt-8">
        <Factory className="h-6 w-6 text-green-500 p-1 bg-green-500/10 rounded-md" />
        <h3 className="text-xl font-bold tracking-tight text-foreground">Completed Maintenance Logs</h3>
        <Badge variant="secondary" className="ml-auto bg-muted">
          {logs.length}
        </Badge>
      </div>

      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm backdrop-blur-md">
              <TableRow>
                <TableHead className="font-bold">Log ID</TableHead>
                <TableHead className="font-bold">Node/Streetlight</TableHead>
                <TableHead className="font-bold">Diagnosis / Description</TableHead>
                <TableHead className="font-bold">Parts Replaced</TableHead>
                <TableHead className="font-bold">Completion Date</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">#ML-{log.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-foreground">{log.nodeName}</span>
                        <span className="text-xs text-muted-foreground">ID: {log.streetlight_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate max-w-[200px] block" title={log.description || "N/A"}>
                        {log.description || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate max-w-[150px] block italic text-muted-foreground" title={log.parts_replaced || "None"}>
                        {log.parts_replaced || "None"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.completion_date ? new Date(log.completion_date).toLocaleDateString() : "Unknown"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="capitalize bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                    No completed maintenance logs yet.
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
