"use client";

import { useAuth } from "@/providers/auth-provider";
import { ROLE_PERMISSIONS, Role } from "@/types/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RouteProtected({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthorized = useMemo(() => {
    if (isLoading || !user) return null;

    // Role-based path authorization
    // Extract first segment: /monitoring -> monitoring, / -> dashboard
    const segment = pathname === "/" ? "dashboard" : pathname.split("/")[1];
    
    // Type-safe lookup for roles
    const allowedSegments = ROLE_PERMISSIONS[user.role as Role] as readonly string[];
    
    // Check if current path segment is in the allowed list
    return allowedSegments.includes(segment);
  }, [user, isLoading, pathname]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Checking Permissions...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-red-100 dark:border-red-900/20 flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            Your role as <span className="font-bold text-foreground">{(user?.role || "UNKNOWN").toLowerCase()}</span> does not have permission to view the <span className="font-bold text-foreground">{pathname}</span> page.
          </p>
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button variant="outline" onClick={() => router.back()} className="rounded-xl">Go Back</Button>
            <Button onClick={() => router.push("/")} className="rounded-xl">Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
