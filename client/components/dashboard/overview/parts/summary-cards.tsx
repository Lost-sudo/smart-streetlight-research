"use client";

import { Activity, AlertTriangle, Wrench } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCards({
  activeNodes,
  inactiveNodes,
  faultyNodes,
  maintenanceNodes,
  totalNodes,
}: {
  activeNodes: number;
  inactiveNodes: number;
  faultyNodes: number;
  maintenanceNodes: number;
  totalNodes: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalNodes}</div>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">Registered Nodes</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeNodes}</div>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">Operational</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Faulty</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">{faultyNodes}</div>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">Attention Required</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          <Wrench className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{maintenanceNodes}</div>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">In Maintenance</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-zinc-400">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          <div className="h-2 w-2 rounded-full bg-zinc-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-500 dark:text-zinc-400">{inactiveNodes}</div>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">Not Operational</p>
        </CardContent>
      </Card>
    </div>
  );
}

