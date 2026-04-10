"use client";

import { cn } from "@/lib/utils";

const FILTERS = ["ALL", "CRITICAL", "WARNING", "NORMAL", "OFFLINE"] as const;
export type AnalyticsFilter = (typeof FILTERS)[number];

export function FilterChips({
  filter,
  onChange,
}: {
  filter: AnalyticsFilter;
  onChange: (f: AnalyticsFilter) => void;
}) {
  return (
    <div className="flex gap-2">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full transition-colors",
            filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

