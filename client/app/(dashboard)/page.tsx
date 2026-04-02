"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Activity,
  AlertTriangle,
  Wrench,
  Zap,
  Sun,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useGetStreetlightsQuery } from "@/lib/redux/api/streetlightApi";

export default function DashboardPage() {
  const { data: streetlights = [], isLoading } = useGetStreetlightsQuery();

  const totalNodes = streetlights.length;
  const activeNodes = streetlights.filter((n) => n.status === "active").length;
  const faultyNodes = streetlights.filter((n) => n.status === "faulty").length;
  const maintenanceNodes = streetlights.filter((n) => n.status === "maintenance").length;
  const inactiveNodes = streetlights.filter((n) => n.status === "inactive").length;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Live System Status</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">{today}</div>
        </div>
      </div>

      {/* System Summary Cards */}
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

      {/* Node Status Grid */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-foreground/80">Node Status Grid</h3>
        {streetlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-16 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <h4 className="text-lg font-bold">No nodes registered</h4>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              Go to the Monitoring page and create your first streetlight node to see it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {streetlights.map((node) => {
              const isActive = node.status === "active";
              const isFaulty = node.status === "faulty";
              const isMaintenance = node.status === "maintenance";

              const StatusIcon = isActive ? CheckCircle2 : isFaulty ? AlertTriangle : isMaintenance ? Wrench : WifiOff;
              
              const statusColor = isActive
                ? "text-emerald-500"
                : isFaulty
                ? "text-red-500"
                : isMaintenance
                ? "text-amber-500"
                : "text-zinc-400";

              const dotColor = isActive
                ? "bg-emerald-500"
                : isFaulty
                ? "bg-red-500"
                : isMaintenance
                ? "bg-amber-500"
                : "bg-zinc-400";

              const borderColor = isActive
                ? "border-t-emerald-500"
                : isFaulty
                ? "border-t-red-500"
                : isMaintenance
                ? "border-t-amber-500"
                : "border-t-zinc-400";

              const healthWidth = isActive ? "w-[95%]" : isFaulty ? "w-[15%]" : isMaintenance ? "w-[45%]" : "w-[0%]";
              const healthColor = isActive ? "bg-emerald-500" : isFaulty ? "bg-red-500" : isMaintenance ? "bg-amber-500" : "bg-zinc-400";

              return (
                <Card
                  key={node.id}
                  className={`overflow-hidden border-t-4 ${borderColor} hover:shadow-lg transition-all duration-200 group`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
                    <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                      {node.name}
                    </CardTitle>
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${statusColor} border-current gap-1 capitalize py-0 px-2 text-[10px]`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        {node.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        {isActive ? (
                          <Wifi className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-red-400" />
                        )}
                        <span>{isActive ? "Online" : "Offline"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span className="font-mono text-[10px]">{node.device_id || "No ID"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <Sun className="h-4 w-4" />
                        <span>{node.dimming_level}%</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Node Health</div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {isActive ? "95%" : isFaulty ? "15%" : isMaintenance ? "45%" : "0%"}
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ease-in-out ${healthColor} ${healthWidth}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
