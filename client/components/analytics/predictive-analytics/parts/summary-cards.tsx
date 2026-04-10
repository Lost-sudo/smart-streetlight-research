"use client";

import { Activity, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function SummaryCards({
  onlineCount,
  normalCount,
  warningCount,
  criticalCount,
}: {
  onlineCount: number;
  normalCount: number;
  warningCount: number;
  criticalCount: number;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Online Nodes</p>
            <p className="text-3xl font-bold">{onlineCount}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-full">
            <Activity className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-emerald-500">Normal</p>
            <p className="text-3xl font-bold">{normalCount}</p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-500">Warning</p>
            <p className="text-3xl font-bold">{warningCount}</p>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-full">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-500">Critical Failure</p>
            <p className="text-3xl font-bold">{criticalCount}</p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

