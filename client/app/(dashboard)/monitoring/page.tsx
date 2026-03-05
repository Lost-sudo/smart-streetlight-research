"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Zap, Activity, Sun, Power, RefreshCcw } from "lucide-react";

// Mock data for the charts
const generateMockData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    voltage: (11.5 + Math.random() * 0.8).toFixed(2),
    current: (0.4 + Math.random() * 0.2).toFixed(2),
    lux: Math.floor(200 + Math.random() * 600),
  }));
};

const nodes = [
  { id: "1", name: "Node 1 - Main Street", status: "Normal" },
  { id: "2", name: "Node 2 - West Ave", status: "Short Circuit" },
  { id: "3", name: "Node 3 - East Blvd", status: "Bulb Fault" },
  { id: "4", name: "Node 4 - South Park", status: "Normal" },
];

export default function MonitoringPage() {
  const [selectedNode, setSelectedNode] = useState("1");
  const [relayOn, setRelayOn] = useState(true);
  const [data, setData] = useState(generateMockData());

  const currentNode = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Node Monitoring</h2>
          <p className="text-muted-foreground">Detailed inspection and real-time control of individual streetlights.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedNode} onValueChange={setSelectedNode}>
            <SelectTrigger className="w-[240px] bg-card border-none shadow-sm">
              <SelectValue placeholder="Select a node" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button 
            onClick={() => setData(generateMockData())}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <RefreshCcw className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Node Control Card */}
        <Card className="md:col-span-1 border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Relay Control</CardTitle>
            <CardDescription>Manual override for {currentNode?.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl gap-4">
              <div className={`p-4 rounded-full transition-all duration-500 bg-zinc-200 dark:bg-zinc-800 ${relayOn ? "shadow-[0_0_20px_rgba(234,179,8,0.3)] ring-4 ring-yellow-500/20" : ""}`}>
                <Power className={`h-12 w-12 transition-colors duration-500 ${relayOn ? "text-yellow-500" : "text-zinc-400"}`} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="relay-mode" 
                  checked={relayOn} 
                  onCheckedChange={setRelayOn} 
                />
                <Label htmlFor="relay-mode" className="font-bold text-lg">
                  {relayOn ? "ON" : "OFF"}
                </Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Operating Status</span>
                <Badge variant={currentNode?.status === "Normal" ? "default" : "destructive"}>
                  {currentNode?.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Gateway Strength</span>
                <div className="flex gap-0.5">
                  <div className="h-3 w-1 bg-green-500 rounded-full" />
                  <div className="h-3 w-1 bg-green-500 rounded-full" />
                  <div className="h-3 w-1 bg-green-500 rounded-full" />
                  <div className="h-3 w-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Charts Section */}
        <div className="md:col-span-3 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Voltage Chart */}
            <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Voltage Trend (V)</CardTitle>
                  <CardDescription>230V Reference Line</CardDescription>
                </div>
                <Zap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="h-[200px] pt-4 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorVoltage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[10, 14]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="voltage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVoltage)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Current Chart */}
            <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Current Draw (A)</CardTitle>
                  <CardDescription>Nominal: 0.45A</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent className="h-[200px] pt-4 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 1]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="current" stroke="#10b981" fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* LDR Readings Chart */}
          <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">LDR Light Intensity (lux)</CardTitle>
                <CardDescription>Ambient light levels across timeline</CardDescription>
              </div>
              <Sun className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="h-[300px] pt-4 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}lx`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lux" 
                    stroke="#f97316" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
