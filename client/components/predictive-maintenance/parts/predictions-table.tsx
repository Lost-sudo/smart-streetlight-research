"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, Lightbulb } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50">
        <BrainCircuit className="h-6 w-6 text-violet-500 p-1 bg-violet-500/10 rounded-md" />
        <h3 className="text-xl font-bold tracking-tight text-foreground">Failure Predictions</h3>
        <Badge variant="secondary" className="ml-auto bg-muted">
          {rows.length}
        </Badge>
      </div>

      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Node</TableHead>
                <TableHead className="font-bold">Failure Probability</TableHead>
                <TableHead className="font-bold">Predicted Date</TableHead>
                <TableHead className="font-bold">Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((node) => {
                  const config = urgencyConfig[node.urgency_level] || urgencyConfig.low;
                  const failureProb = Math.round(node.failure_probability * 100);

                  return (
                    <TableRow key={node.id} className="group transition-colors hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <Lightbulb className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div>
                            <span className="font-bold text-sm">{node.nodeName}</span>
                            <p className="text-xs text-muted-foreground font-mono">{node.deviceId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-xs">
                            <span className={`font-bold ${config.color}`}>{failureProb}%</span>
                          </div>
                          <Progress value={failureProb} className="h-1.5 bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{new Date(node.predicted_failure_date).toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${config.color} ${config.border} ${config.bg}`}>
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                    No predictive maintenance data available. Waiting for LSTM analysis...
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

