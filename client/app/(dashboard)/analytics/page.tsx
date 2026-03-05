"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  BrainCircuit,
  AlertCircle,
  Clock,
  TrendingDown,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const featureImportanceData = [
  { name: "Voltage", value: 85 },
  { name: "Current", value: 72 },
  { name: "LDR Lux", value: 45 },
  { name: "Op. Hours", value: 30 },
  { name: "Temp.", value: 15 },
];

const degradationData = [
  { day: "Day 1", health: 100 },
  { day: "Day 5", health: 98 },
  { day: "Day 10", health: 95 },
  { day: "Day 15", health: 90 },
  { day: "Day 20", health: 82 },
  { day: "Day 25", health: 75 },
  { day: "Day 30", health: 68 },
];

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">
            Machine Learning insights and failure prediction models.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fault Classification Card */}
        <Card className="col-span-1 border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fault Classification</CardTitle>
            <BrainCircuit className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4 bg-muted/30 rounded-2xl">
              <Badge variant="outline" className="mb-2 text-emerald-500 border-emerald-500/30 bg-emerald-500/5 px-3 py-1">
                Healthy - Low Risk
              </Badge>
              <div className="text-4xl font-black text-foreground">98.2%</div>
              <p className="text-xs text-muted-foreground mt-1">Prediction Confidence</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Model Reliability</span>
                <span>Excellent</span>
              </div>
              <Progress value={98} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col items-center p-3 rounded-xl border border-border/50">
                <ShieldCheck className="h-5 w-5 text-emerald-500 mb-1" />
                <span className="text-[10px] text-muted-foreground uppercase">Stable</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl border border-border/50">
                <AlertCircle className="h-5 w-5 text-zinc-300 mb-1" />
                <span className="text-[10px] text-muted-foreground uppercase">No Anomalies</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Probability / RUL */}
        <Card className="col-span-1 border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Probability</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4 bg-muted/30 rounded-2xl">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">Remaining Useful Life (RUL)</div>
              <div className="text-4xl font-black text-foreground">42 Days</div>
              <p className="text-xs text-orange-500 mt-1 font-semibold">Planned Service Requested</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Wear Level</span>
                  <span className="font-semibold">68%</span>
                </div>
                <Progress value={68} className="h-1.5 bg-zinc-200 dark:bg-zinc-800 [&>div]:bg-orange-500" />
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                <TrendingDown className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  <span className="font-bold">Maintenance Trend:</span> Node 4 health has decreased by 12% in the last 15 days.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Model Metrics Placeholder */}
         <Card className="col-span-1 border-none shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 dark:from-zinc-900 dark:to-zinc-800 flex flex-col justify-center items-center p-8 text-center gap-4">
            <div className="p-4 bg-primary rounded-full shadow-xl shadow-primary/20">
              <BrainCircuit className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">AI Engine Active</h3>
              <p className="text-sm text-muted-foreground italic">&quot;Analyzing thousands of telemetry points to optimize city energy consumption.&quot;</p>
            </div>
            <Badge variant="secondary" className="mt-2 animate-pulse">Running Inference</Badge>
         </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Degradation Trend Chart */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Health Degradation Trend</CardTitle>
            <CardDescription>Visualizing asset health score over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={degradationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                <XAxis 
                  dataKey="day" 
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
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="health" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Importance Bar Chart */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Model Feature Importance</CardTitle>
              <CardDescription>Weight of sensors in prediction outcome</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="h-[300px] min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={featureImportanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6" 
                  radius={[0, 6, 6, 0]} 
                  barSize={12} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
