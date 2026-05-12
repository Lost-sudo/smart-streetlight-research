"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, History, Package } from "lucide-react";
import type { MaintenanceLog } from "@/lib/redux/api/maintenanceLogApi";

export type EnhancedMaintenanceLog = MaintenanceLog & { nodeName: string };

export function MaintenanceLogsTable({ logs }: { logs: EnhancedMaintenanceLog[] }) {
  return (
    <div className="rounded-2xl border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto max-h-[500px]">
        <Table>
          <TableHeader className="bg-muted/50 border-none sticky top-0 z-10">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-bold py-4">Event ID</TableHead>
              <TableHead className="font-bold py-4">Node Context</TableHead>
              <TableHead className="font-bold py-4">Diagnostic Result</TableHead>
              <TableHead className="font-bold py-4">Resolution</TableHead>
              <TableHead className="font-bold py-4 text-right">Completion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id} className="group transition-all duration-300 hover:bg-muted/30 border-muted/20">
                  <TableCell className="py-4 font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                    #ML-{log.id}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{log.nodeName}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">ID: {log.streetlight_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-xs text-foreground/80 line-clamp-2 max-w-[250px] leading-relaxed" title={log.description || "N/A"}>
                      {log.description || "System diagnostic recorded no anomalies during proactive check."}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <Package className="h-3 w-3" />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground italic truncate max-w-[150px]" title={log.parts_replaced || "None"}>
                        {log.parts_replaced || "No Parts Replaced"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Verified
                      </Badge>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {log.completion_date ? new Date(log.completion_date).toLocaleDateString() : "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                       <History className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="text-muted-foreground font-semibold">No Maintenance History</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">All resolution logs will appear here</p>
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
