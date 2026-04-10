export type StatusConfig = {
  label: string;
  dot: string;
  bg: string;
  bgHover: string;
  icon: string;
  badge: "default" | "destructive" | "secondary" | "outline";
  priority: number;
};

// Status display config — maps DB enum values to colors, labels, and sort priority
export const statusConfig: Record<string, StatusConfig> = {
  faulty: {
    label: "Faulty",
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-900/40",
    bgHover: "group-hover:bg-red-200 dark:group-hover:bg-red-900/60",
    icon: "text-red-600 dark:text-red-400",
    badge: "destructive",
    priority: 0,
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    bgHover: "group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "outline",
    priority: 1,
  },
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    bgHover: "group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "default",
    priority: 2,
  },
  inactive: {
    label: "Inactive",
    dot: "bg-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    bgHover: "group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800",
    icon: "text-zinc-500 dark:text-zinc-400",
    badge: "secondary",
    priority: 3,
  },
};

export const defaultStatus = statusConfig.inactive;

export function getStatusConfig(status: string) {
  return statusConfig[status] || defaultStatus;
}

