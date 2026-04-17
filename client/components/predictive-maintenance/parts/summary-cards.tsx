import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CalendarClock, ShieldAlert, CheckCircle2 } from "lucide-react";

export function SummaryCards({
  criticalCount,
  warningCount,
  scheduledCount,
  completedCount,
}: {
  criticalCount: number;
  warningCount: number;
  scheduledCount: number;
  completedCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-red-500 p-3 rounded-xl shadow-lg shadow-red-500/20">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nodes at Risk</p>
            <h3 className="text-2xl font-bold">{criticalCount}</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-yellow-500 p-3 rounded-xl shadow-lg shadow-yellow-500/20">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Warning Nodes</p>
            <h3 className="text-2xl font-bold">{warningCount}</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
            <CalendarClock className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Scheduled Tasks</p>
            <h3 className="text-2xl font-bold">{scheduledCount}</h3>
          </div>
        </CardContent>
      </Card>
      <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
            <h3 className="text-2xl font-bold">{completedCount}</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

