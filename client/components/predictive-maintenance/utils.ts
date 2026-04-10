import type { Alert } from "@/lib/redux/api/alertApi";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

export const urgencyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  medium: { label: "Warning", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  low: { label: "Normal", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

export const priorityColors: Record<string, string> = {
  critical: "border-red-500 text-red-500 bg-red-500/10",
  high: "border-orange-500 text-orange-500 bg-orange-500/10",
  medium: "border-yellow-500 text-yellow-500 bg-yellow-500/10",
  low: "border-emerald-500 text-emerald-500 bg-emerald-500/10",
};

export function indexStreetlightsById(streetlights: Streetlight[]) {
  const m = new Map<number, Streetlight>();
  for (const s of streetlights) m.set(s.id, s);
  return m;
}

export function indexAlertsById(alerts: Alert[]) {
  const m = new Map<number, Alert>();
  for (const a of alerts) m.set(a.id, a);
  return m;
}

