"use client";

import React, { createContext, useContext, useState } from "react";
import { User, Role } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get from localStorage first
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("smartlight_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          console.error("Failed to parse user session", e);
          localStorage.removeItem("smartlight_user");
        }
      }
    }
    
    // Default fallback user for development
    return {
      id: "u123",
      name: "System Admin",
      email: "admin@smartlight.io",
      role: "ADMIN"
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = (role: Role) => {
    setIsLoading(true);
    
    // Mock user based on role
    const mockUser: User = {
      id: "u123",
      name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()}`,
      email: `${role.toLowerCase()}@smartlight.io`,
      role: role,
    };
    
    setUser(mockUser);
    localStorage.setItem("smartlight_user", JSON.stringify(mockUser));
    
    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 800);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("smartlight_user");
    router.push("/login");
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
