"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the Map component with no SSR
const MapDashboard = dynamic(
  () => import("@/components/map/map-dashboard"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          <Skeleton className="lg:col-span-3 h-full rounded-xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  return <MapDashboard />;
}
