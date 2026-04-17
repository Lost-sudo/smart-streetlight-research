"use client";

import { Lightbulb } from "lucide-react";
import { NodeStatusCard } from "@/components/dashboard/overview/parts/node-status-card";
import { type Streetlight } from "@/lib/redux/api/streetlightApi";
import { type PredictiveMaintenanceLog } from "@/lib/redux/api/predictiveMaintenanceApi";

const ONLINE_WINDOW_MS = 120_000;

function isOnlineFromLastUpdated(lastUpdated: unknown, nowMs: number) {
  if (typeof lastUpdated !== "string" || lastUpdated.length === 0) return false;
  const dateStr = lastUpdated.endsWith("Z") ? lastUpdated : `${lastUpdated}Z`;
  const ts = new Date(dateStr).getTime();
  if (!Number.isFinite(ts)) return false;
  return nowMs - ts <= ONLINE_WINDOW_MS;
}

export function NodeStatusGrid({
  streetlights,
  pmByStreetlightId,
  nowTick,
}: {
  streetlights: Streetlight[];
  pmByStreetlightId: Map<number, PredictiveMaintenanceLog>;
  nowTick: number;
}) {
  return (
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
            const pm = pmByStreetlightId.get(node.id);
            const isOnline = isOnlineFromLastUpdated(pm?.last_updated, nowTick);
            return (
              <NodeStatusCard
                key={node.id}
                id={node.id}
                name={node.name}
                status={node.status}
                deviceId={node.device_id}
                isOnline={isOnline}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

