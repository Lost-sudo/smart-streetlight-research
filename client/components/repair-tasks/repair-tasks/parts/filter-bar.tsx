"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

export function FilterBar({
  search,
  filterType,
  filterStatus,
  onSearchChange,
  onFilterTypeChange,
  onFilterStatusChange,
}: {
  search: string;
  filterType: string;
  filterStatus: string;
  onSearchChange: (v: string) => void;
  onFilterTypeChange: (v: string) => void;
  onFilterStatusChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-border/50">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters
      </div>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nodes, faults..."
          className="pl-9 bg-card border-none"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger className="w-[160px] bg-card border-none">
          <SelectValue placeholder="Source Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="FAULT">Fault Only</SelectItem>
          <SelectItem value="PREDICTIVE">Predictive Only</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className="w-[160px] bg-card border-none">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

