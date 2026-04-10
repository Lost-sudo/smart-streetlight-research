"use client";

import { useEffect, useMemo, useState } from "react";

import { useGetStreetlightsQuery } from "@/lib/redux/api/streetlightApi";
import { useGetPredictiveMaintenanceLogsQuery } from "@/lib/redux/api/predictiveMaintenanceApi";
import { isOfflineFromLastUpdated, parsePossiblyNaiveUtc } from "@/components/analytics/predictive-analytics/utils";
import { FilterChips, type AnalyticsFilter } from "@/components/analytics/predictive-analytics/parts/filter-chips";
import { SummaryCards } from "@/components/analytics/predictive-analytics/parts/summary-cards";
import { NetworkHealthChart } from "@/components/analytics/predictive-analytics/parts/network-health-chart";
import { NodeDiagnosticsCard } from "@/components/analytics/predictive-analytics/parts/node-diagnostics-card";

const COLORS = {
  low: "#10b981", // emerald-500
  medium: "#eab308", // yellow-500
  high: "#f97316", // orange-500
  critical: "#ef4444", // red-500
} as const;

export function PredictiveAnalyticsPage() {
  const { data: streetlights = [], isLoading: loadingLights } = useGetStreetlightsQuery(undefined, {
    pollingInterval: 15000,
  });

  const { data: pmLogs = [], isLoading: loadingLogs } = useGetPredictiveMaintenanceLogsQuery(undefined, {
    pollingInterval: 15000,
  });

  const [filter, setFilter] = useState<AnalyticsFilter>("ALL");
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const pmByStreetlightId = useMemo(() => {
    const m = new Map<number, any>();
    for (const log of pmLogs as any[]) {
      if (log && typeof log.streetlight_id === "number") m.set(log.streetlight_id, log);
    }
    return m;
  }, [pmLogs]);

  const mergedNodes = useMemo(() => {
    return (streetlights as any[])
      .map((light) => {
        const pm = pmByStreetlightId.get(light.id) ?? null;
        const isOffline = isOfflineFromLastUpdated(pm?.last_updated, nowTick);
        return {
          ...light,
          pmData: pm,
          statusLevel: pm ? pm.urgency_level : "low",
          isOffline,
        };
      })
      .filter((node) => {
        if (filter === "ALL") return true;
        if (filter === "OFFLINE") return node.isOffline;
        if (filter === "NORMAL") return !node.isOffline && node.statusLevel === "low";
        if (filter === "WARNING") return !node.isOffline && node.statusLevel === "medium";
        // CRITICAL -> high|critical
        return !node.isOffline && (node.statusLevel === "critical" || node.statusLevel === "high");
      });
  }, [streetlights, pmByStreetlightId, filter, nowTick]);

  const { totalNodes, offlineC, warningC, criticalC, normalC } = useMemo(() => {
    const total = (streetlights as any[]).length;
    let offline = 0;
    let warning = 0;
    let critical = 0;

    for (const l of streetlights as any[]) {
      const pm = pmByStreetlightId.get(l.id);
      const isOffline = isOfflineFromLastUpdated(pm?.last_updated, nowTick);
      if (isOffline) {
        offline++;
        continue;
      }
      if (pm?.urgency_level === "medium") warning++;
      else if (pm?.urgency_level === "critical" || pm?.urgency_level === "high") critical++;
    }

    const normal = total - critical - warning - offline;
    return { totalNodes: total, offlineC: offline, warningC: warning, criticalC: critical, normalC: normal };
  }, [streetlights, pmByStreetlightId, nowTick]);

  const chartData = useMemo(
    () =>
      [
        { name: "Normal", value: normalC, color: COLORS.low },
        { name: "Warning", value: warningC, color: COLORS.medium },
        { name: "Critical", value: criticalC, color: COLORS.critical },
        { name: "Offline", value: offlineC, color: "#9ca3af" }, // gray-400
      ].filter((d) => d.value > 0),
    [normalC, warningC, criticalC, offlineC]
  );

  if (loadingLights || loadingLogs) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">Live machine learning maintenance predictions for IoT Nodes.</p>
        </div>
        <FilterChips filter={filter} onChange={setFilter} />
      </div>

      <SummaryCards onlineCount={totalNodes - offlineC} normalCount={normalC} warningCount={warningC} criticalCount={criticalC} />

      <div className="grid gap-6 md:grid-cols-3">
        <NetworkHealthChart chartData={chartData} />

        <div className="col-span-1 md:col-span-2 space-y-4">
          <h3 className="text-xl font-bold px-1">IoT Node Diagnostics</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {mergedNodes.map((node) => {
              const isOffline = node.isOffline;
              const isCritical = !isOffline && ["critical", "high"].includes(node.statusLevel);
              const isWarning = !isOffline && node.statusLevel === "medium";
              const failureProb = node.pmData ? Math.round(node.pmData.failure_probability * 100) : 0;
              const predictedDateText = node.pmData
                ? new Date(node.pmData.predicted_failure_date).toLocaleDateString()
                : "Healthy";

              const lastUpdatedTs = parsePossiblyNaiveUtc(node.pmData?.last_updated);
              const lastUpdatedText = lastUpdatedTs ? new Date(lastUpdatedTs).toLocaleString() : "Unknown";

              const variant = isOffline ? "offline" : isCritical ? "critical" : isWarning ? "warning" : "normal";

              return (
                <NodeDiagnosticsCard
                  key={node.id}
                  id={node.id}
                  name={node.name || `Node ${node.id}`}
                  deviceId={node.device_id}
                  variant={variant}
                  failureProbability={failureProb}
                  predictedDateText={predictedDateText}
                  lastUpdatedText={lastUpdatedText}
                />
              );
            })}

            {mergedNodes.length === 0 && (
              <div className="col-span-full py-12 text-center border rounded-xl border-dashed">
                <p className="text-muted-foreground">No nodes matching the current filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

