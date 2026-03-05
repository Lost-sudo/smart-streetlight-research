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
  UserPlus
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MaintenanceTask {
  id: string;
  node: string;
  faultType: string;
  priority: "High" | "Medium" | "Low";
  dateDetected: string;
  suggestedAction: string;
  explanation: string;
  status: "Pending" | "In Progress" | "Resolved";
  assignedTo?: string;
}

const technicians = [
  { id: "t1", name: "John Doe", specialty: "Electrical" },
  { id: "t2", name: "Jane Smith", specialty: "Hardware" },
  { id: "t3", name: "Alice Brown", specialty: "Networking" },
];

const initialTasks: MaintenanceTask[] = [
  {
    id: "1",
    node: "Node 1",
    faultType: "Short Circuit",
    priority: "High",
    dateDetected: "2023-10-27",
    suggestedAction: "Inspect Relay & Wiring",
    explanation: "Voltage drop detected with simultaneous current spike. High probability of hardware short.",
    status: "Pending",
  },
  {
    id: "2",
    node: "Node 3",
    faultType: "Bulb Fault",
    priority: "Medium",
    dateDetected: "2023-10-28",
    suggestedAction: "Replace LED Module",
    explanation: "Standard voltage but near-zero current draw during active period.",
    status: "In Progress",
    assignedTo: "Jane Smith",
  },
  {
    id: "3",
    node: "Node 4",
    faultType: "Needs Maintenance",
    priority: "Low",
    dateDetected: "2023-10-29",
    suggestedAction: "Clean LDR Sensor",
    explanation: "Lux readings inconsistent with time-series historical averages.",
    status: "Pending",
  },
];

const priorityColors = {
  High: "bg-red-500/10 text-red-500 border-red-500/20",
  Medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Low: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export default function MaintenancePage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAssign = (taskId: string) => {
    if (!selectedTech) return;
    
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, assignedTo: selectedTech, status: "In Progress" } 
        : task
    ));
    showNotification(`Technician ${selectedTech} assigned successfully!`, 'info');
    setSelectedTech("");
  };

  const handleLogRepair = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    showNotification("Repair logged and alert closed successfully!", 'success');
  };

  const filteredTasks = tasks.filter(task => 
    task.node.toLowerCase().includes(search.toLowerCase()) || 
    task.faultType.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2 className="text-3xl font-bold tracking-tight">Maintenance Pipeline</h2>
          <p className="text-muted-foreground italic">Actionable repair workflows for field technicians.</p>
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
              <h3 className="text-2xl font-bold">{tasks.filter(t => t.status === "Pending").length}</h3>
            </div>
         </div>
         <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/20">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Work</p>
              <h3 className="text-2xl font-bold">{tasks.filter(t => t.status === "In Progress").length}</h3>
            </div>
         </div>
         <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
         </div>
      </div>

      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Node</TableHead>
              <TableHead className="font-bold">Fault Type</TableHead>
              <TableHead className="font-bold">Priority</TableHead>
              <TableHead className="font-bold">Assigned To</TableHead>
              <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell className="font-semibold">{task.node}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${task.priority === "High" ? "text-red-500" : task.priority === "Medium" ? "text-orange-500" : "text-yellow-500"}`} />
                      {task.faultType}
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
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                            Generated by ML Anomaly Detection Engine
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

                            {/* Assign Technician Section (Admin/Operator only) */}
                            <RoleGate allowedRoles={["ADMIN", "OPERATOR"]}>
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
                                    <SelectTrigger className="flex-1 bg-white dark:bg-zinc-900 border-none">
                                      <SelectValue placeholder={task.assignedTo || "Select personnel..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {technicians.map(tech => (
                                        <SelectItem key={tech.id} value={tech.name}>
                                          {tech.name} ({tech.specialty})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    disabled={!selectedTech} 
                                    onClick={() => handleAssign(task.id)}
                                    size="sm"
                                    className="rounded-lg shadow-md"
                                  >
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            </RoleGate>

                            {/* Technician Specific Inputs */}
                            <RoleGate allowedRoles={["ADMIN", "TECHNICIAN"]}>
                              <div className="space-y-2">
                                <Label htmlFor="repair-log" className="text-sm font-bold">Repair Log Input</Label>
                                <Textarea 
                                  id="repair-log" 
                                  placeholder="Describe the steps taken for repair..." 
                                  className="min-h-[100px] bg-card border-none shadow-inner"
                                />
                              </div>
                            </RoleGate>
                          </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => (document.querySelector('[data-state="open"]') as HTMLElement)?.click()}>Close</Button>
                          <RoleGate allowedRoles={["ADMIN", "TECHNICIAN"]}>
                            <Button className="flex-1 sm:flex-none" onClick={() => handleLogRepair(task.id)}>Log Repair & Close Alert</Button>
                          </RoleGate>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No maintenance tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
