"use client";

import { useGetPredictiveAlertsQuery, useResolvePredictiveAlertMutation } from "@/lib/redux/api/predictiveAlertApi";
import { AlertCircle, CheckCircle, Lightbulb, Bell, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type PredictionRow } from "./predictions-table";
import { ScheduleMaintenanceDialog } from "./schedule-maintenance-dialog";
import { urgencyConfig } from "../utils";
import { RoleGate } from "@/components/auth/role-gate";
import { Badge } from "@/components/ui/badge";

export function ActivePredictiveAlerts({
  rows,
  onScheduleMaintenance,
  hasActiveTask,
}: {
  rows: PredictionRow[];
  onScheduleMaintenance: (pm: PredictionRow, args: { scheduledAt?: string; description?: string }) => Promise<void>;
  hasActiveTask?: (streetlightId: number) => boolean;
}) {
  const { data: alerts = [], isLoading } = useGetPredictiveAlertsQuery(undefined, {
    pollingInterval: 15000,
  });
  const [resolveAlert, { isLoading: isResolving }] = useResolvePredictiveAlertMutation();

  const activeAlerts = alerts.filter((a) => !a.is_resolved);

  if (isLoading) return null;

  if (activeAlerts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-emerald-700 dark:text-emerald-400">System Nominal</h3>
        <p className="mt-2 text-muted-foreground">All nodes are operating within predicted safe parameters. No proactive maintenance required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-orange-500" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-zinc-950">
              {activeAlerts.length}
            </span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Intelligence Warnings</h3>
        </div>
        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-3 py-1">
          Requires Attention
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
        {activeAlerts.map((alert) => {
          const pmNode = rows.find((r) => r.streetlight_id === alert.streetlight_id);
          const config = urgencyConfig[alert.urgency] || urgencyConfig.low;
          const alreadyScheduled = hasActiveTask ? hasActiveTask(alert.streetlight_id) : false;
          
          const urgencyStyles = {
            critical: "bg-red-500/5 border-red-500/20 hover:bg-red-500/10",
            high: "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10",
            medium: "bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10",
          }[alert.urgency as "critical" | "high" | "medium"] || "bg-zinc-500/5 border-zinc-500/20";

          return (
            <div
              key={alert.id}
              className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${urgencyStyles} backdrop-blur-md`}
            >
              {/* Status Indicator Bar */}
              <div className={`absolute inset-y-0 left-0 w-1.5 ${
                alert.urgency === 'critical' ? 'bg-red-500' : alert.urgency === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
              }`} />

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                        {alert.urgency} Alert
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {pmNode?.nodeName || `Node #${alert.streetlight_id}`}
                    </h4>
                  </div>
                  <div className={`rounded-lg p-2 ${config.bg} ${config.color}`}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {pmNode && (
                      alreadyScheduled ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 py-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      ) : (
                        <RoleGate allowedRoles={["admin", "operator"]}>
                          <ScheduleMaintenanceDialog
                            nodeName={pmNode.nodeName}
                            predictedFailureDate={pmNode.predicted_failure_date}
                            failureProbability={pmNode.failure_probability}
                            urgencyColorClass={config.color}
                            onSchedule={(args) => onScheduleMaintenance(pmNode, args)}
                            triggerClassName="bg-primary/10 text-primary hover:bg-primary hover:text-white border-none h-9 px-4 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
                          />
                        </RoleGate>
                      )
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                    disabled={isResolving}
                    className="h-9 w-9 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground transition-all"
                    title="Acknowledge Warning"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
