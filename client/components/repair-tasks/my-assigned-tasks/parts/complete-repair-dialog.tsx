"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";

export function CompleteRepairDialog({
  open,
  onOpenChange,
  notes,
  onNotesChange,
  isUpdating,
  onFinalize,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  isUpdating: boolean;
  onFinalize: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Complete Repair</DialogTitle>
          <DialogDescription>Please provide details about the work performed and the resolution.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Diagnosis & Repair Notes</p>
            <Textarea
              placeholder="Describe what was fixed (e.g., replaced LED driver, tightened loose connection)..."
              className="min-h-[120px] rounded-xl resize-none"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold"
            onClick={onFinalize}
            disabled={isUpdating || !notes.trim()}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Finalize Repair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

