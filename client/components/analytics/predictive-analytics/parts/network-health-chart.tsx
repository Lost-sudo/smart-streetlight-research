"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Activity } from "lucide-react";

export function NetworkHealthChart({
  chartData,
}: {
  chartData: Array<{ name: string; value: number; color: string }>;
}) {
  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="col-span-1 border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">Network Health</CardTitle>
            <CardDescription className="text-xs uppercase font-medium tracking-widest text-muted-foreground mt-1">Live Intelligence Distribution</CardDescription>
          </div>
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform duration-500">
             <Activity className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[320px] relative">
        {chartData.length > 0 ? (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
               <span className="text-4xl font-black tracking-tighter text-foreground">{total}</span>
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Nodes</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:opacity-80 transition-opacity cursor-pointer shadow-xl"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    color: '#fff',
                    padding: '12px'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={40} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <p className="font-medium">Synthesizing network data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
