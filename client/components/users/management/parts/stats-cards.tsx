"use client";

import { History as HistoryIcon, Lock, Shield, Users } from "lucide-react";

export function StatsCards({
  adminCount,
  activeCount,
  totalCount,
}: {
  adminCount: number;
  activeCount: number;
  totalCount: number;
}) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Admin Accounts</p>
          <h3 className="text-2xl font-bold">{adminCount}</h3>
        </div>
      </div>
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-blue-500/10 p-3 rounded-xl">
          <Users className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Active Users</p>
          <h3 className="text-2xl font-bold">{activeCount}</h3>
        </div>
      </div>
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-emerald-500/10 p-3 rounded-xl">
          <Lock className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Security Status</p>
          <h3 className="text-2xl font-bold">Encrypted</h3>
        </div>
      </div>
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-zinc-500/10 p-3 rounded-xl text-zinc-500">
          <HistoryIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Registry</p>
          <h3 className="text-2xl font-bold">{totalCount} Users</h3>
        </div>
      </div>
    </div>
  );
}

