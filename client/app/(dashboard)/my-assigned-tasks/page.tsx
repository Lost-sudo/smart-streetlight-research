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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { useGetStreetlightsQuery, type Streetlight } from "@/lib/redux/api/streetlightApi";
import { useGetAlertsQuery, type Alert } from "@/lib/redux/api/alertApi";
import {
  useGetMyTasksQuery,
  useUpdateTaskStatusMutation,
  type RepairTask,
} from "@/lib/redux/api/repairTaskApi";
import { showNotification } from "@/lib/utils/notifications";

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

export default function MyTasksPage() {
  const { data: myTasks = [], isLoading: tasksLoading } = useGetMyTasksQuery(undefined, { pollingInterval: 10000 });
  const { data: alerts = [] } = useGetAlertsQuery(undefined, { pollingInterval: 30000 });
  const { data: streetlights = [] } = useGetStreetlightsQuery(undefined, { pollingInterval: 30000 });
  
  const [updateStatus, { isLoading: isUpdating }] = useUpdateTaskStatusMutation();

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [repairNotes, setRepairNotes] = useState("");

  // Enrich tasks with node and alert info
  const enrichedTasks = useMemo(() => {
    return myTasks.map((task: RepairTask) => {
      const alert = alerts.find((a: Alert) => a.id === task.alert_id);
      const sl = streetlights.find((s: Streetlight) => s.id === alert?.streetlight_id);
      return {
        ...task,
        nodeName: sl?.name || "Unknown Node",
        alertType: alert?.type || "General Alert",
      };
    });
  }, [myTasks, alerts, streetlights]);

  const handleStatusChange = async (taskId: number, status: string, notes?: string) => {
    try {
      await updateStatus({ taskId, status, description: notes }).unwrap();
      const action = status === "in_progress" ? "started" : "completed";
      showNotification(`Repair ${action} successfully!`, 'success');
      if (status === "completed") {
        setCompleteDialogOpen(false);
        setRepairNotes("");
      }
    } catch (e) {
      showNotification("Failed to update status. Please try again.", "info");
      console.error(e);
    }
  };

  const openCompleteDialog = (taskId: number) => {
    setSelectedTaskId(taskId);
    setCompleteDialogOpen(true);
  };

  if (tasksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeTasks = enrichedTasks.filter(t => t.status !== "completed");
  const completedTasks = enrichedTasks.filter(t => t.status === "completed");

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Assigned Tasks</h2>
          <p className="text-muted-foreground italic">
            Manage your repair assignments and update progress.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Active Assignments</CardTitle>
                <CardDescription>Tasks requiring your attention.</CardDescription>
              </div>
              <Badge variant="outline" className="text-primary font-bold">
                {activeTasks.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead>Node/Streetlight</TableHead>
                  <TableHead>Fault Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTasks.length > 0 ? (
                  activeTasks.map((task) => (
                    <TableRow key={task.id} className="cursor-default group hover:bg-muted/5">
                      <TableCell>
                        <Badge className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityColors[task.priority]}`}>
                          {task.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{task.nodeName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`${sourceTypeConfig[task.source_type].color} ${sourceTypeConfig[task.source_type].bg} p-1 rounded-sm`}>
                            {sourceTypeConfig[task.source_type].icon}
                          </span>
                          <span className="text-sm">{task.alertType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[task.status].variant} className="text-[10px] uppercase font-bold tracking-wider">
                          {statusConfig[task.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {task.status === "assigned" && (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 font-semibold h-8" 
                            onClick={() => handleStatusChange(task.id, "in_progress")}
                            disabled={isUpdating}
                          >
                            <Clock className="h-3.5 w-3.5 mr-1.5" /> Start Repair
                          </Button>
                        )}
                        {task.status === "in_progress" && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 font-semibold h-8" 
                            onClick={() => openCompleteDialog(task.id)}
                            disabled={isUpdating}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                      No active tasks assigned to you.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {completedTasks.length > 0 && (
          <Card className="border-border/40 opacity-75">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Recently Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {completedTasks.slice(0, 5).map((task) => (
                    <TableRow key={task.id} className="hover:bg-transparent">
                      <TableCell className="text-muted-foreground line-through italic text-xs">{task.nodeName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{task.alertType}</TableCell>
                      <TableCell className="text-right">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Complete Repair</DialogTitle>
            <DialogDescription>
              Please provide details about the work performed and the resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Diagnosis & Repair Notes</p>
              <Textarea 
                placeholder="Describe what was fixed (e.g., replaced LED driver, tightened loose connection)..." 
                className="min-h-[120px] rounded-xl resize-none"
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold"
              onClick={() => selectedTaskId && handleStatusChange(selectedTaskId, "completed", repairNotes)}
              disabled={isUpdating || !repairNotes.trim()}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Finalize Repair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

