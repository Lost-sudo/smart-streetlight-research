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
        
        {/* Skeleton Overlays to match the new responsive UI */}
        <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-auto z-10 md:w-64 h-32 bg-card/50 backdrop-blur-sm rounded-xl animate-pulse" />
        <div className="absolute bottom-4 left-4 right-4 md:bottom-10 md:left-10 md:right-auto z-10 h-20 md:w-[520px] bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-3xl animate-pulse" />
        <div className="hidden md:block absolute top-6 right-6 bottom-6 z-10 w-80 bg-card/50 backdrop-blur-sm rounded-xl animate-pulse" />
      </div>
    )
  }
);

export default function MapPage() {
  return <MapDashboard />;
}
