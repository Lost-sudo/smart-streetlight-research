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
  Loader2,
} from "lucide-react";
import { useGetSystemMetricsQuery } from "@/lib/redux/api/reportApi";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#3b82f6", "#ef4444", "#f97316", "#10b981", "#8b5cf6"];

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEARS = ["2024", "2025", "2026"];

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const { data, isLoading, isError, refetch } = useGetSystemMetricsQuery({
    month: parseInt(selectedMonth),
    year: parseInt(selectedYear),
  });

  const handleExport = (type: string) => {
    if (type === 'pdf') {
      window.print();
    } else {
      setIsExporting(true);
      // Logic for CSV export could go here
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }


  const metrics = data?.metrics || {
    energy_consumption: "0 kWh",
    energy_savings: "No data",
    uptime_percentage: "0%",
    uptime_status: "No data available",
    mttr: "0 Hours",
    mttr_target: "Target: < 6 Hours",
    reporting_period: "N/A",
    reporting_filter: "N/A"
  };
  const energyData = data?.energy_data || [];
  const faultFrequencyData = data?.fault_frequency_data || [];
  const maintenance = data?.maintenance_performance || {
    response_time_compliance: 0,
    pm_completion: 0,
    status: "No Data"
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Reports</h2>
          <p className="text-muted-foreground">Analyze long-term metrics and export performance reports.</p>
        </div>
        <div className="flex items-center gap-4 no-print">
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] bg-white dark:bg-zinc-900">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {isExporting ? "Generating..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Energy Consumption</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.energy_consumption}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {metrics?.energy_savings}
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Uptime Percentage</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.uptime_percentage}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics?.uptime_status}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mean Time to Repair</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.mttr}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics?.mttr_target}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reporting Period</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.reporting_period}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics?.reporting_filter}</p>
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
              <div className="w-full h-full relative">
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
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mt-4 min-w-[200px]">
                {faultFrequencyData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground truncate max-w-[100px]">{entry.name}</span>
                    <span className="font-bold ml-auto">{entry.value}</span>
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
            <Badge variant={maintenance?.status === "On Track" ? "secondary" : "destructive"} className="px-4 py-1">
              {maintenance?.status}
            </Badge>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time Compliance</span>
                <span className="font-bold">{maintenance?.response_time_compliance}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${maintenance?.response_time_compliance}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preventive Maintenance Completion</span>
                <span className="font-bold">{maintenance?.pm_completion}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ width: `${maintenance?.pm_completion}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
    </div>
  );
}
