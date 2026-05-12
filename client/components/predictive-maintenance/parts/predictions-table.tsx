"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lightbulb } from "lucide-react";

import { urgencyConfig } from "@/components/predictive-maintenance/utils";

export type PredictionRow = {
  id: number;
  streetlight_id: number;
  nodeName: string;
  deviceId: string;
  failure_probability: number;
  predicted_failure_date: string;
  urgency_level: string;
};

export function PredictionsTable({
  rows,
}: {
  rows: PredictionRow[];
}) {
  return (
    <div className="rounded-2xl border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-none">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-bold py-4">IoT Node</TableHead>
              <TableHead className="font-bold py-4">Failure Risk</TableHead>
              <TableHead className="font-bold py-4">Est. Failure Date</TableHead>
              <TableHead className="font-bold py-4">Urgency Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((node) => {
                const config = urgencyConfig[node.urgency_level] || urgencyConfig.low;
                const failureProb = Math.round(node.failure_probability * 100);

                return (
                  <TableRow key={node.id} className="group transition-all duration-300 hover:bg-muted/30 border-muted/20">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${config.bg} transition-transform group-hover:scale-110 shadow-inner`}>
                          <Lightbulb className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-foreground">{node.nodeName}</span>
                          <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">{node.deviceId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1.5 w-36">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className={config.color}>{failureProb}% Confidence</span>
                        </div>
                        <Progress value={failureProb} className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden [&>div]:transition-all [&>div]:duration-1000" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm font-semibold text-foreground/80">
                        {failureProb > 0
                          ? new Date(node.predicted_failure_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : <span className="text-muted-foreground italic font-normal">System Stable</span>
                        }
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={`capitalize font-bold border-2 px-3 py-0.5 rounded-full shadow-sm ${config.color} ${config.border} ${config.bg}`}>
                        {config.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    <p className="text-muted-foreground font-semibold">Awaiting Neural Insights...</p>
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
