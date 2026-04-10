"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Technician } from "@/lib/redux/api/repairTaskApi";

export function AssignTechnicianDialog({
  availableTechnicians,
  onAssign,
  triggerClassName,
}: {
  availableTechnicians: Technician[];
  onAssign: (technicianId: number) => Promise<void>;
  triggerClassName?: string;
}) {
  const [selectedTech, setSelectedTech] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClassName}>
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>Select a technician for this maintenance task.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 py-4">
          <Select value={selectedTech} onValueChange={setSelectedTech}>
            <SelectTrigger className="flex-1 bg-white dark:bg-zinc-900 border-none shadow-sm">
              <SelectValue placeholder="Select technician..." />
            </SelectTrigger>
            <SelectContent>
              {availableTechnicians.map((tech) => (
                <SelectItem key={tech.id} value={String(tech.id)}>
                  {tech.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selectedTech} onClick={() => onAssign(Number(selectedTech))} size="sm" className="h-10 px-4">
            Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

