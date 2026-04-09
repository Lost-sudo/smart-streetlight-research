"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wrench, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Clock, 
  History as HistoryIcon,
  Info,
  UserPlus,
  Loader2
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery, type Alert } from "@/lib/redux/api/alertApi";
import { 
  useGetUnassignedTasksQuery, 
  useGetActiveTasksQuery,
  useGetAvailableTechniciansQuery,
  useAssignTaskMutation,
  useClaimTaskMutation,
  useUpdateTaskStatusMutation,
  useGetResolvedTodayCountQuery,
  type RepairTask,
  type Technician
} from "@/lib/redux/api/repairTaskApi";

const priorityColors: Record<string, string> = {
  High: "border-red-500 text-red-500 bg-red-500/10",
  Medium: "border-orange-500 text-orange-500 bg-orange-500/10",
  Low: "border-yellow-500 text-yellow-500 bg-yellow-500/10",
};

interface MaintenanceTask {
  id: string;
  node: string;
  faultType: string;
  priority: "High" | "Medium" | "Low";
  dateDetected: string;
  suggestedAction: string;
  explanation: string;
  status: "Pending" | "Assigned" | "In Progress" | "Resolved";
  assignedTo?: string;
}

export default function ImmediateRepairsPage() {
  const { data: streetlights = [], isLoading: slLoading } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });
  const { data: alerts = [], isLoading: alertsLoading } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: unassignedBase = [], isLoading: uLoading } = useGetUnassignedTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: activeBase = [], isLoading: aLoading } = useGetActiveTasksQuery(undefined, { pollingInterval: 15000 });
  const { data: availableTechnicians = [] } = useGetAvailableTechniciansQuery(undefined, { pollingInterval: 30000 });
  const { data: resolvedToday = 0, isLoading: rtLoading } = useGetResolvedTodayCountQuery(undefined, { pollingInterval: 15000 });

  const [assignMutate] = useAssignTaskMutation();
  const [claimMutate] = useClaimTaskMutation();
  const [statusMutate] = useUpdateTaskStatusMutation();
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const mapTask = (t: RepairTask) => {
      const alert = alerts.find((a: Alert) => a.id === t.alert_id);
      const sl = streetlights.find((s: Streetlight) => s.id === alert?.streetlight_id);
      
      const priorityStr = alert?.severity === "critical" ? "High" : alert?.severity === "high" ? "Medium" : "Low";
      return {
          id: String(t.id),
          node: sl?.name || "Unknown Node",
          faultType: alert?.type?.replace(/_/g, ' ') || "Anomaly Alert",
          priority: priorityStr,
          dateDetected: alert?.created_at ? new Date(alert.created_at).toLocaleDateString() : "Unknown Date",
          suggestedAction: alert?.message || "Verify Node State manually.",
          explanation: t.description || "System flagged an anomaly requiring service.",
          status: t.status === "pending" ? "Pending" : t.status === "assigned" ? "Assigned" : t.status === "in_progress" ? "In Progress" : "Resolved",
          assignedTo: t.technician_id ? `Tech #${t.technician_id}` : undefined
      } as MaintenanceTask;
  };

  const dbTasks = [...unassignedBase.map(mapTask), ...activeBase.filter((a: RepairTask) => a.status !== "pending").map(mapTask)];

  const handleAssign = async (taskId: string) => {
    if (!selectedTech) return;
    try {
      await assignMutate({ taskId: Number(taskId), technicianId: Number(selectedTech) }).unwrap();
      showNotification(`Technician assigned successfully!`, 'info');
      setSelectedTech("");
    } catch (e) { showNotification("Failed to assign tech.", "info"); }
  };

  const handleClaim = async (taskId: string) => {
    try {
      await claimMutate(Number(taskId)).unwrap();
      showNotification("Task claimed successfully. It is now assigned to you.", 'success');
    } catch (e) { showNotification("Failed to claim task.", "info"); }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await statusMutate({ taskId: Number(taskId), status }).unwrap();
      const action = status === "in_progress" ? "started" : "completed";
      showNotification(`Repair ${action} successfully!`, 'success');
      if (status === "completed") {
        (document.querySelector('[data-state="open"]') as HTMLElement)?.click();
      }
    } catch (e) { 
      console.error(e);
      showNotification(`Failed to move to ${status}.`, "info"); 
    }
  };

  const filteredTasks = dbTasks.filter(task => 
    task.node.toLowerCase().includes(search.toLowerCase()) || 
    task.faultType.toLowerCase().includes(search.toLowerCase())
  );

  const unassignedTasks = filteredTasks.filter(task => !task.assignedTo);
  const assignedTasks = filteredTasks.filter(task => task.assignedTo);

  const renderTaskTable = (taskList: MaintenanceTask[]) => (
    <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Node & Fault</TableHead>
              <TableHead className="font-bold">Priority</TableHead>
              <TableHead className="font-bold">Assignee</TableHead>
              <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskList.length > 0 ? (
              taskList.map((task) => (
                <TableRow key={task.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">{task.node}</span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className={`h-3 w-3 ${task.priority === "High" ? "text-red-500" : task.priority === "Medium" ? "text-orange-500" : "text-yellow-500"}`} />
                        {task.faultType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium">{task.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80">
                          Inspect
                          <Search className="ml-2 h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <Wrench className="h-6 w-6 text-primary" />
                            Fault Diagnosis: {task.node}
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Generated by System Alerts
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-6 py-4">
                          <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-xl space-y-2 border border-border/50">
                              <h4 className="flex items-center gap-2 font-bold text-sm">
                                <Info className="h-4 w-4 text-blue-500" />
                                Fault Explanation
                              </h4>
                              <p className="text-sm leading-relaxed text-muted-foreground">{task.explanation}</p>
                            </div>

                            <div className="p-4 bg-primary/5 rounded-xl space-y-2 border border-primary/10">
                              <h4 className="flex items-center gap-2 font-bold text-sm text-primary">
                                <CheckCircle2 className="h-4 w-4" />
                                Suggested Action
                              </h4>
                              <p className="text-sm font-medium">{task.suggestedAction}</p>
                            </div>

                            <RoleGate allowedRoles={["admin", "operator"]}>
                              <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                  <UserPlus className="h-4 w-4 text-primary" />
                                  Assign Technician
                                </Label>
                                <div className="flex gap-2">
                                  <Select 
                                    value={selectedTech} 
                                    onValueChange={setSelectedTech}
                                  >
                                    <SelectTrigger className="flex-1 bg-white dark:bg-zinc-900 border-none shadow-sm">
                                      <SelectValue placeholder={task.assignedTo || "Select personnel..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableTechnicians.length > 0 ? (
                                        availableTechnicians.map((tech: Technician) => (
                                          <SelectItem key={tech.id} value={String(tech.id)}>
                                            {tech.username}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <div className="p-2 text-xs text-muted-foreground text-center italic">
                                          No personnel available
                                        </div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    disabled={!selectedTech} 
                                    onClick={() => handleAssign(task.id)}
                                    size="sm"
                                    className="rounded-lg shadow-md h-10 px-4"
                                  >
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            </RoleGate>

                            <RoleGate allowedRoles={["technician"]}>
                              {!task.assignedTo && (
                                <div className="space-y-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                      <UserPlus className="h-4 w-4" />
                                      Available for Claim
                                    </Label>
                                    <Button 
                                      onClick={() => handleClaim(task.id)}
                                      size="sm"
                                      className="rounded-lg shadow-md h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                      Claim Task
                                    </Button>
                                  </div>
                                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                                    By claiming this task, you will be assigned to resolve the fault.
                                  </p>
                                </div>
                              )}
                            </RoleGate>

                            <RoleGate allowedRoles={["admin", "technician"]}>
                              <div className="space-y-2">
                                <Label htmlFor={`repair-log-${task.id}`} className="text-sm font-bold">Repair Log Input</Label>
                                <Textarea 
                                  id={`repair-log-${task.id}`} 
                                  placeholder="Describe the steps taken for repair..." 
                                  className="min-h-[100px] bg-card border-none shadow-inner"
                                />
                              </div>
                            </RoleGate>
                          </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                          <Button variant="outline" className="flex-1 sm:flex-none border-border hover:bg-muted" onClick={() => (document.querySelector('[data-state="open"]') as HTMLElement)?.click()}>Close</Button>
                          <RoleGate allowedRoles={["admin", "operator", "technician"]}>
                            {task.status === "Pending" ? (
                              <span className="text-xs text-muted-foreground flex items-center pr-4 italic">Assign to start repair</span>
                            ) : task.status === "Assigned" ? (
                              <Button className="flex-1 sm:flex-none font-semibold bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus(task.id, "in_progress")}>Start Repair</Button>
                            ) : task.status === "In Progress" ? (
                              <Button className="flex-1 sm:flex-none font-semibold bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(task.id, "completed")}>Complete Repair</Button>
                            ) : null}
                          </RoleGate>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground font-medium">
                  No tasks here. All systems nominal.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const isLoading = slLoading || alertsLoading || uLoading || aLoading || rtLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground font-medium">Synchronizing fault data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 relative">
      {/* Success/Info Notification Popover */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
            : 'bg-blue-600/90 text-white border-blue-400/50'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          <span className="font-bold tracking-tight">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fault Monitoring</h2>
          <p className="text-muted-foreground italic">Reactive workflow for real-time fault detection and immediate repairs.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search nodes or faults..." 
              className="pl-9 w-[280px] bg-card border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="bg-card border-none">
            <HistoryIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Repairs</p>
              <h3 className="text-2xl font-bold">{unassignedTasks.length}</h3>
            </div>
         </div>
         <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/20">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Work</p>
              <h3 className="text-2xl font-bold">{assignedTasks.length}</h3>
            </div>
         </div>
         <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
              <h3 className="text-2xl font-bold">{resolvedToday}</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50">
             <AlertTriangle className="h-6 w-6 text-orange-500 p-1 bg-orange-500/10 rounded-md" />
             <h3 className="text-xl font-bold tracking-tight text-foreground">Unassigned / Pending</h3>
             <Badge variant="secondary" className="ml-auto bg-muted">{unassignedTasks.length}</Badge>
          </div>
          {renderTaskTable(unassignedTasks)}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1 border-b pb-2 border-border/50">
             <Wrench className="h-6 w-6 text-blue-500 p-1 bg-blue-500/10 rounded-md" />
             <h3 className="text-xl font-bold tracking-tight text-foreground">Assigned / In Progress</h3>
             <Badge variant="secondary" className="ml-auto bg-muted">{assignedTasks.length}</Badge>
          </div>
          {renderTaskTable(assignedTasks)}
        </div>
      </div>
    </div>
  );
}
