"use client";

import { useGetPredictiveAlertsQuery, useResolvePredictiveAlertMutation } from "@/lib/redux/api/predictiveAlertApi";
import { AlertTriangle, CheckCircle, Lightbulb, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type PredictionRow } from "./predictions-table";
import { ScheduleMaintenanceDialog } from "./schedule-maintenance-dialog";
import { urgencyConfig } from "../utils";
import { RoleGate } from "@/components/auth/role-gate";

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
      <div className="space-y-4 mb-8 h-full flex flex-col">
        <h3 className="text-lg font-semibold flex items-center text-green-600 dark:text-green-500">
          <CheckCircle className="mr-2 h-5 w-5" />
          Active AI Warnings
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed text-center text-muted-foreground bg-white/50 dark:bg-zinc-900/50">
          <PartyPopper className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
          <p className="font-medium">No Active Alerts</p>
          <p className="text-sm mt-1">All streetlights are currently operating within safe parameters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-semibold flex items-center text-orange-600 dark:text-orange-400">
        <AlertTriangle className="mr-2 h-5 w-5" />
        Active AI Warnings
      </h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {activeAlerts.map((alert) => {
          const pmNode = rows.find((r) => r.streetlight_id === alert.streetlight_id);
          const config = urgencyConfig[alert.urgency] || urgencyConfig.low;
          const alreadyScheduled = hasActiveTask ? hasActiveTask(alert.streetlight_id) : false;
          
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                alert.urgency === "high"
                  ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  : "bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-bold text-sm flex items-center gap-2">
                    <Lightbulb className={`h-4 w-4 ${config.color}`} />
                    {pmNode?.nodeName || `Node #${alert.streetlight_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="text-[10px] text-muted-foreground font-mono">
                  {new Date(alert.created_at).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  {pmNode && (
                    alreadyScheduled ? (
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                        Scheduled
                      </span>
                    ) : (
                      <RoleGate allowedRoles={["admin", "operator"]}>
                        <ScheduleMaintenanceDialog
                          nodeName={pmNode.nodeName}
                          predictedFailureDate={pmNode.predicted_failure_date}
                          failureProbability={pmNode.failure_probability}
                          urgencyColorClass={config.color}
                          onSchedule={(args) => onScheduleMaintenance(pmNode, args)}
                          triggerClassName="text-xs h-8 px-3 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900 dark:hover:text-violet-300"
                        />
                      </RoleGate>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => resolveAlert(alert.id)}
                    disabled={isResolving}
                    className="h-8 w-8 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-400"
                    title="Acknowledge Warning"
                  >
                    <CheckCircle className="h-4 w-4" />
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
