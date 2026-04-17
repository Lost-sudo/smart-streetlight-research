"use client";

import { AlertTriangle, BrainCircuit, CheckCircle2, ClipboardList } from "lucide-react";

export function StatsCards({
  totalTasks,
  completedTasks,
  uncompleteTasks,
}: {
  totalTasks: number;
  completedTasks: number;
  uncompleteTasks: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-slate-500/5 border border-slate-500/10 rounded-2xl p-5 flex items-center gap-4">
        <div className="bg-slate-600 p-3 rounded-xl shadow-lg shadow-slate-500/20">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tasks</p>
          <h3 className="text-2xl font-bold">{totalTasks}</h3>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 flex items-center gap-4">
        <div className="bg-amber-500 p-3 rounded-xl shadow-lg shadow-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uncomplete</p>
          <h3 className="text-2xl font-bold">{uncompleteTasks}</h3>
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-center gap-4">
        <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
          <h3 className="text-2xl font-bold">{completedTasks}</h3>
        </div>
      </div>
    </div>
  );
}

