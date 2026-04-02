"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, Loader2, Wifi, WifiOff, Plus } from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { useGetStreetlightsQuery } from "@/lib/redux/api/streetlightApi";
import { CreateNodeDialog } from "@/components/monitoring/CreateNodeDialog";
import { NodeDetailsDialog } from "@/components/monitoring/NodeDetailsDialog";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

export default function MonitoringPage() {
  const { data: streetlights = [], isLoading: isStreetlightsLoading } = useGetStreetlightsQuery();
  const [selectedNode, setSelectedNode] = useState<Streetlight | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNodeClick = (node: Streetlight) => {
    setSelectedNode(node);
    setDialogOpen(true);
  };

  if (isStreetlightsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading nodes...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Node Monitoring</h2>
          <p className="text-muted-foreground">
            Select a streetlight node to inspect its real-time telemetry and performance data.
          </p>
        </div>
        <RoleGate allowedRoles={["admin", "operator"]}>
          <CreateNodeDialog />
        </RoleGate>
      </div>

      {/* Node Grid */}
      {streetlights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">No nodes registered</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Create your first streetlight node to start monitoring real-time telemetry data.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {streetlights.map((node) => {
            const isOnline = node.status === "Normal";
            return (
              <Card
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className={cn(
                  "relative cursor-pointer border shadow-sm transition-all duration-200",
                  "hover:shadow-lg hover:scale-[1.02] hover:border-primary/40",
                  "bg-white dark:bg-zinc-900",
                  "active:scale-[0.98]",
                  "group"
                )}
              >
                <CardContent className="pt-5 pb-4 px-5">
                  {/* Status Indicator Dot */}
                  <div className="absolute top-4 right-4">
                    <span className="relative flex h-3 w-3">
                      {isOnline && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span className={cn(
                        "relative inline-flex rounded-full h-3 w-3",
                        isOnline ? "bg-emerald-500" : "bg-red-500"
                      )} />
                    </span>
                  </div>

                  {/* Icon & Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200",
                      isOnline
                        ? "bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60"
                        : "bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200 dark:group-hover:bg-red-900/60"
                    )}>
                      <Lightbulb className={cn(
                        "h-5 w-5",
                        isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      )} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {node.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {node.device_id || "No Device ID"}
                      </p>
                    </div>
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={isOnline ? "default" : "destructive"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {node.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isOnline ? (
                        <Wifi className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-red-400" />
                      )}
                      <span>{isOnline ? "Online" : "Offline"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Node Details Dialog */}
      <NodeDetailsDialog
        node={selectedNode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
