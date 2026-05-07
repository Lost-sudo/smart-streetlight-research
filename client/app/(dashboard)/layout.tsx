import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { RouteProtected } from "@/components/auth/route-protected";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RouteProtected>
      <div className="flex h-screen overflow-hidden flex-col md:flex-row">
        <MobileNav />
        <Sidebar className="hidden md:flex w-64 flex-col" />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/50">
          {children}
        </main>
      </div>
    </RouteProtected>
  );
}
