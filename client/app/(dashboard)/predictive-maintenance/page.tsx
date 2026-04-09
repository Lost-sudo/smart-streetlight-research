"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BrainCircuit,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  UserPlus,
  Wrench,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetPredictiveMaintenanceLogsQuery, type PredictiveMaintenanceLog } from "@/lib/redux/api/predictiveMaintenanceApi";
import { useGetPredictiveAlertsQuery, useCreateAlertMutation, type Alert } from "@/lib/redux/api/alertApi";
import {
  useGetTasksBySourceTypeQuery,
  useGetAvailableTechniciansQuery,
  useAssignTaskMutation,
  useScheduleTaskMutation,
  type Technician,
  type RepairTask,
} from "@/lib/redux/api/repairTaskApi";

const urgencyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  medium: { label: "Warning", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  low: { label: "Normal", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

const priorityColors: Record<string, string> = {
  critical: "border-red-500 text-red-500 bg-red-500/10",
  high: "border-orange-500 text-orange-500 bg-orange-500/10",
  medium: "border-yellow-500 text-yellow-500 bg-yellow-500/10",
  low: "border-emerald-500 text-emerald-500 bg-emerald-500/10",
};

export default function PredictiveMaintenancePage() {
  const { data: streetlights = [], isLoading: slLoading } = useGetStreetlightsQuery(undefined, { pollingInterval: 15000 });
  const { data: pmLogs = [], isLoading: pmLoading } = useGetPredictiveMaintenanceLogsQuery(undefined, { pollingInterval: 15000 });
  const { data: predictiveAlerts = [] } = useGetPredictiveAlertsQuery(undefined, { pollingInterval: 15000 });
  const { data: predictiveTasks = [] } = useGetTasksBySourceTypeQuery("PREDICTIVE", { pollingInterval: 15000 });
  const { data: availableTechnicians = [] } = useGetAvailableTechniciansQuery(undefined, { pollingInterval: 30000 });

  const [createAlert] = useCreateAlertMutation();
  const [scheduleTask] = useScheduleTaskMutation();
  const [assignMutate] = useAssignTaskMutation();
  const [selectedTech, setSelectedTech] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleDesc, setScheduleDesc] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Merge PM logs with streetlight info
  const mergedNodes = pmLogs.map((pm: PredictiveMaintenanceLog) => {
    const sl = streetlights.find((s: Streetlight) => s.id === pm.streetlight_id);
    return { ...pm, nodeName: sl?.name || `Node #${pm.streetlight_id}`, deviceId: sl?.device_id || "N/A" };
  }).sort((a, b) => b.failure_probability - a.failure_probability);

  const criticalNodes = mergedNodes.filter((n) => n.urgency_level === "high");
  const warningNodes = mergedNodes.filter((n) => n.urgency_level === "medium");
  const scheduledCount = predictiveTasks.filter((t: RepairTask) => t.status !== "completed").length;

  const handleScheduleMaintenance = async (pm: PredictiveMaintenanceLog & { nodeName: string }) => {
    try {
      // Check if a predictive alert already exists for this node
      const existingAlert = predictiveAlerts.find(
        (a: Alert) => a.streetlight_id === pm.streetlight_id && !a.is_resolved
      );

      let alertId: number;

      if (existingAlert) {
        alertId = existingAlert.id;
      } else {
        // Create a PREDICTIVE alert first
        const newAlert = await createAlert({
          streetlight_id: pm.streetlight_id,
          alert_type: "PREDICTIVE",
          type: "predicted_failure",
          severity: pm.urgency_level === "high" ? "high" : "medium",
          message: `LSTM predicts ${(pm.failure_probability * 100).toFixed(0)}% failure probability. Estimated failure: ${new Date(pm.predicted_failure_date).toLocaleDateString()}.`,
          is_resolved: false,
          created_at: new Date().toISOString(),
        }).unwrap();
        alertId = newAlert.id;
      }

      // Create the repair task
      const priority = pm.urgency_level === "high" ? "high" : "medium";
      await scheduleTask({
        alert_id: alertId,
        description: scheduleDesc || `Scheduled preventive maintenance for ${pm.nodeName}. Predicted failure probability: ${(pm.failure_probability * 100).toFixed(0)}%.`,
        priority,
        scheduled_at: scheduleDate || undefined,
      }).unwrap();

      showNotification(`Maintenance scheduled for ${pm.nodeName}`, "success");
      setScheduleDate("");
      setScheduleDesc("");
    } catch (e) {
      const err = e as { data?: { detail?: string } };
      showNotification(err?.data?.detail || "Failed to schedule maintenance.", "info");
    }
  };

  const handleAssign = async (taskId: number) => {
    if (!selectedTech) return;
    try {
      await assignMutate({ taskId, technicianId: Number(selectedTech) }).unwrap();
      showNotification("Technician assigned successfully!", "info");
      setSelectedTech("");
    } catch {
      showNotification("Failed to assign technician.", "info");
    }
  };

  // Check if a node already has an active predictive task
  const hasActiveTask = (streetlightId: number) => {
    const nodeAlerts = predictiveAlerts.filter(
      (a: Alert) => a.streetlight_id === streetlightId && !a.is_resolved
    );
    return predictiveTasks.some(
      (t: RepairTask) =>
        t.status !== "completed" &&
        nodeAlerts.some((a: Alert) => a.id === t.alert_id)
    );
  };

  if (slLoading || pmLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading predictive insights...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative">
      {/* Notification */}
      {notification && (
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
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Maintenance</h2>
          <p className="text-muted-foreground italic">
            Proactive maintenance scheduling based on LSTM failure predictions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 px-3 py-1.5 text-xs font-semibold">
            <BrainCircuit className="h-3.5 w-3.5" />
            LSTM-Powered
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-red-500 p-3 rounded-xl shadow-lg shadow-red-500/20">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nodes at Risk</p>
              <h3 className="text-2xl font-bold">{criticalNodes.length}</h3>
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
              <h3 className="text-2xl font-bold">{warningNodes.length}</h3>
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
      </div>

      {/* Predictions Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50">
          <BrainCircuit className="h-6 w-6 text-violet-500 p-1 bg-violet-500/10 rounded-md" />
          <h3 className="text-xl font-bold tracking-tight text-foreground">Failure Predictions</h3>
          <Badge variant="secondary" className="ml-auto bg-muted">{mergedNodes.length}</Badge>
        </div>

        <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Node</TableHead>
                  <TableHead className="font-bold">Failure Probability</TableHead>
                  <TableHead className="font-bold">Predicted Date</TableHead>
                  <TableHead className="font-bold">Urgency</TableHead>
                  <TableHead className="text-right font-bold w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedNodes.length > 0 ? (
                  mergedNodes.map((node) => {
                    const config = urgencyConfig[node.urgency_level] || urgencyConfig.low;
                    const failureProb = Math.round(node.failure_probability * 100);
                    const alreadyScheduled = hasActiveTask(node.streetlight_id);

                    return (
                      <TableRow key={node.id} className="group transition-colors hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <Lightbulb className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div>
                              <span className="font-bold text-sm">{node.nodeName}</span>
                              <p className="text-xs text-muted-foreground font-mono">{node.deviceId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 w-32">
                            <div className="flex justify-between text-xs">
                              <span className={`font-bold ${config.color}`}>{failureProb}%</span>
                            </div>
                            <Progress value={failureProb} className={`h-1.5 bg-zinc-100 dark:bg-zinc-800`} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {new Date(node.predicted_failure_date).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize ${config.color} ${config.border} ${config.bg}`}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {alreadyScheduled ? (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          ) : (
                            <RoleGate allowedRoles={["admin", "operator"]}>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-600 hover:text-violet-700"
                                  >
                                    <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                                    Schedule
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl backdrop-blur-xl">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                      <BrainCircuit className="h-6 w-6 text-violet-500" />
                                      Schedule Maintenance: {node.nodeName}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Create a preventive maintenance task based on LSTM prediction.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="grid gap-4 py-4">
                                    <div className="p-4 bg-violet-500/5 rounded-xl space-y-2 border border-violet-500/10">
                                      <h4 className="flex items-center gap-2 font-bold text-sm text-violet-600">
                                        <BrainCircuit className="h-4 w-4" />
                                        ML Prediction Summary
                                      </h4>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Failure Probability:</span>
                                          <span className={`ml-2 font-bold ${config.color}`}>{failureProb}%</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Predicted Date:</span>
                                          <span className="ml-2 font-medium">{new Date(node.predicted_failure_date).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="schedule-date" className="text-sm font-bold">Scheduled Date</Label>
                                      <Input
                                        id="schedule-date"
                                        type="datetime-local"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="bg-card border-none shadow-inner"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="schedule-desc" className="text-sm font-bold">Description</Label>
                                      <Textarea
                                        id="schedule-desc"
                                        placeholder="Describe the planned maintenance..."
                                        className="min-h-[80px] bg-card border-none shadow-inner"
                                        value={scheduleDesc}
                                        onChange={(e) => setScheduleDesc(e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                      className="font-semibold bg-violet-600 hover:bg-violet-700"
                                      onClick={() => handleScheduleMaintenance(node)}
                                    >
                                      <CalendarClock className="h-4 w-4 mr-2" />
                                      Schedule Task
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </RoleGate>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                      No predictive maintenance data available. Waiting for LSTM analysis...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Scheduled Maintenance Tasks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50">
          <Wrench className="h-6 w-6 text-blue-500 p-1 bg-blue-500/10 rounded-md" />
          <h3 className="text-xl font-bold tracking-tight text-foreground">Scheduled Maintenance Tasks</h3>
          <Badge variant="secondary" className="ml-auto bg-muted">{predictiveTasks.length}</Badge>
        </div>

        <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Task</TableHead>
                  <TableHead className="font-bold">Priority</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Scheduled</TableHead>
                  <TableHead className="font-bold">Assignee</TableHead>
                  <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictiveTasks.length > 0 ? (
                  predictiveTasks.map((task: RepairTask) => {
                    const alert = predictiveAlerts.find((a: Alert) => a.id === task.alert_id);
                    const sl = streetlights.find((s: Streetlight) => s.id === alert?.streetlight_id);
                    return (
                      <TableRow key={task.id} className="group transition-colors hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-sm">{sl?.name || "Unknown Node"}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {task.description || "Predictive maintenance task"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize ${priorityColors[task.priority] || ""}`}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={task.status === "completed" ? "default" : task.status === "pending" ? "secondary" : "outline"}
                            className="capitalize text-xs"
                          >
                            {task.status === "in_progress" ? "In Progress" : task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {task.scheduled_at
                              ? new Date(task.scheduled_at).toLocaleDateString()
                              : "Not set"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.technician_id ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-sm font-medium">Tech #{task.technician_id}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <RoleGate allowedRoles={["admin", "operator"]}>
                            {task.status === "pending" && !task.technician_id && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                                    Assign
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Assign Technician</DialogTitle>
                                    <DialogDescription>Select a technician for this maintenance task.</DialogDescription>
                                  </DialogHeader>
                                  <div className="flex gap-2 py-4">
                                    <Select value={selectedTech} onValueChange={setSelectedTech}>
                                      <SelectTrigger className="flex-1 bg-white dark:bg-zinc-900 border-none shadow-sm">
                                        <SelectValue placeholder="Select technician..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableTechnicians.map((tech: Technician) => (
                                          <SelectItem key={tech.id} value={String(tech.id)}>
                                            {tech.username}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button disabled={!selectedTech} onClick={() => handleAssign(task.id)} size="sm" className="h-10 px-4">
                                      Assign
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </RoleGate>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                      No scheduled maintenance tasks. Use the predictions above to schedule proactive maintenance.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
