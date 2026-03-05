export type Role = "ADMIN" | "OPERATOR" | "TECHNICIAN" | "VIEWER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const ROLE_PERMISSIONS = {
  ADMIN: [
    "dashboard",
    "monitoring",
    "analytics",
    "maintenance",
    "reports",
    "users",
    "settings",
  ],
  OPERATOR: [
    "dashboard",
    "monitoring",
    "analytics",
    "maintenance",
    "reports",
    "settings",
  ],
  TECHNICIAN: ["dashboard", "monitoring", "maintenance", "settings"],
  VIEWER: ["dashboard", "reports"],
} as const;
