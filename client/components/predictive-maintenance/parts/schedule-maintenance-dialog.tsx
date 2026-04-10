"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ScheduleMaintenanceDialog({
  nodeName,
  predictedFailureDate,
  failureProbability,
  urgencyColorClass,
  onSchedule,
  triggerClassName,
}: {
  nodeName: string;
  predictedFailureDate: string | Date;
  failureProbability: number; // 0..1
  urgencyColorClass: string;
  onSchedule: (args: { scheduledAt?: string; description?: string }) => Promise<void>;
  triggerClassName?: string;
}) {
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleDesc, setScheduleDesc] = useState("");

  const failureProbPercent = useMemo(() => Math.round(failureProbability * 100), [failureProbability]);
  const predictedDateText = useMemo(
    () => new Date(predictedFailureDate).toLocaleDateString(),
    [predictedFailureDate]
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClassName}>
          <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <BrainCircuit className="h-6 w-6 text-violet-500" />
            Schedule Maintenance: {nodeName}
          </DialogTitle>
          <DialogDescription>Create a preventive maintenance task based on LSTM prediction.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="p-4 bg-violet-500/5 rounded-xl space-y-2 border border-violet-500/10">
            <h4 className="flex items-center gap-2 font-bold text-sm text-violet-600">
              <BrainCircuit className="h-4 w-4" />
              ML Prediction Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Failure Probability:</span>
                <span className={`ml-2 font-bold ${urgencyColorClass}`}>{failureProbPercent}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Predicted Date:</span>
                <span className="ml-2 font-medium">{predictedDateText}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-date" className="text-sm font-bold">
              Scheduled Date
            </Label>
            <Input
              id="schedule-date"
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-card border-none shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-desc" className="text-sm font-bold">
              Description
            </Label>
            <Textarea
              id="schedule-desc"
              placeholder="Describe the planned maintenance..."
              className="min-h-[80px] bg-card border-none shadow-inner"
              value={scheduleDesc}
              onChange={(e) => setScheduleDesc(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            className="font-semibold bg-violet-600 hover:bg-violet-700"
            onClick={() => onSchedule({ scheduledAt: scheduleDate || undefined, description: scheduleDesc || undefined })}
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            Schedule Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

