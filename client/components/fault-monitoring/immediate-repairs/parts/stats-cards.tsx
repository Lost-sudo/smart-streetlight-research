import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, Wrench } from "lucide-react";

export function StatsCards({
  pendingCount,
  activeCount,
  resolvedToday,
}: {
  pendingCount: number;
  activeCount: number;
  resolvedToday: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Pending Repairs</p>
          <h3 className="text-2xl font-bold">{pendingCount}</h3>
        </div>
      </div>

      <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/20">
          <Wrench className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Active Work</p>
          <h3 className="text-2xl font-bold">{activeCount}</h3>
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
          <h3 className="text-2xl font-bold">{resolvedToday}</h3>
        </div>
      </div>
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
  const iconClass =
    variant === "pending"
      ? "text-orange-500 p-1 bg-orange-500/10"
      : "text-blue-500 p-1 bg-blue-500/10";

  return (
    <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50">
      <Icon className={`h-6 w-6 rounded-md ${iconClass}`} />
      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <Badge variant="secondary" className="ml-auto bg-muted">
        {count}
      </Badge>
    </div>
  );
}

