import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History as HistoryIcon, Search, ShieldAlert, Sparkles } from "lucide-react";

export function PageHeader({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-10 text-white shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl" />
      
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-medium tracking-wider text-xs uppercase">
            <ShieldAlert className="h-4 w-4" />
            Critical Response Unit
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Fault Monitoring</h2>
          <p className="text-zinc-400 max-w-xl text-lg leading-relaxed">
            Real-time diagnostics and rapid deployment center. Responding to network failures with precision and speed.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-orange-400 transition-colors" />
            <Input
              placeholder="Search nodes or fault types..."
              className="pl-11 pr-4 w-full sm:w-[320px] bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500/50 rounded-2xl h-12 transition-all"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
            <HistoryIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
