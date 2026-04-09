"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Search,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Wrench,
  Loader2,
  Filter,
} from "lucide-react";
import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery, type Alert } from "@/lib/redux/api/alertApi";
import {
  useGetAllRepairTasksQuery,
  type RepairTask,
} from "@/lib/redux/api/repairTaskApi";

const sourceTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  FAULT: {
    label: "Fault",
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "text-red-500 border-red-500/30",
    bg: "bg-red-500/10",
  },
  PREDICTIVE: {
    label: "Predictive",
    icon: <BrainCircuit className="h-3 w-3" />,
    color: "text-violet-500 border-violet-500/30",
    bg: "bg-violet-500/10",
  },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  assigned: { label: "Assigned", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "default" },
};

const priorityColors: Record<string, string> = {
  critical: "border-red-500 text-red-500 bg-red-500/10",
  high: "border-orange-500 text-orange-500 bg-orange-500/10",
  medium: "border-yellow-500 text-yellow-500 bg-yellow-500/10",
  low: "border-emerald-500 text-emerald-500 bg-emerald-500/10",
};

export default function RepairTasksPage() {
  const { data: allTasks = [], isLoading: tasksLoading } = useGetAllRepairTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: alerts = [] } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: streetlights = [] } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Enrich tasks with node and alert info
  const enrichedTasks = useMemo(() => {
    return allTasks.map((task: RepairTask) => {
      const alert = alerts.find((a: Alert) => a.id === task.alert_id);
      const sl = streetlights.find((s: Streetlight) => s.id === alert?.streetlight_id);
      return {
        ...task,
        nodeName: sl?.name || "Unknown Node",
        deviceId: sl?.device_id || "N/A",
        alertMessage: alert?.message || "",
        alertType: alert?.type || "",
        alertSeverity: alert?.severity || "",
      };
    });
  }, [allTasks, alerts, streetlights]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return enrichedTasks.filter((task) => {
      const matchesSearch =
        task.nodeName.toLowerCase().includes(search.toLowerCase()) ||
        task.alertType.toLowerCase().includes(search.toLowerCase()) ||
        (task.description || "").toLowerCase().includes(search.toLowerCase());

      const matchesType = filterType === "ALL" || task.source_type === filterType;
      const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [enrichedTasks, search, filterType, filterStatus]);

  // Stats
  const totalFault = allTasks.filter((t: RepairTask) => t.source_type === "FAULT").length;
  const totalPredictive = allTasks.filter((t: RepairTask) => t.source_type === "PREDICTIVE").length;
  const totalCompleted = allTasks.filter((t: RepairTask) => t.status === "completed").length;

  if (tasksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading repair tasks...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repair Tasks</h2>
          <p className="text-muted-foreground italic">
            Unified view of all repair tasks from Fault Detection and Predictive Maintenance.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-slate-500/5 border border-slate-500/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-slate-600 p-3 rounded-xl shadow-lg shadow-slate-500/20">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tasks</p>
            <h3 className="text-2xl font-bold">{allTasks.length}</h3>
          </div>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-red-500 p-3 rounded-xl shadow-lg shadow-red-500/20">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fault Tasks</p>
            <h3 className="text-2xl font-bold">{totalFault}</h3>
          </div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-violet-500 p-3 rounded-xl shadow-lg shadow-violet-500/20">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Predictive Tasks</p>
            <h3 className="text-2xl font-bold">{totalPredictive}</h3>
          </div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
            <h3 className="text-2xl font-bold">{totalCompleted}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-border/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes, faults..."
            className="pl-9 bg-card border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] bg-card border-none">
            <SelectValue placeholder="Source Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="FAULT">Fault Only</SelectItem>
            <SelectItem value="PREDICTIVE">Predictive Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] bg-card border-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Node</TableHead>
                <TableHead className="font-bold">Source</TableHead>
                <TableHead className="font-bold">Priority</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Technician</TableHead>
                <TableHead className="font-bold">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const stConfig = sourceTypeConfig[task.source_type] || sourceTypeConfig.FAULT;
                  const sConfig = statusConfig[task.status] || statusConfig.pending;

                  return (
                    <TableRow key={task.id} className="transition-colors hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm">{task.nodeName}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {task.alertType.replace(/_/g, " ") || task.description || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 text-xs capitalize ${stConfig.color} ${stConfig.bg}`}>
                          {stConfig.icon}
                          {stConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize text-xs ${priorityColors[task.priority] || ""}`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sConfig.variant} className="capitalize text-xs">
                          {sConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.technician_id ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-medium">Tech #{task.technician_id}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(task.created_at).toLocaleDateString()}
                          </div>
                          {task.scheduled_at && (
                            <div className="flex items-center gap-1 text-violet-500">
                              <Wrench className="h-3 w-3" />
                              {new Date(task.scheduled_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                    No repair tasks match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
