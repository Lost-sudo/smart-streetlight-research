"use client";

import { Activity, AlertCircle, AlertTriangle, CalendarClock, CheckCircle2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  description?: string;
  trend?: string;
}

function StatCard({ label, value, icon, colorClass, bgClass, description, trend }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
      <div className={`absolute top-0 left-0 w-full h-1 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`} />
      <CardContent className="p-4 lg:p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight">{value}</h3>
              {trend && <span className="text-[10px] font-bold text-emerald-500">{trend}</span>}
            </div>
            {description && <p className="hidden lg:block text-[10px] text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`p-2 lg:p-3 rounded-xl lg:rounded-2xl ${bgClass} ${colorClass} transition-transform duration-300 group-hover:scale-110 shadow-inner`}>
            {/* Reduced icon size for better fit */}
            {/* @ts-ignore */}
            {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 lg:h-6 lg:h-6" })}
          </div>
        </div>
      </CardContent>
      {/* Decorative element */}
      <div className={`absolute -right-4 -bottom-4 h-12 w-12 lg:h-16 lg:w-16 opacity-[0.03] transition-opacity group-hover:opacity-[0.08] ${colorClass}`}>
        {icon}
      </div>
    </Card>
  );
}

import React from "react";

export function SummaryCards({
  onlineCount,
  normalCount,
  warningCount,
  criticalCount,
  scheduledCount,
  completedTasksCount,
}: {
  onlineCount: number;
  normalCount: number;
  warningCount: number;
  criticalCount: number;
  scheduledCount?: number;
  completedTasksCount?: number;
}) {
  const hasMaintenanceStats = typeof scheduledCount === "number" && typeof completedTasksCount === "number";

  return (
    <div className={`grid gap-4 lg:gap-6 ${hasMaintenanceStats ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" : "grid-cols-2 lg:grid-cols-4"}`}>
      <StatCard 
        label="Online" 
        value={onlineCount} 
        icon={<Activity />} 
        colorClass="text-blue-500" 
        bgClass="bg-blue-500/10"
        description="Active nodes in network"
      />
      <StatCard 
        label="Stable" 
        value={normalCount} 
        icon={<CheckCircle2 />} 
        colorClass="text-emerald-500" 
        bgClass="bg-emerald-500/10"
        description="Operating at peak health"
      />
      <StatCard 
        label="Warnings" 
        value={warningCount} 
        icon={<AlertCircle />} 
        colorClass="text-yellow-500" 
        bgClass="bg-yellow-500/10"
        description="Potential issues detected"
      />
      <StatCard 
        label="Critical" 
        value={criticalCount} 
        icon={<AlertTriangle />} 
        colorClass="text-red-500" 
        bgClass="bg-red-500/10"
        description="Urgent repairs required"
      />
      
      {hasMaintenanceStats && (
        <>
          <StatCard 
            label="Scheduled" 
            value={scheduledCount} 
            icon={<CalendarClock />} 
            colorClass="text-violet-500" 
            bgClass="bg-violet-500/10"
            description="Preventative tasks"
          />
          <StatCard 
            label="Resolved" 
            value={completedTasksCount} 
            icon={<Zap />} 
            colorClass="text-indigo-500" 
            bgClass="bg-indigo-500/10"
            description="Total lifetime repairs"
          />
        </>
      )}
    </div>
  );
}
