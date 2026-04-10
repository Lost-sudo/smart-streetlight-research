"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

type Variant = "offline" | "critical" | "warning" | "normal";

function variantClasses(v: Variant) {
  switch (v) {
    case "offline":
      return {
        card: "border-l-gray-400 shadow-gray-400/5 opacity-70 grayscale-[50%]",
        iconWrap: "bg-gray-400/10 text-gray-500",
        badge: "text-gray-500 border-gray-400/30 bg-gray-400/5",
        text: "text-gray-500",
        progressBar: "bg-gray-400",
      };
    case "critical":
      return {
        card: "border-l-red-500 shadow-red-500/10",
        iconWrap: "bg-red-500/10 text-red-500",
        badge: "text-red-500 border-red-500/30 bg-red-500/5",
        text: "text-red-500",
        progressBar: "bg-red-500",
      };
    case "warning":
      return {
        card: "border-l-yellow-500 shadow-yellow-500/10",
        iconWrap: "bg-yellow-500/10 text-yellow-500",
        badge: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5",
        text: "text-yellow-500",
        progressBar: "bg-yellow-500",
      };
    default:
      return {
        card: "border-l-emerald-500 border-border/50 shadow-sm",
        iconWrap: "bg-emerald-500/10 text-emerald-500",
        badge: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
        text: "text-emerald-500",
        progressBar: "bg-emerald-500",
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
  const label = variant.toUpperCase();

  return (
    <Card key={id} className={cn("overflow-hidden transition-all duration-300 border-l-4", c.card)}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", c.iconWrap)}>
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">{name || `Node ${id}`}</h4>
              <p className="text-xs text-muted-foreground">{deviceId}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("capitalize", c.badge)}>
            {label}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Failure Confidence</span>
              <span className={cn(variant === "critical" ? "font-bold" : variant === "warning" ? "font-medium" : "", c.text)}>
                {failureProbability}%
              </span>
            </div>
            <Progress
              value={failureProbability}
              className={cn("h-1.5 bg-zinc-100 dark:bg-zinc-800", c.progressBar && `[&>div]:${c.progressBar}`)}
            />
          </div>

          <div className="flex justify-between items-center text-xs py-2 border-t border-border/50">
            <span className="text-muted-foreground">Est. Maintenance:</span>
            <span className={cn("font-medium", variant === "critical" ? c.text : "")}>{predictedDateText}</span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
            <span>Last Signal:</span>
            <span>{lastUpdatedText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

