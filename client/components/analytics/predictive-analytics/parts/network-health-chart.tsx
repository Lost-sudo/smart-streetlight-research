"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export function NetworkHealthChart({
  chartData,
}: {
  chartData: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <Card className="col-span-1 border-none shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-lg">Network Health Summary</CardTitle>
        <CardDescription>Live real-time node distribution</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}

