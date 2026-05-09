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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings as SettingsIcon, 
  Bell, 
  ShieldAlert, 
  Cpu, 
  Moon, 
  Save, 
  RefreshCw,
  Gauge,
  Brain,
  Download,
  Database,
  History,
  Zap,
  Activity,
  Calendar
} from "lucide-react";

export default function SettingsPage() {
  const [training, setTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const handleRetrain = () => {
    setTraining(true);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTraining(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            System Settings
          </h2>
          <p className="text-muted-foreground italic mt-1">
            Configure AI models, data pipelines, and operational intelligence.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Machine Learning Operations */}
        <Card className="border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md lg:col-span-2 overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">ML Model Operations</CardTitle>
                  <CardDescription>Continuous learning and model optimization controls.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                <Zap className="h-3 w-3 mr-1 fill-current" />
                Real-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Active Prediction Model</Label>
                  <Select defaultValue="random-forest">
                    <SelectTrigger className="bg-muted/50 border-none h-11">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random-forest">Random Forest Classifier (Production)</SelectItem>
                      <SelectItem value="lstm">LSTM Neural Network (Experimental)</SelectItem>
                      <SelectItem value="xgboost">XGBoost Regression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Model Accuracy</span>
                    <p className="text-2xl font-bold">98.4%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Last Trained</span>
                    <p className="text-sm font-semibold mt-2">24h ago</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between p-6 rounded-3xl bg-zinc-900 text-zinc-100 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                   <Activity className="h-32 w-32" />
                </div>
                <div className="space-y-2 relative z-10">
                  <h4 className="font-bold flex items-center gap-2">
                    Model Retraining
                    {training && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Triggering a retrain will process all newly collected telemetry data to refine the predictive maintenance algorithms.
                  </p>
                </div>
                
                <div className="mt-6 space-y-3 relative z-10">
                  {training && (
                    <div className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                         <span>PROCESS_DATA_CHUNKS</span>
                         <span>{trainingProgress}%</span>
                       </div>
                       <Progress value={trainingProgress} className="h-1.5 bg-zinc-800" />
                    </div>
                  )}
                  <Button 
                    onClick={handleRetrain} 
                    disabled={training}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-600/20"
                  >
                    {training ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4 fill-current" />
                    )}
                    {training ? "Training Pipeline Active..." : "Initiate Retraining"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Data Repository</CardTitle>
                <CardDescription>Telemetry logs and export tools.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                 <div className="space-y-0.5">
                    <p className="text-sm font-bold">Total Telemetry Points</p>
                    <p className="text-2xl font-black">1.2M+</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Storage Use</p>
                    <p className="text-sm font-mono">154.2 MB</p>
                 </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Export Options</Label>
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="outline" className="border-none bg-muted/50 hover:bg-muted font-bold text-xs h-12">
                      <Download className="mr-2 h-4 w-4" />
                      JSON
                   </Button>
                   <Button variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs h-12 shadow-none">
                      <Download className="mr-2 h-4 w-4" />
                      CSV (Excel)
                   </Button>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-bold">Auto-Archive</Label>
                <p className="text-xs text-muted-foreground">Move data to cold storage after 1 year.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Communication */}
        <Card className="border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Notification Hub</CardTitle>
                <CardDescription>Alert distribution settings.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label className="text-sm font-bold">Primary Maintenance Email</Label>
                <Input placeholder="alerts@smartcity.gov" className="bg-muted/50 border-none" />
             </div>
             <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-card/30">
                   <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium">Critical Push Alerts</span>
                   </div>
                   <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-card/30">
                   <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-zinc-500" />
                      <span className="text-xs font-medium">Verbose IoT Logs</span>
                   </div>
                   <Switch />
                </div>
             </div>
          </CardContent>
        </Card>

        {/* System Information (Dark Card) */}
        <Card className="border-none shadow-2xl bg-zinc-950 text-zinc-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Cpu className="h-32 w-32" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <CardTitle>Core System</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
               <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Firmware Cluster</span>
                  <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">v2.4.0-STABLE</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">ML Engine Status</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-none text-[10px] h-5 px-1.5 font-black uppercase tracking-tighter">Healthy</Badge>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Node Connectivity</span>
                  <span className="font-medium text-blue-400">99.8% Uptime</span>
               </div>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="space-y-3">
               <Button variant="outline" className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-xs h-9">
                  View System Logs
               </Button>
               <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-transparent text-[10px] h-6">
                  Reboot Management Gateway
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
