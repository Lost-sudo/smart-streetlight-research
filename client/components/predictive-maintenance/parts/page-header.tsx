import { Badge } from "@/components/ui/badge";
import { BrainCircuit } from "lucide-react";

export function PageHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Predictive Maintenance</h2>
        <p className="text-muted-foreground italic">Proactive maintenance scheduling based on LSTM failure predictions.</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1 px-3 py-1.5 text-xs font-semibold">
          <BrainCircuit className="h-3.5 w-3.5" />
          LSTM-Powered
        </Badge>
      </div>
    </div>
  );
}

