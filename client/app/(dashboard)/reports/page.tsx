"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";

const energyData = [
  { month: "Jan", consumption: 420 },
  { month: "Feb", consumption: 380 },
  { month: "Mar", consumption: 450 },
  { month: "Apr", consumption: 390 },
  { month: "May", consumption: 410 },
  { month: "Jun", consumption: 360 },
];

const faultFrequencyData = [
  { name: "Short Circuit", value: 12 },
  { name: "Bulb Fault", value: 25 },
  { name: "Sensor Error", value: 8 },
  { name: "Connectivity", value: 5 },
];

const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#10b981"];

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (type: string) => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Reports</h2>
          <p className="text-muted-foreground">Analyze long-term metrics and export performance reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleExport('pdf')} 
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            onClick={() => handleExport('csv')} 
            disabled={isExporting}
            variant="outline"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Energy Consumption</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,410 kWh</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              12% saving vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uptime Percentage</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.85%</div>
            <p className="text-xs text-muted-foreground mt-1">High availability detected</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mean Time to Repair</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 Hours</div>
            <p className="text-xs text-muted-foreground mt-1">Target: &lt; 6 Hours</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reporting Period</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Last 30 Days</div>
            <p className="text-xs text-muted-foreground mt-1">Filtered by Default</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Energy Bar Chart */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Monthly Energy Consumption</CardTitle>
            <CardDescription>Visualizing kWh usage across the registry</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                <XAxis 
                  dataKey="month" 
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
                  tickFormatter={(value) => `${value}kWh`}
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="consumption" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fault Pie Chart */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Fault Frequency Distribution</CardTitle>
            <CardDescription>Breakdown of incident types detected</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={faultFrequencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {faultFrequencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mt-4">
              {faultFrequencyData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Maintenance Trends Record */}
       <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-6">
             <div>
                <CardTitle>Maintenance Performance Tracking</CardTitle>
                <CardDescription>KPI analysis for maintenance interventions</CardDescription>
             </div>
             <Badge variant="secondary" className="px-4 py-1">On Track</Badge>
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Response Time Compliance</span>
                   <span className="font-bold">92%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full w-[92%]" />
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Preventive Maintenance Completion</span>
                   <span className="font-bold">78%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full w-[78%]" />
                </div>
             </div>
          </div>
       </Card>
    </div>
  );
}
