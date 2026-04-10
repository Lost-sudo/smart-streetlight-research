import { z } from "zod";

export const RoleSchema = z.enum(["admin", "operator", "technician", "viewer"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: RoleSchema,
  is_active: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const UserCreateSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: RoleSchema,
});
export type UserCreate = z.infer<typeof UserCreateSchema>;


export const AuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ROLE_PERMISSIONS = {
  admin: [
    "dashboard",
    "monitoring",
    "analytics",
    "immediate-repairs",
    "predictive-maintenance",
    "repair-tasks",
    "my-assigned-tasks",
    "reports",
    "users",
    "settings",
  ],
  operator: [
    "dashboard",
    "monitoring",
    "analytics",
    "immediate-repairs",
    "predictive-maintenance",
    "repair-tasks",
    "my-assigned-tasks",
    "reports",
    "settings",
  ],
  technician: [
    "dashboard",
    "monitoring",
    "immediate-repairs",
    "repair-tasks",
    "my-assigned-tasks",
    "settings"
  ],
  viewer: ["dashboard", "reports"],
} as const;
