"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

import { EditUserDialog } from "@/components/users/EditUserDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { roleColors, roleIcons } from "@/components/users/management/utils";

export function RegistryMobile({
  users,
  isFetching,
}: {
  users: any[];
  isFetching: boolean;
}) {
  return (
    <div className="grid gap-4 p-4 md:hidden">
      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Refreshing user registry...</p>
        </div>
      ) : users.length > 0 ? (
        users.map((user) => {
          const RoleIcon = roleIcons[user.role];
          return (
            <div key={user.id} className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-bold text-foreground capitalize text-lg">{user.username}</span>
                  <span className="text-xs text-muted-foreground font-medium">#{user.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <EditUserDialog user={user} />
                  <DeleteUserDialog userId={user.id} username={user.username} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground font-semibold mb-1">Role</p>
                  <Badge
                    variant="outline"
                    className={`flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold capitalize ${roleColors[user.role]}`}
                  >
                    <RoleIcon className="h-3 w-3" />
                    {user.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                    <span className="font-bold">{user.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground font-semibold mb-1">Created At</p>
                  <p className="font-bold">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                      : "---"}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12 text-muted-foreground font-medium">No users matched your search criteria.</div>
      )}
    </div>
  );
}

