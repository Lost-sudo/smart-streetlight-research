import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Sparkles } from "lucide-react";

export function PageHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-10 text-white shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-violet-400 font-medium tracking-wider text-xs uppercase">
            <Sparkles className="h-4 w-4" />
            AI Intelligence Suite
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Predictive Maintenance</h2>
          <p className="text-zinc-400 max-w-2xl text-lg leading-relaxed">
            Harnessing LSTM neural networks to anticipate failures before they occur, ensuring 100% network uptime through proactive interventions.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <Badge variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors gap-2 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
            <BrainCircuit className="h-4 w-4 text-violet-400" />
            LSTM-Powered Core
          </Badge>
          <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Real-time Analysis
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              98.4% Accuracy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
