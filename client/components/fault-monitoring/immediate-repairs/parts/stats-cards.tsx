"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Wrench, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  description?: string;
}

function StatCard({ label, value, icon, colorClass, bgClass, description }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-none shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
      <div className={`absolute top-0 left-0 w-full h-1 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            <h3 className="text-3xl font-extrabold tracking-tight">{value}</h3>
            {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`p-3.5 rounded-2xl ${bgClass} ${colorClass} transition-transform duration-300 group-hover:scale-110 shadow-inner`}>
             {/* @ts-ignore */}
             {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
          </div>
        </div>
      </CardContent>
      <div className={`absolute -right-4 -bottom-4 h-16 w-16 opacity-[0.03] transition-opacity group-hover:opacity-[0.08] ${colorClass}`}>
        {icon}
      </div>
    </Card>
  );
}

export function StatsCards({
  pendingCount,
  activeCount,
  resolvedToday,
  totalTasks,
  openTasks,
  completedTasks,
}: {
  pendingCount: number;
  activeCount: number;
  resolvedToday: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
}) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard 
        label="Total Tasks" 
        value={totalTasks} 
        icon={<ClipboardList />} 
        colorClass="text-zinc-500" 
        bgClass="bg-zinc-500/10"
        description="Lifetime repair records"
      />
      <StatCard 
        label="Pending" 
        value={pendingCount} 
        icon={<Clock />} 
        colorClass="text-blue-500" 
        bgClass="bg-blue-500/10"
        description="Awaiting assignment"
      />
      <StatCard 
        label="In Progress" 
        value={activeCount} 
        icon={<Wrench />} 
        colorClass="text-orange-500" 
        bgClass="bg-orange-500/10"
        description="Actively being repaired"
      />
      <StatCard 
        label="Open Faults" 
        value={openTasks} 
        icon={<AlertTriangle />} 
        colorClass="text-amber-500" 
        bgClass="bg-amber-500/10"
        description="Total unresolved issues"
      />
      <StatCard 
        label="Today" 
        value={resolvedToday} 
        icon={<Zap />} 
        colorClass="text-emerald-500" 
        bgClass="bg-emerald-500/10"
        description="Resolved in last 24h"
      />
      <StatCard 
        label="Completed" 
        value={completedTasks} 
        icon={<CheckCircle2 />} 
        colorClass="text-emerald-600" 
        bgClass="bg-emerald-600/10"
        description="Total successful repairs"
      />
    </div>
  );
}

export function TaskSectionHeader({
  variant,
  title,
  count,
}: {
  variant: "pending" | "active";
  title: string;
  count: number;
}) {
  const Icon = variant === "pending" ? AlertTriangle : Wrench;
  const colorClass = variant === "pending" ? "text-orange-500 bg-orange-500/10" : "text-blue-500 bg-blue-500/10";

  return (
    <div className="flex items-center gap-3 px-2 py-4">
      <div className={`p-2 rounded-xl ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
      <Badge variant="outline" className="ml-3 bg-muted/50 font-bold px-3 py-1 rounded-full border-2">
        {count}
      </Badge>
    </div>
  );
}
