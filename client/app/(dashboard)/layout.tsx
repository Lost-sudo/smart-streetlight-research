import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="hidden md:flex w-64 flex-col" />
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/50">
        {children}
      </main>
    </div>
  );
}
