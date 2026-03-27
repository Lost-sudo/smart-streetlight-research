"use client";

import React, { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectCurrentUser, selectAuthLoading, logOut } from "@/lib/redux/slices/authSlice";
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
  const dispatch = useAppDispatch();
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
      await logoutTrigger().unwrap();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
      dispatch(logOut()); // Force logout anyway
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
