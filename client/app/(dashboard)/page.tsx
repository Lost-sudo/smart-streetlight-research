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
  const activeNodes = streetlights.filter((n) => n.status === "Normal").length;
  const faultyNodes = streetlights.filter((n) => n.status === "Faulty").length;
  const maintenanceNodes = totalNodes - activeNodes - faultyNodes;

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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Live System Status</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">{today}</div>
        </div>
      </div>

      {/* System Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalNodes}</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">REGISTERED IN SYSTEM</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeNodes}</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">STEADY PERFORMANCE</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Faulty</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{faultyNodes}</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">REQUIRES ATTENTION</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Other</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maintenanceNodes}</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">INACTIVE / MAINTENANCE</p>
          </CardContent>
        </Card>
      </div>

      {/* Node Status Grid */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Node Status Grid</h3>
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
              const isNormal = node.status === "Normal";
              const isFaulty = node.status === "Faulty";

              const StatusIcon = isNormal ? CheckCircle2 : isFaulty ? AlertTriangle : Wrench;
              const statusColor = isNormal
                ? "text-green-500"
                : isFaulty
                ? "text-red-500"
                : "text-yellow-500";
              const dotColor = isNormal
                ? "bg-green-500"
                : isFaulty
                ? "bg-red-500"
                : "bg-yellow-500";
              const borderColor = isNormal
                ? "border-t-green-500"
                : isFaulty
                ? "border-t-red-500"
                : "border-t-yellow-500";

              return (
                <Card
                  key={node.id}
                  className={`overflow-hidden border-t-4 ${borderColor} hover:shadow-lg transition-shadow`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
                    <CardTitle className="text-lg font-bold">{node.name}</CardTitle>
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${statusColor} border-current gap-1`}>
                        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                        {node.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {isNormal ? (
                          <Wifi className="h-3 w-3 text-green-500" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-red-400" />
                        )}
                        <span>{isNormal ? "Online" : "Offline"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span className="font-mono text-xs">{node.device_id || "No ID"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sun className="h-4 w-4" />
                        <span>{node.dimming_level}%</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Node Health</div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isNormal
                              ? "bg-green-500 w-[95%]"
                              : isFaulty
                              ? "bg-red-500 w-[15%]"
                              : "bg-yellow-500 w-[60%]"
                          }`}
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
