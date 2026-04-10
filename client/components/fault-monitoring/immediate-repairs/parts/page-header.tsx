import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History as HistoryIcon, Search } from "lucide-react";

export function PageHeader({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fault Monitoring</h2>
        <p className="text-muted-foreground italic">
          Reactive workflow for real-time fault detection and immediate repairs.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes or faults..."
            className="pl-9 w-[280px] bg-card border-none"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="bg-card border-none">
          <HistoryIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

