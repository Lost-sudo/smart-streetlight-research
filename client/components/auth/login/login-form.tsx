"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { LoginInput, LoginSchema } from "@/types/auth";

export function LoginForm() {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const submitDisabled = useMemo(() => authLoading || isSubmitting, [authLoading, isSubmitting]);

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      await login(data);
    } catch (err) {
      const e = err as any;
      const msg =
        e?.data?.detail ??
        e?.data?.message ??
        (typeof e?.error === "string" ? e.error : null) ??
        e?.message ??
        "Login failed. Please check your credentials and try again.";
      setFormError(String(msg));
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">System Access</CardTitle>
        <CardDescription className="text-center">Enter your credentials to access the system</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-6">
          {formError && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                {...register("username")}
                type="text"
                placeholder="Username"
                autoComplete="username"
                inputMode="text"
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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`pl-10 pr-10 h-11 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
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
            disabled={submitDisabled}
          >
            {submitDisabled ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Login"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Authorized Personnel Only. All actions are logged.</p>
        </CardFooter>
      </form>
    </Card>
  );
}

