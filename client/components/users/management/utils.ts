import type { Role } from "@/types/auth";
import type { LucideIcon } from "lucide-react";
import { Eye, Shield, User as UserIcon, Wrench } from "lucide-react";

export const roleIcons: Record<Role, LucideIcon> = {
  admin: Shield,
  operator: UserIcon,
  technician: Wrench,
  viewer: Eye,
};

export const roleColors: Record<Role, string> = {
  admin: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  operator: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  technician: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  viewer: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

