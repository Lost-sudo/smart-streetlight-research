"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { LoginSchema, LoginInput } from "@/types/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    
    try {
      await login(data);
    } catch (err) {
      console.error("Login component error", err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      
      <div className="z-10 w-full max-w-md p-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-xl">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">SmartLight</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Autonomous Grid</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">System Access</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username" 
                    {...register("username")}
                    type="text" 
                    placeholder="Username" 
                    className={`pl-10 h-11 ${errors.username ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />

                </div>
                {errors.username && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    {...register("password")}
                    type={showPassword ? "text" : "password"} 
                    className={`pl-10 pr-10 h-11 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button 
                className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02]" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Authorized Personnel Only. All actions are logged.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}


