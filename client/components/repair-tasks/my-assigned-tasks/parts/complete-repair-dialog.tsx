"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";

export interface RepairLogFormData {
  diagnosis: string;
  action_taken: string;
  parts_replaced: string;
  repair_duration_minutes: string;
  notes: string;
}

export const emptyRepairLogForm: RepairLogFormData = {
  diagnosis: "",
  action_taken: "",
  parts_replaced: "",
  repair_duration_minutes: "",
  notes: "",
};

export function CompleteRepairDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  isUpdating,
  onFinalize,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: RepairLogFormData;
  onFormChange: (field: keyof RepairLogFormData, value: string) => void;
  isUpdating: boolean;
  onFinalize: () => void;
}) {
  const isValid = formData.diagnosis.trim().length > 0 && formData.action_taken.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Complete Repair</DialogTitle>
          <DialogDescription>
            Fill in the repair log details before finalizing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="text-sm font-medium">
              Diagnosis <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="diagnosis"
              placeholder="What was the root cause? (e.g., corroded wiring, failed LED driver)"
              className="min-h-[80px] rounded-xl resize-none"
              value={formData.diagnosis}
              onChange={(e) => onFormChange("diagnosis", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_taken" className="text-sm font-medium">
              Action Taken <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="action_taken"
              placeholder="What was done? (e.g., replaced driver board, re-soldered connections)"
              className="min-h-[80px] rounded-xl resize-none"
              value={formData.action_taken}
              onChange={(e) => onFormChange("action_taken", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parts_replaced" className="text-sm font-medium">
                Parts Replaced
              </Label>
              <Input
                id="parts_replaced"
                placeholder="e.g., LED driver, fuse"
                className="rounded-xl"
                value={formData.parts_replaced}
                onChange={(e) => onFormChange("parts_replaced", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min="0"
                placeholder="e.g., 45"
                className="rounded-xl"
                value={formData.repair_duration_minutes}
                onChange={(e) => onFormChange("repair_duration_minutes", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any other observations or follow-up actions..."
              className="min-h-[60px] rounded-xl resize-none"
              value={formData.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold"
            onClick={onFinalize}
            disabled={isUpdating || !isValid}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Finalize Repair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
