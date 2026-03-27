"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Wrench,
  FileBarChart,
  Users,
  Settings,
  Zap,
  LogOut,
  User as UserIcon,
  LucideIcon
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Role } from "@/types/auth";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: Role[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "operator", "technician", "viewer"],
  },
  {
    title: "Node Monitoring",
    href: "/monitoring",
    icon: Lightbulb,
    allowedRoles: ["admin", "operator", "technician"],
  },
  {
    title: "Predictive Analytics",
    href: "/analytics",
    icon: LineChart,
    allowedRoles: ["admin", "operator"],
  },
  {
    title: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    allowedRoles: ["admin", "operator", "technician"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileBarChart,
    allowedRoles: ["admin", "operator", "viewer"],
  },
  {
    title: "User Management",
    href: "/users",
    icon: Users,
    allowedRoles: ["admin"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    allowedRoles: ["admin", "operator", "technician"],
  },
];

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Filter items based on user role
  const filteredItems = sidebarItems.filter(item => 
    !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  return (
    <div className={cn("flex flex-col h-screen border-r bg-card", className)}>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-4 mb-6">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">SmartLight</h1>
            </div>
            
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 h-10 px-4 transition-all",
                    pathname === item.href && "bg-secondary/50 font-semibold"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile & Logout Section */}
      <div className="mt-auto p-4 border-t bg-slate-50/50 dark:bg-zinc-950/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold truncate">{user?.username || "Guest"}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {user?.role || "No Role"}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
