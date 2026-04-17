"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Lightbulb, Loader2, Plus, Pencil, Trash2, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleGate } from "@/components/auth/role-gate";
import { cn } from "@/lib/utils";
import { useGetStreetlightsQuery, useDeleteStreetlightMutation, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetPredictiveMaintenanceLogsQuery, type PredictiveMaintenanceLog } from "@/lib/redux/api/predictiveMaintenanceApi";

import { CreateNodeDialog } from "../CreateNodeDialog";
import { EditNodeDialog } from "../EditNodeDialog";
import { NodeDetailsDialog } from "../NodeDetailsDialog";
import { getStatusConfig } from "./status-config";

const ONLINE_WINDOW_MS = 120_000;

function isOnlineFromLastUpdated(lastUpdated: unknown, nowMs: number) {
  if (typeof lastUpdated !== "string" || lastUpdated.length === 0) return false;
  const dateStr = lastUpdated.endsWith("Z") ? lastUpdated : `${lastUpdated}Z`;
  const ts = new Date(dateStr).getTime();
  if (!Number.isFinite(ts)) return false;
  return nowMs - ts <= ONLINE_WINDOW_MS;
}

export function NodeMonitoringPage() {
  const { data: streetlights = [], isLoading: isStreetlightsLoading } = useGetStreetlightsQuery(undefined, {
    pollingInterval: 15000,
  });
  const { data: pmLogs = [] } = useGetPredictiveMaintenanceLogsQuery(undefined, { pollingInterval: 15000 });
  const [deleteStreetlight, { isLoading: isDeleting }] = useDeleteStreetlightMutation();

  const [selectedNode, setSelectedNode] = useState<Streetlight | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<Streetlight | null>(null);
  const [nodeToEdit, setNodeToEdit] = useState<Streetlight | null>(null);

  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const pmByStreetlightId = useMemo(() => {
    const m = new Map<number, PredictiveMaintenanceLog>();
    for (const log of (pmLogs as PredictiveMaintenanceLog[])) {
      if (log && typeof log.streetlight_id === "number") {
        m.set(log.streetlight_id, log);
      }
    }
    return m;
  }, [pmLogs]);

  // Sort nodes by priority: faulty → maintenance → active → inactive
  const sortedNodes = useMemo(() => {
    return [...streetlights].sort((a, b) => getStatusConfig(a.status).priority - getStatusConfig(b.status).priority);
  }, [streetlights]);

  const handleNodeClick = (node: Streetlight) => {
    setSelectedNode(node);
    setDetailDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, node: Streetlight) => {
    e.stopPropagation();
    setNodeToEdit(node);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, node: Streetlight) => {
    e.stopPropagation();
    setNodeToDelete(node);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!nodeToDelete) return;
    try {
      await deleteStreetlight(nodeToDelete.id).unwrap();
      toast.success(`"${nodeToDelete.name}" has been deleted`);
      setDeleteDialogOpen(false);
      setNodeToDelete(null);
    } catch (error) {
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || "Failed to delete node");
    }
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
          {sortedNodes.map((node) => {
            const config = getStatusConfig(node.status);
            const isActive = node.status === "active";
            const pm = pmByStreetlightId.get(node.id);
            const isOnline = isOnlineFromLastUpdated(pm?.last_updated, nowTick);

            // Enforce config styling based on network drop
            const renderedConfig =
              isOnline || !isActive
                ? config
                : {
                    ...config,
                    bg: "bg-zinc-100 dark:bg-zinc-800/60",
                    icon: "text-zinc-500 dark:text-zinc-400",
                    dot: "bg-zinc-400",
                    badge: "secondary" as const,
                  };

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
                  <div className="absolute top-4 right-4">
                    <span className="relative flex h-3 w-3">
                      {isOnline && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span className={cn("relative inline-flex rounded-full h-3 w-3", renderedConfig.dot)} />
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200",
                        renderedConfig.bg,
                        renderedConfig.bgHover
                      )}
                    >
                      <Lightbulb className={cn("h-5 w-5", renderedConfig.icon)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {node.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">{node.device_id || "No Device ID"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={renderedConfig.badge} className="text-[10px] px-1.5 py-0 capitalize">
                      {node.status === "active" && !isOnline ? "Offline" : renderedConfig.label}
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

                  <RoleGate allowedRoles={["admin", "operator"]}>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => handleEditClick(e, node)}
                      >
                        <Pencil className="h-3 w-3 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800/40"
                        onClick={(e) => handleDeleteClick(e, node)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </RoleGate>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NodeDetailsDialog node={selectedNode} open={detailDialogOpen} onOpenChange={setDetailDialogOpen} />

      <EditNodeDialog node={nodeToEdit} open={editDialogOpen} onOpenChange={setEditDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Streetlight Node</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{nodeToDelete?.name}</strong>? This action cannot be
              undone and will remove all associated telemetry logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Node
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

