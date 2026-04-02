"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Zap, Activity, Sun, RefreshCcw, Cpu, MapPin, Calendar, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetStreetlightLogsQuery } from "@/lib/redux/api/streetlightApi";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

interface NodeDetailsDialogProps {
  node: Streetlight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, { bg: string; icon: string; badge: "default" | "destructive" | "secondary" | "outline" }> = {
  active: { bg: "bg-emerald-100 dark:bg-emerald-900/40", icon: "text-emerald-600 dark:text-emerald-400", badge: "default" },
  inactive: { bg: "bg-zinc-100 dark:bg-zinc-800/60", icon: "text-zinc-500 dark:text-zinc-400", badge: "secondary" },
  faulty: { bg: "bg-red-100 dark:bg-red-900/40", icon: "text-red-600 dark:text-red-400", badge: "destructive" },
  maintenance: { bg: "bg-amber-100 dark:bg-amber-900/40", icon: "text-amber-600 dark:text-amber-400", badge: "outline" },
};

function getColors(status?: string) {
  return statusColors[status || ""] || statusColors.inactive;
}

export function NodeDetailsDialog({ node, open, onOpenChange }: NodeDetailsDialogProps) {
  const { data: logs = [], isFetching, refetch } = useGetStreetlightLogsQuery(
    { id: node?.id ?? 0 },
    { skip: !node, pollingInterval: 10000 }
  );

  // Format logs for Recharts (reverse to show chronological left-to-right)
  const chartData = [...logs].reverse().map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    voltage: log.voltage.toFixed(2),
    current: log.current.toFixed(2),
    power: log.power_consumption ? log.power_consumption.toFixed(2) : "0.00",
    lux: log.light_intensity,
  }));

  // Latest reading for the summary metrics
  const latest = logs.length > 0 ? logs[0] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] lg:max-w-6xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0 border-none bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  getColors(node?.status).bg
                )}>
                  <Lightbulb className={cn(
                    "h-5 w-5",
                    getColors(node?.status).icon
                  )} />
                </div>
                <div>
                  <DialogTitle className="text-xl">{node?.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs">{node?.device_id || "No Device ID"}</span>
                    <span className="text-muted-foreground">·</span>
                    <Badge variant={getColors(node?.status).badge} className="text-[10px] px-1.5 py-0 capitalize">
                      {node?.status || "Unknown"}
                    </Badge>
                  </DialogDescription>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className={cn(
                  "p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors mr-8",
                  isFetching && "animate-spin"
                )}
                disabled={isFetching}
              >
                <RefreshCcw className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Quick Stats Row */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card className="border shadow-sm bg-white dark:bg-zinc-900">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Zap className="h-3 w-3 text-blue-500" />
                  Voltage
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {latest ? `${latest.voltage.toFixed(1)}` : "—"}<span className="text-sm font-normal text-muted-foreground ml-1">V</span>
                </p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-white dark:bg-zinc-900">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Activity className="h-3 w-3 text-emerald-500" />
                  Current
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {latest ? `${latest.current.toFixed(2)}` : "—"}<span className="text-sm font-normal text-muted-foreground ml-1">A</span>
                </p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-white dark:bg-zinc-900">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Power
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {latest ? `${latest.power_consumption.toFixed(1)}` : "—"}<span className="text-sm font-normal text-muted-foreground ml-1">W</span>
                </p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-white dark:bg-zinc-900">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Sun className="h-3 w-3 text-orange-500" />
                  Light
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {latest ? `${latest.light_intensity.toFixed(0)}` : "—"}<span className="text-sm font-normal text-muted-foreground ml-1">lux</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Node Info Bar */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              {node?.model_info || "Unknown Model"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {node ? `${node.latitude.toFixed(4)}, ${node.longitude.toFixed(4)}` : "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Installed {node?.installation_date ? new Date(node.installation_date).toLocaleDateString() : "—"}
            </span>
          </div>

          {chartData.length === 0 ? (
            <Card className="border-none shadow-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center">
              <Activity className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-2xl font-bold">No telemetry data yet</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Waiting for hardware ({node?.device_id || "Unregistered Device ID"}) to stream data.
              </p>
            </Card>
          ) : (
            <>
              {/* Telemetry Logs Table */}
              <Card className="border shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Recent Telemetry Logs</CardTitle>
                  <CardDescription>Latest {Math.min(logs.length, 50)} readings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border bg-card overflow-hidden">
                    <div className="max-h-[220px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm shadow-sm z-10">
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead className="text-right">Voltage (V)</TableHead>
                            <TableHead className="text-right">Current (A)</TableHead>
                            <TableHead className="text-right">Power (W)</TableHead>
                            <TableHead className="text-right">Light (lux)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.slice(0, 50).map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                              </TableCell>
                              <TableCell className="text-right font-mono">{log.voltage.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono">{log.current.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono">{log.power_consumption.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono">{log.light_intensity.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Voltage Chart */}
                <Card className="border shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-medium">Voltage (V)</CardTitle>
                      <CardDescription className="text-xs">230V Reference</CardDescription>
                    </div>
                    <Zap className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent className="h-[180px] pt-2 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="dlgColorVoltage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="voltage" stroke="#3b82f6" fillOpacity={1} fill="url(#dlgColorVoltage)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Current Chart */}
                <Card className="border shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-medium">Current (A)</CardTitle>
                      <CardDescription className="text-xs">Nominal: 0.45A</CardDescription>
                    </div>
                    <Activity className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent className="h-[180px] pt-2 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="dlgColorCurrent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="current" stroke="#10b981" fillOpacity={1} fill="url(#dlgColorCurrent)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Power Chart */}
                <Card className="border shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-medium">Power (W)</CardTitle>
                      <CardDescription className="text-xs">Real-time wattage</CardDescription>
                    </div>
                    <Zap className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent className="h-[180px] pt-2 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="dlgColorPower" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="power" stroke="#f59e0b" fillOpacity={1} fill="url(#dlgColorPower)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* LDR Readings Chart (full width) */}
              <Card className="border shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-medium">LDR Light Intensity (lux)</CardTitle>
                    <CardDescription className="text-xs">Ambient light levels across timeline</CardDescription>
                  </div>
                  <Sun className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="h-[220px] pt-2 min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={chartData}>
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
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Line
                        type="monotone"
                        dataKey="lux"
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
