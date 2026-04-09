"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  BrainCircuit,
  AlertCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { useGetStreetlightsQuery } from "@/lib/redux/api/streetlightApi";
import { useGetPredictiveMaintenanceLogsQuery } from "@/lib/redux/api/predictiveMaintenanceApi";

const COLORS = {
  low: "#10b981",    // emerald-500
  medium: "#eab308", // yellow-500
  high: "#f97316",   // orange-500
  critical: "#ef4444", // red-500
};

export default function AnalyticsPage() {
  const { data: streetlights = [], isLoading: loadingLights } = useGetStreetlightsQuery(undefined, {
    pollingInterval: 15000,
  });
  
  const { data: pmLogs = [], isLoading: loadingLogs } = useGetPredictiveMaintenanceLogsQuery(undefined, {
    pollingInterval: 15000,
  });

  const [filter, setFilter] = useState<string>("ALL");
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Force re-evaluation of time-based offline logic every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Join streetlights with their PM logs
  const mergedNodes = useMemo(() => {
    return streetlights.map((light) => {
      const pm = pmLogs.find((log) => log.streetlight_id === light.id);
      
      let isOffline = false;
      if (pm && pm.last_updated) {
        // Enforce UTC parsing by appending 'Z' if missing (Python naive utcnow)
        const dateStr = pm.last_updated.endsWith('Z') ? pm.last_updated : `${pm.last_updated}Z`;
        const lastUpdated = new Date(dateStr);
        if (nowTick - lastUpdated.getTime() > 120_000) {
          isOffline = true;
        }
      } else {
        // If there is no PM data, we might consider it offline or pending data
        isOffline = true;
      }

      return {
        ...light,
        pmData: pm || null,
        statusLevel: pm ? pm.urgency_level : "low",
        isOffline,
      };
    }).filter(node => {
      if (filter === "ALL") return true;
      if (filter === "OFFLINE") return node.isOffline;
      return !node.isOffline && node.statusLevel === filter.toLowerCase();
    });
  }, [streetlights, pmLogs, filter, nowTick]);

  // Summaries
  const totalNodes = streetlights.length;
  const criticalC = streetlights.filter(l => {
    const pm = pmLogs.find(p => p.streetlight_id === l.id);
    if (!pm) return false;
    const dateStr = pm.last_updated.endsWith('Z') ? pm.last_updated : `${pm.last_updated}Z`;
    const isOffline = nowTick - new Date(dateStr).getTime() > 120_000;
    if (isOffline) return false;
    return pm.urgency_level === "critical" || pm.urgency_level === "high";
  }).length;
  
  const warningC = streetlights.filter(l => {
    const pm = pmLogs.find(p => p.streetlight_id === l.id);
    if (!pm) return false;
    const dateStr = pm.last_updated.endsWith('Z') ? pm.last_updated : `${pm.last_updated}Z`;
    const isOffline = nowTick - new Date(dateStr).getTime() > 120_000;
    if (isOffline) return false;
    return pm.urgency_level === "medium";
  }).length;

  const offlineC = streetlights.filter(l => {
    const pm = pmLogs.find(p => p.streetlight_id === l.id);
    if (!pm) return true;
    const dateStr = pm.last_updated.endsWith('Z') ? pm.last_updated : `${pm.last_updated}Z`;
    return nowTick - new Date(dateStr).getTime() > 120_000;
  }).length;
  
  const normalC = totalNodes - criticalC - warningC - offlineC;

  const chartData = [
    { name: "Normal", value: normalC, color: COLORS.low },
    { name: "Warning", value: warningC, color: COLORS.medium },
    { name: "Critical", value: criticalC, color: COLORS.critical },
    { name: "Offline", value: offlineC, color: "#9ca3af" }, // gray-400
  ].filter(d => d.value > 0);

  if (loadingLights || loadingLogs) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">
            Live machine learning maintenance predictions for IoT Nodes.
          </p>
        </div>
        <div className="flex gap-2">
          {["ALL", "CRITICAL", "WARNING", "NORMAL", "OFFLINE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Nodes */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Online Nodes</p>
              <p className="text-3xl font-bold">{totalNodes - offlineC}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-full">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Normal */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-emerald-500">Normal</p>
              <p className="text-3xl font-bold">{normalC}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-500">Warning</p>
              <p className="text-3xl font-bold">{warningC}</p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        {/* Critical */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-500">Critical Failure</p>
              <p className="text-3xl font-bold">{criticalC}</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Status Distribution Pie Chart */}
        <Card className="col-span-1 border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Network Health Summary</CardTitle>
            <CardDescription>Live real-time node distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Node List */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <h3 className="text-xl font-bold px-1">IoT Node Diagnostics</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {mergedNodes.map((node) => {
              const isOffline = node.isOffline;
              const isCritical = !isOffline && ["critical", "high"].includes(node.statusLevel);
              const isWarning = !isOffline && node.statusLevel === "medium";
              const failureProb = node.pmData ? Math.round(node.pmData.failure_probability * 100) : 0;
              const datePredicted = node.pmData ? new Date(node.pmData.predicted_failure_date).toLocaleDateString() : "Healthy";
              let lastUpdatedText = "Unknown";
              if (node.pmData && node.pmData.last_updated) {
                  const dateStr = node.pmData.last_updated.endsWith('Z') ? node.pmData.last_updated : `${node.pmData.last_updated}Z`;
                  lastUpdatedText = new Date(dateStr).toLocaleString();
              }

              return (
                <Card 
                  key={node.id} 
                  className={`overflow-hidden transition-all duration-300 border-l-4 ${
                    isOffline ? 'border-l-gray-400 shadow-gray-400/5 opacity-70 grayscale-[50%]' :
                    isCritical ? 'border-l-red-500 shadow-red-500/10' : 
                    isWarning ? 'border-l-yellow-500 shadow-yellow-500/10' : 
                    'border-l-emerald-500 border-border/50 shadow-sm'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isOffline ? 'bg-gray-400/10 text-gray-500' : isCritical ? 'bg-red-500/10 text-red-500' : isWarning ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                           <Lightbulb className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="font-bold">{node.name || `Node ${node.id}`}</h4>
                           <p className="text-xs text-muted-foreground">{node.device_id}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`capitalize ${isOffline ? 'text-gray-500 border-gray-400/30 bg-gray-400/5' : isCritical ? 'text-red-500 border-red-500/30 bg-red-500/5' : isWarning ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' : 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'}`}>
                        {isOffline ? "OFFLINE" : isCritical ? "CRITICAL" : isWarning ? "WARNING" : "NORMAL"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Failure Confidence</span>
                          <span className={`${isOffline ? 'text-gray-500' : isCritical ? 'text-red-500 font-bold' : isWarning ? 'text-yellow-500 font-medium' : 'text-emerald-500'}`}>{failureProb}%</span>
                        </div>
                        <Progress value={failureProb} className={`h-1.5 bg-zinc-100 dark:bg-zinc-800 [&>div]:${isOffline ? 'bg-gray-400' : isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                      </div>

                      <div className="flex justify-between items-center text-xs py-2 border-t border-border/50">
                         <span className="text-muted-foreground">Est. Maintenance:</span>
                         <span className={`font-medium ${isOffline ? 'text-gray-500' : isCritical ? 'text-red-500' : ''}`}>{datePredicted}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                         <span>Last Signal:</span>
                         <span>{lastUpdatedText}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
