import { CheckCircle2, Info } from "lucide-react";

export function NotificationBanner({
  notification,
}: {
  notification: { message: string; type: "success" | "info" } | null;
}) {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
        notification.type === "success"
          ? "bg-emerald-500/90 text-white border-emerald-400/50"
          : "bg-blue-600/90 text-white border-blue-400/50"
      }`}
    >
      {notification.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}
      <span className="font-bold tracking-tight">{notification.message}</span>
    </div>
  );
}

