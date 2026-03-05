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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Bell, 
  ShieldAlert, 
  Cpu, 
  Moon, 
  Save, 
  RefreshCw,
  Gauge
} from "lucide-react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground italic">Configure hardware thresholds and operational preferences.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary shadow-lg shadow-primary/20"
        >
          {saving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Configuration
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Anomaly Detection Thresholds */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Anomaly Detection</CardTitle>
                <CardDescription>Configure ML sensitivity and alert triggers.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voltage-min">Min Voltage (V)</Label>
                <Input id="voltage-min" defaultValue="210" className="bg-card border-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voltage-max">Max Voltage (V)</Label>
                <Input id="voltage-max" defaultValue="250" className="bg-card border-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-fault">Fault Current (A)</Label>
                <Input id="current-fault" defaultValue="0.8" className="bg-card border-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confidence">ML Confidence (%)</Label>
                <Input id="confidence" defaultValue="85" className="bg-card border-none" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Auto-Shutdown</Label>
                <p className="text-sm text-muted-foreground">Isolate node if critical short-circuit is detected.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Automation Rules */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
             <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>LDR sensor based switching logic.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label>Switching Strategy</Label>
                <Select defaultValue="adaptive">
                  <SelectTrigger className="bg-card border-none">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adaptive">Adaptive ML (Recommended)</SelectItem>
                    <SelectItem value="fixed">Fixed Lux Threshold</SelectItem>
                    <SelectItem value="scheduled">Time-based Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                   <Label htmlFor="lux-threshold">Lux Activation Threshold</Label>
                   <span className="text-xs font-bold text-primary">250 lx</span>
                </div>
                <Input id="lux-threshold" type="range" min="100" max="1000" defaultValue="250" className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                   <span>Darker</span>
                   <span>Brighter</span>
                </div>
              </div>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-bold">Dimming Control</Label>
                <p className="text-xs text-muted-foreground">Reduce power to 60% after 12:00 AM.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Hardware */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Alert distribution and connectivity.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label className="text-sm font-bold">Email Notifications</Label>
                <Input placeholder="alerts@lgu.gov.ph" className="bg-card border-none" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-xl bg-card/50">
                   <span className="text-xs font-medium">Push Alerts</span>
                   <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl bg-card/50">
                   <span className="text-xs font-medium">IoT Logs</span>
                   <Switch defaultChecked />
                </div>
             </div>
          </CardContent>
        </Card>

        {/* System & Hardware */}
        <Card className="border-none shadow-lg bg-zinc-900 text-zinc-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Cpu className="h-24 w-24" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                <Cpu className="h-5 w-5" />
              </div>
              <CardTitle>System Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Gateway Version</span>
                  <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">v2.4.0-stable</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">ML Model Engine</span>
                  <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400 uppercase text-[10px]">Active</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Last Sync</span>
                  <span className="font-medium">2 mins ago</span>
               </div>
            </div>
            <Button variant="outline" className="w-full mt-4 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
               Check for Updates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
