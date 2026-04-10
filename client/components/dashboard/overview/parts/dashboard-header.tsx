"use client";

export function DashboardHeader({ today }: { today: string }) {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Live System Status</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">{today}</div>
      </div>
    </div>
  );
}

