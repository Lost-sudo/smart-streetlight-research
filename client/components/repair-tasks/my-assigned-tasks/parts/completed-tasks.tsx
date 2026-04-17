"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";

export function CompletedTasks({
  tasks,
}: {
  tasks: Array<{ id: string; nodeName: string; alertType: string }>;
}) {
  if (tasks.length === 0) return null;

  return (
    <Card className="border-border/40 opacity-75">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium">Recently Completed</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            {tasks.slice(0, 5).map((task) => (
              <TableRow key={task.id} className="hover:bg-transparent">
                <TableCell className="text-muted-foreground line-through italic text-xs">{task.nodeName}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{task.alertType}</TableCell>
                <TableCell className="text-right">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

