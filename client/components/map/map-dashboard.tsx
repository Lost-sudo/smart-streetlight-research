"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MapPin, AlertTriangle, Settings, Activity, Zap, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useGetStreetlightsQuery, 
  useGetStreetlightLogsQuery,
  type Streetlight 
} from "@/lib/redux/api/streetlightApi";
import { Loader2 } from "lucide-react";

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

// Custom Marker Icons based on status with animations
const createStatusIcon = (status: string) => {
  let color = "#10b981"; // emerald-500 (active)
  let animationClass = "animate-pulse-subtle";
  
  if (status === "faulty") {
    color = "#ef4444"; // red-500
    animationClass = "animate-ping-rapid";
  } else if (status === "maintenance") {
    color = "#f59e0b"; // amber-500
    animationClass = "animate-pulse-amber";
  } else if (status === "inactive") {
    color = "#71717a"; // zinc-500
    animationClass = "";
  }

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="relative flex items-center justify-center">
        ${status === 'faulty' ? `<div class="absolute inset-0 rounded-full bg-red-500 opacity-75 ${animationClass}" style="width: 32px; height: 32px; transform: translate(-8px, -8px);"></div>` : ''}
        ${status === 'active' ? `<div class="absolute inset-0 rounded-full bg-emerald-500 opacity-20 ${animationClass}" style="width: 24px; height: 24px; transform: translate(-4px, -4px);"></div>` : ''}
        ${status === 'maintenance' ? `<div class="absolute inset-0 rounded-full bg-amber-500 opacity-20 ${animationClass}" style="width: 24px; height: 24px; transform: translate(-4px, -4px);"></div>` : ''}
        <div class="relative z-10 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-full shadow-md border-2" style="border-color: ${color}; width: 28px; height: 28px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 6h.01"/><path d="M17 18h.01"/><path d="M10 2l-2 7h6l2-7"/><path d="M6 3.8a4.4 4.4 0 0 1 12 0"/><path d="M12 9v13"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Real data will be fetched from the API

const statusColors: Record<string, { bg: string; text: string; badge: "default" | "destructive" | "secondary" | "outline" }> = {
  active: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400", badge: "default" },
  inactive: { bg: "bg-zinc-100 dark:bg-zinc-800/60", text: "text-zinc-500 dark:text-zinc-400", badge: "secondary" },
  faulty: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-600 dark:text-red-400", badge: "destructive" },
  maintenance: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400", badge: "outline" },
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  const [hasInitialSet, setHasInitialSet] = useState(false);

  useEffect(() => {
    if (!hasInitialSet && center[0] !== 0) {
      map.setView(center, zoom);
      setHasInitialSet(true);
    }
  }, [center, zoom, map, hasInitialSet]);

  return null;
}

export default function MapDashboard() {
  const [selectedNode, setSelectedNode] = useState<Streetlight | null>(null);

  const { data: streetlights = [], isLoading: isLoadingStreetlights, isError: isErrorStreetlights } = useGetStreetlightsQuery();
  
  const { data: logs, isLoading: isLoadingLogs } = useGetStreetlightLogsQuery(
    { id: selectedNode?.id as number, limit: 1 },
    { skip: !selectedNode }
  );

  const latestLog = logs && logs.length > 0 ? logs[0] : null;

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Center the map on the first streetlight or Cantilan center
  const center = useMemo<[number, number]>(() => {
    return streetlights.length > 0 
      ? [streetlights[0].latitude, streetlights[0].longitude] 
      : [9.335583, 125.976972];
  }, [streetlights.length === 0]); // Only re-calculate when transitioning from empty to loaded

  const zoom = 15;

  if (isLoadingStreetlights) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 pt-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading map data...</span>
      </div>
    );
  }

  if (isErrorStreetlights) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 pt-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-bold">Failed to load streetlights</h3>
          <p className="text-muted-foreground">Please check your connection or try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style jsx global>{`
        @keyframes ping-rapid {
          0% { transform: scale(1); opacity: 0.8; }
          70%, 100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-ping-rapid {
          animation: ping-rapid 0.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.5); opacity: 0.4; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        @keyframes pulse-amber {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.4); opacity: 0.35; }
        }
        .animate-pulse-amber {
          animation: pulse-amber 2s ease-in-out infinite;
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
        .dark .leaflet-container {
          background: #09090b !important;
        }
      `}</style>
      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-auto z-[1000] pointer-events-none md:max-w-sm">
        <Card className="p-4 md:p-5 bg-card/80 backdrop-blur-md border-none shadow-2xl pointer-events-auto">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Interactive Map</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Real-time geographical visualization of streetlight nodes.</p>
          
          <div className="mt-4 flex flex-wrap gap-1.5 md:gap-2">
            {Object.entries(statusColors).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-background/50 text-[9px] md:text-[10px]">
                <div className={cn("h-1.5 w-1.5 rounded-full", status === "active" ? "bg-emerald-500" : status === "faulty" ? "bg-red-500" : status === "maintenance" ? "bg-amber-500" : "bg-zinc-500")} />
                <span className="capitalize">{status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary Stats Overlay */}
      <div className={cn(
        "absolute bottom-4 left-4 right-4 md:bottom-10 md:left-10 md:right-auto z-[1000] pointer-events-none transition-all duration-300",
        selectedNode && "bottom-[280px] md:bottom-10" // Move up on mobile when node is selected
      )}>
        <div className="px-4 py-3 md:px-6 md:py-4 bg-card/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto flex flex-row items-center gap-4 md:gap-8 rounded-2xl md:rounded-3xl w-full md:w-fit overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total</span>
            <span className="text-lg md:text-2xl font-black leading-none mt-1">{streetlights.length}</span>
          </div>
          
          <div className="h-8 md:h-10 w-px bg-border/60 shrink-0" />
          
          <div className="flex flex-row items-center gap-4 md:gap-8">
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-[8px] md:text-[10px] text-emerald-500 uppercase font-black tracking-widest">Active</span>
              <span className="text-lg md:text-2xl font-black text-emerald-500/90 leading-none mt-1">{streetlights.filter(n => n.status === 'active').length}</span>
            </div>
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-black tracking-widest">Inact.</span>
              <span className="text-lg md:text-2xl font-black text-zinc-500/90 leading-none mt-1">{streetlights.filter(n => n.status === 'inactive').length}</span>
            </div>
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-[8px] md:text-[10px] text-red-500 uppercase font-black tracking-widest">Faulty</span>
              <span className="text-lg md:text-2xl font-black text-red-500/90 leading-none mt-1">{streetlights.filter(n => n.status === 'faulty').length}</span>
            </div>
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-[8px] md:text-[10px] text-amber-500 uppercase font-black tracking-widest">Maint.</span>
              <span className="text-lg md:text-2xl font-black text-amber-500/90 leading-none mt-1">{streetlights.filter(n => n.status === 'maintenance').length}</span>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {streetlights.map((node) => (
          <Marker
            key={node.id}
            position={[node.latitude, node.longitude]}
            icon={createStatusIcon(node.status)}
            eventHandlers={{
              click: () => setSelectedNode(node),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-bold text-sm">{node.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-2">{node.device_id || 'No ID'}</p>
                <Badge variant={statusColors[node.status]?.badge || "default"} className="text-[10px] h-4">
                  {node.status}
                </Badge>
              </div>
            </Popup>
          </Marker>
        ))}
        <ChangeView center={center} zoom={zoom} />
      </MapContainer>

      {/* Floating Detail Panel */}
      <div className={cn(
        "absolute z-[1001] pointer-events-none transition-all duration-500 ease-in-out",
        "bottom-0 left-0 right-0 md:top-6 md:right-6 md:bottom-6 md:left-auto md:w-80",
        selectedNode 
          ? "translate-y-0 opacity-100" 
          : "translate-y-full opacity-0 md:translate-y-0 md:opacity-0 md:pointer-events-none"
      )}>
        <Card className="h-[320px] md:h-full border-none shadow-2xl bg-card/80 backdrop-blur-md pointer-events-auto flex flex-col overflow-hidden rounded-t-3xl md:rounded-xl">
          <CardHeader className="pb-3 border-b bg-muted/30 relative">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Node Details
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedNode ? "Detailed information for the selected node" : "Select a node on the map to view details"}
            </CardDescription>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted md:hidden"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", statusColors[selectedNode.status].bg)}>
                    <Lightbulb className={cn("h-5 w-5", statusColors[selectedNode.status].text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{selectedNode.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{selectedNode.device_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-md border bg-background/50">
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 mb-1 uppercase font-bold">
                      <Zap className="h-3 w-3" /> Status
                    </p>
                    <Badge variant={statusColors[selectedNode.status].badge} className="text-[9px] capitalize py-0 h-4">
                      {selectedNode.status}
                    </Badge>
                  </div>
                  <div className="p-2 rounded-md border bg-background/50">
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 mb-1 uppercase font-bold">
                      <Settings className="h-3 w-3" /> Model
                    </p>
                    <p className="text-[10px] font-semibold truncate">{selectedNode.model_info}</p>
                  </div>
                  <div className="p-2 rounded-md border bg-background/50">
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 mb-1 uppercase font-bold">
                      <MapPin className="h-3 w-3" /> Coordinates
                    </p>
                    <p className="text-[9px] font-mono leading-tight">
                      {selectedNode.latitude.toFixed(4)}, {selectedNode.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-2 rounded-md border bg-background/50">
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 mb-1 uppercase font-bold">
                      <Sun className="h-3 w-3" /> LDR Light
                    </p>
                    <p className="text-[10px] font-semibold">
                      {isLoadingLogs ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : latestLog ? (
                        `${latestLog.light_intensity} lx`
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-[10px] mb-2 uppercase font-bold text-muted-foreground">
                    <span>Power Consumption</span>
                    <span className="text-foreground">{isLoadingLogs ? '...' : latestLog ? `${latestLog.power_consumption.toFixed(1)} W` : '0.0 W'}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ 
                        width: latestLog 
                          ? `${Math.min((latestLog.power_consumption / 150) * 100, 100)}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-[10px] font-medium leading-tight text-foreground">Status check: {selectedNode.status}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date().toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium">No node selected</p>
                <p className="text-xs text-muted-foreground max-w-[160px] mt-1">Select a streetlight marker on the map to see its real-time telemetry.</p>
              </div>
            )}
          </CardContent>
          {selectedNode && (
            <div className="p-4 border-t bg-muted/20">
              <button className="w-full py-2 bg-primary text-primary-foreground rounded-md text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                View Detailed Logs
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
