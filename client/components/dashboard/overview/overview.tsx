"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { useGetStreetlightsQuery } from "@/lib/redux/api/streetlightApi";
import { useGetPredictiveMaintenanceLogsQuery } from "@/lib/redux/api/predictiveMaintenanceApi";
import { DashboardHeader } from "@/components/dashboard/overview/parts/dashboard-header";
import { SummaryCards } from "@/components/dashboard/overview/parts/summary-cards";
import { NodeStatusGrid } from "@/components/dashboard/overview/parts/node-status-grid";

const ONLINE_WINDOW_MS = 120_000;

function getOnlineStatus(lastUpdated: unknown, nowMs: number) {
  if (typeof lastUpdated !== "string" || lastUpdated.length === 0) return false;
  const dateStr = lastUpdated.endsWith("Z") ? lastUpdated : `${lastUpdated}Z`;
  const ts = new Date(dateStr).getTime();
  if (!Number.isFinite(ts)) return false;
  return nowMs - ts <= ONLINE_WINDOW_MS;
}

export function DashboardOverview() {
  const { data: streetlights = [], isLoading: isStreetlightsLoading } = useGetStreetlightsQuery(undefined, {
    pollingInterval: 15000,
  });
  const { data: pmLogs = [], isLoading: isLogsLoading } = useGetPredictiveMaintenanceLogsQuery(undefined, {
    pollingInterval: 15000,
  });

  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const pmByStreetlightId = useMemo(() => {
    const m = new Map<number, any>();
    for (const log of pmLogs as any[]) {
      if (log && typeof log.streetlight_id === "number") {
        m.set(log.streetlight_id, log);
      }
    }
    return m;
  }, [pmLogs]);

  const metrics = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let faulty = 0;
    let maintenance = 0;

    for (const n of streetlights as any[]) {
      const pm = pmByStreetlightId.get(n.id);
      const isOnline = getOnlineStatus(pm?.last_updated, nowTick);

      if (n.status === "faulty") faulty++;
      else if (n.status === "maintenance") maintenance++;
      else if (n.status === "inactive" || (n.status === "active" && !isOnline)) inactive++;
      else active++;
    }

    return {
      activeNodes: active,
      inactiveNodes: inactive,
      faultyNodes: faulty,
      maintenanceNodes: maintenance,
      totalNodes: (streetlights as any[]).length,
    };
  }, [streetlights, pmByStreetlightId, nowTick]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  if (isStreetlightsLoading || isLogsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <DashboardHeader today={today} />
      <SummaryCards {...metrics} />
      <NodeStatusGrid streetlights={streetlights as any[]} pmByStreetlightId={pmByStreetlightId} nowTick={nowTick} />
    </div>
  );
}

