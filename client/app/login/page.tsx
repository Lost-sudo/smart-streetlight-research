import { Zap } from "lucide-react";
import { LoginForm } from "@/components/auth/login";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 overflow-hidden">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />

      <div className="z-10 w-full max-w-md p-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-xl">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">SmartLight</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Autonomous Grid
            </p>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}


