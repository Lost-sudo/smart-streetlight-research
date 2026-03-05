"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Activity, 
  AlertTriangle, 
  Wrench, 
  Zap, 
  Thermometer,
  Sun,
  CheckCircle2
} from "lucide-react";

interface NodeStatus {
  id: string;
  name: string;
  status: "Normal" | "Short Circuit" | "Bulb Fault" | "Needs Maintenance";
  voltage: string;
  current: string;
  lightLevel: string;
  prediction: string;
}

const nodes: NodeStatus[] = [
  {
    id: "1",
    name: "Node 1",
    status: "Normal",
    voltage: "11.9V",
    current: "0.45A",
    lightLevel: "820 lux",
    prediction: "Healthy",
  },
  {
    id: "2",
    name: "Node 2",
    status: "Short Circuit",
    voltage: "2.1V",
    current: "4.2A",
    lightLevel: "10 lux",
    prediction: "Critical",
  },
  {
    id: "3",
    name: "Node 3",
    status: "Bulb Fault",
    voltage: "12.0V",
    current: "0.02A",
    lightLevel: "5 lux",
    prediction: "Hardware Error",
  },
  {
    id: "4",
    name: "Node 4",
    status: "Needs Maintenance",
    voltage: "10.5V",
    current: "0.38A",
    lightLevel: "600 lux",
    prediction: "Degrading",
  },
];

const statusConfig = {
  Normal: { color: "bg-green-500", icon: CheckCircle2, text: "text-green-500" },
  "Short Circuit": { color: "bg-red-500", icon: AlertTriangle, text: "text-red-500" },
  "Bulb Fault": { color: "bg-orange-500", icon: Lightbulb, text: "text-orange-500" },
  "Needs Maintenance": { color: "bg-yellow-500", icon: Wrench, text: "text-yellow-500" },
};

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Live System Status</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Thermometer className="mr-1 h-3 w-3" />
            28°C Ambient
          </Badge>
          <div className="text-sm font-medium">March 4, 2026</div>
        </div>
      </div>
      
      {/* System Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">CONNECTED TO GATEWAY</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">STEADY PERFORMANCE</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Faulty</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">REQUIRES IMMEDIATE ATTENTION</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">PREDICTIVE ACTION REQUIRED</p>
          </CardContent>
        </Card>
      </div>

      {/* Node Status Grid */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Node Status Grid</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {nodes.map((node) => {
            const config = statusConfig[node.status];
            const StatusIcon = config.icon;
            
            return (
              <Card key={node.id} className="overflow-hidden border-t-4" style={{ borderTopColor: `var(--${node.status.toLowerCase().replace(" ", "-")})` }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
                  <CardTitle className="text-lg font-bold">{node.name}</CardTitle>
                  <StatusIcon className={`h-5 w-5 ${config.text}`} />
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`${config.text} border-current gap-1`}>
                      <span className={`h-2 w-2 rounded-full ${config.color}`} />
                      {node.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span>{node.voltage}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>{node.current}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sun className="h-4 w-4" />
                      <span>{node.lightLevel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium text-foreground">{node.prediction}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Health Prediction</div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${node.status === "Normal" ? "bg-green-500 w-[95%]" : node.status === "Short Circuit" ? "bg-red-500 w-[10%]" : node.status === "Bulb Fault" ? "bg-orange-500 w-[30%]" : "bg-yellow-500 w-[60%]"}`} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
