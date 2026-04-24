"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// Dynamically import the Map component with no SSR
const MapDashboard = dynamic(
  () => import("@/components/map/map-dashboard"),
  { 
    ssr: false,
    loading: () => (
      <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Initializing Map View...</p>
        </div>
        
        {/* Skeleton Overlays to match the new UI */}
        <div className="absolute top-6 left-6 z-10 w-64 h-32 bg-card/50 backdrop-blur-sm rounded-xl animate-pulse" />
        <div className="absolute bottom-10 left-10 z-10 w-[520px] h-20 bg-card/50 backdrop-blur-sm rounded-3xl animate-pulse" />
        <div className="absolute top-6 right-6 bottom-6 z-10 w-80 bg-card/50 backdrop-blur-sm rounded-xl animate-pulse" />
      </div>
    )
  }
);

export default function MapPage() {
  return <MapDashboard />;
}
