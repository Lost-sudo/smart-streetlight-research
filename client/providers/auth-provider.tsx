"use client";

import React, { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentUser, selectAuthLoading } from "@/lib/redux/slices/authSlice";
import { useLoginMutation, useLogoutMutation } from "@/lib/redux/api/authApi";
import { User, LoginInput } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectAuthLoading);
  const router = useRouter();
  const [loginTrigger] = useLoginMutation();
  const [logoutTrigger] = useLogoutMutation();

  const login = async (data: LoginInput) => {
    try {
      await loginTrigger(data).unwrap();
      router.push("/");
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };


  const logout = async () => {
    try {
      // The logout mutation in authApi handles dispatch(logOut()) 
      // in onQueryStarted for both success and failure cases.
      await logoutTrigger().unwrap();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
