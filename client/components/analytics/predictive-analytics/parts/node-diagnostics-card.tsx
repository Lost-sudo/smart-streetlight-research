"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Lightbulb, Calendar, Clock, ArrowRight } from "lucide-react";

type Variant = "offline" | "critical" | "warning" | "normal";

function variantClasses(v: Variant) {
  switch (v) {
    case "offline":
      return {
        card: "border-l-zinc-400 dark:border-l-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/50",
        iconWrap: "bg-zinc-200 text-zinc-500 dark:bg-zinc-800",
        badge: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
        bar: "bg-zinc-200 dark:bg-zinc-700",
        accent: "text-zinc-500"
      };
    case "critical":
      return {
        card: "border-l-red-500 bg-red-50/30 dark:bg-red-950/10",
        iconWrap: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
        bar: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
        accent: "text-red-600 dark:text-red-400"
      };
    case "warning":
      return {
        card: "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10",
        iconWrap: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        badge: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800",
        bar: "bg-yellow-500",
        accent: "text-yellow-700 dark:text-yellow-400"
      };
    default:
      return {
        card: "border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10",
        iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
        bar: "bg-emerald-500",
        accent: "text-emerald-600 dark:text-emerald-400"
      };
  }
}

export function NodeDiagnosticsCard({
  id,
  name,
  deviceId,
  variant,
  failureProbability,
  predictedDateText,
  lastUpdatedText,
}: {
  id: number | string;
  name: string;
  deviceId?: string | null;
  variant: Variant;
  failureProbability: number;
  predictedDateText: string;
  lastUpdatedText: string;
}) {
  const c = variantClasses(variant);

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500 border-l-[6px] shadow-lg hover:shadow-2xl hover:-translate-y-1.5 backdrop-blur-md",
      c.card
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner", c.iconWrap)}>
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold tracking-tight text-foreground">{name || `Node ${id}`}</h4>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{deviceId || "N/A"}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter border-2 shadow-sm", c.badge)}>
            {variant}
          </Badge>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Failure Risk</span>
              <span className={cn("text-xl font-black tabular-nums", c.accent)}>
                {failureProbability}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
               <div 
                className={cn("h-full rounded-full transition-all duration-1000 ease-out", c.bar)} 
                style={{ width: `${failureProbability}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between group/item">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Estimated Failure</span>
              </div>
              <span className={cn("text-xs font-bold", variant === "critical" ? "animate-pulse" : "")}>
                {predictedDateText}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Last Heartbeat</span>
              </div>
              <span className="text-[11px] font-medium text-foreground/80">
                {lastUpdatedText}
              </span>
            </div>
          </div>
        </div>

        {/* Hover Action Overlay (Visual Only) */}
        <div className="absolute right-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform duration-300">
           <ArrowRight className={cn("h-5 w-5", c.accent)} />
        </div>
      </CardContent>
    </Card>
  );
}
