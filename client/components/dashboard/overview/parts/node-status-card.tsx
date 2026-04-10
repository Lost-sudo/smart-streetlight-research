"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Wifi, WifiOff, Wrench, Zap } from "lucide-react";

export function NodeStatusCard({
  id,
  name,
  status,
  deviceId,
  isOnline,
}: {
  id: number | string;
  name: string;
  status: string;
  deviceId?: string | null;
  isOnline: boolean;
}) {
  const isActive = status === "active" && isOnline;
  const isFaulty = status === "faulty";
  const isMaintenance = status === "maintenance";

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

  return (
    <Card key={id} className={`overflow-hidden border-t-4 ${borderColor} hover:shadow-lg transition-all duration-200 group`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">{name}</CardTitle>
        <StatusIcon className={`h-5 w-5 ${statusColor}`} />
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`${statusColor} border-current gap-1 capitalize py-0 px-2 text-[10px]`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            {status === "active" && !isOnline ? "offline" : status}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            {isOnline ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-red-400" />}
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="font-mono text-[10px]">{deviceId || "No ID"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

