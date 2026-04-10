import type { Alert } from "@/lib/redux/api/alertApi";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

export const sourceTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  FAULT: {
    label: "Fault",
    color: "text-red-500 border-red-500/30",
    bg: "bg-red-500/10",
  },
  PREDICTIVE: {
    label: "Predictive",
    color: "text-violet-500 border-violet-500/30",
    bg: "bg-violet-500/10",
  },
};

export const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  assigned: { label: "Assigned", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "default" },
};

export const priorityColors: Record<string, string> = {
  critical: "border-red-500 text-red-500 bg-red-500/10",
  high: "border-orange-500 text-orange-500 bg-orange-500/10",
  medium: "border-yellow-500 text-yellow-500 bg-yellow-500/10",
  low: "border-emerald-500 text-emerald-500 bg-emerald-500/10",
};

export function indexAlertsById(alerts: Alert[]) {
  const m = new Map<number, Alert>();
  for (const a of alerts) m.set(a.id, a);
  return m;
}

export function indexStreetlightsById(streetlights: Streetlight[]) {
  const m = new Map<number, Streetlight>();
  for (const s of streetlights) m.set(s.id, s);
  return m;
}

