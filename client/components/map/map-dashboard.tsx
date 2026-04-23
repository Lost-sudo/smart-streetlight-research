"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MapPin, AlertTriangle, Settings, Activity, Zap, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

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

const hardcodedNodes: Streetlight[] = [
  {
    id: 1,
    name: "Cantilan Town Plaza",
    device_id: "SN-CAN-001",
    latitude: 9.3356,
    longitude: 125.9770,
    model_info: "SmartPole v2",
    installation_date: "2024-01-15",
    status: "active",
    is_on: true,
    created_at: "2024-01-15T10:00:00Z",
    has_telemetry: true,
  },
  {
    id: 2,
    name: "Cantilan Public Market",
    device_id: "SN-CAN-002",
    latitude: 9.3365,
    longitude: 125.9780,
    model_info: "SmartPole v2",
    installation_date: "2024-01-20",
    status: "faulty",
    is_on: false,
    created_at: "2024-01-20T11:00:00Z",
    has_telemetry: true,
  },
  {
    id: 3,
    name: "Cantilan Municipal Hall",
    device_id: "SN-CAN-003",
    latitude: 9.3345,
    longitude: 125.9760,
    model_info: "SmartPole v1",
    installation_date: "2023-11-05",
    status: "maintenance",
    is_on: true,
    created_at: "2023-11-05T09:00:00Z",
    has_telemetry: true,
  },
  {
    id: 4,
    name: "San Pedro Street",
    device_id: "SN-CAN-004",
    latitude: 9.3370,
    longitude: 125.9750,
    model_info: "SmartPole v2",
    installation_date: "2024-02-10",
    status: "inactive",
    is_on: false,
    created_at: "2024-02-10T14:00:00Z",
    has_telemetry: false,
  },
  {
    id: 5,
    name: "Cantilan Bayfront",
    device_id: "SN-CAN-005",
    latitude: 9.3330,
    longitude: 125.9790,
    model_info: "SmartPole v2",
    installation_date: "2024-03-01",
    status: "active",
    is_on: true,
    created_at: "2024-03-01T08:30:00Z",
    has_telemetry: true,
  }
];

const statusColors: Record<string, { bg: string; text: string; badge: "default" | "destructive" | "secondary" | "outline" }> = {
  active: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400", badge: "default" },
  inactive: { bg: "bg-zinc-100 dark:bg-zinc-800/60", text: "text-zinc-500 dark:text-zinc-400", badge: "secondary" },
  faulty: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-600 dark:text-red-400", badge: "destructive" },
  maintenance: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400", badge: "outline" },
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapDashboard() {
  const [selectedNode, setSelectedNode] = useState<Streetlight | null>(null);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const center: [number, number] = [9.335583, 125.976972];
  const zoom = 15;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interactive Map</h1>
          <p className="text-muted-foreground">Real-time geographical visualization of streetlight nodes.</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(statusColors).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-card text-xs">
              <div className={cn("h-2 w-2 rounded-full", status === "active" ? "bg-emerald-500" : status === "faulty" ? "bg-red-500" : status === "maintenance" ? "bg-amber-500" : "bg-zinc-500")} />
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <Card className="lg:col-span-3 overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm relative">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hardcodedNodes.map((node) => (
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
                    <p className="text-[10px] text-muted-foreground mb-2">{node.device_id}</p>
                    <Badge variant={statusColors[node.status].badge} className="text-[10px] h-4">
                      {node.status}
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            ))}
            <ChangeView center={center} zoom={zoom} />
          </MapContainer>
        </Card>

        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Node Details
              </CardTitle>
              <CardDescription>
                {selectedNode ? "Detailed information for the selected node" : "Select a node on the map to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", statusColors[selectedNode.status].bg)}>
                      <Lightbulb className={cn("h-5 w-5", statusColors[selectedNode.status].text)} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{selectedNode.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedNode.device_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md border bg-card/30">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <Zap className="h-3 w-3" /> Status
                      </p>
                      <Badge variant={statusColors[selectedNode.status].badge} className="text-[10px] capitalize">
                        {selectedNode.status}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-md border bg-card/30">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <Settings className="h-3 w-3" /> Model
                      </p>
                      <p className="text-xs font-semibold">{selectedNode.model_info}</p>
                    </div>
                    <div className="p-3 rounded-md border bg-card/30">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="h-3 w-3" /> Coordinates
                      </p>
                      <p className="text-[10px] font-mono leading-tight">
                        {selectedNode.latitude.toFixed(4)}<br />
                        {selectedNode.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div className="p-3 rounded-md border bg-card/30">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <Sun className="h-3 w-3" /> LDR Light
                      </p>
                      <p className="text-xs font-semibold">{selectedNode.status === 'active' ? '450 lx' : '—'}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Power Consumption</span>
                      <span className="font-semibold">{selectedNode.is_on ? '34.5 W' : '0.0 W'}</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: selectedNode.is_on ? '70%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                  <MapPin className="h-12 w-12 mb-2" />
                  <p className="text-sm">No node selected</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Nodes</span>
                <span className="font-bold">{hardcodedNodes.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-500">Active</span>
                <span className="font-bold">{hardcodedNodes.filter(n => n.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-500">Faulty</span>
                <span className="font-bold">{hardcodedNodes.filter(n => n.status === 'faulty').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-500">Maintenance</span>
                <span className="font-bold">{hardcodedNodes.filter(n => n.status === 'maintenance').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
