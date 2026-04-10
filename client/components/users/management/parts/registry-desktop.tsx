"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MoreVertical } from "lucide-react";

import { EditUserDialog } from "@/components/users/EditUserDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { roleColors, roleIcons } from "@/components/users/management/utils";

export function RegistryDesktop({
  users,
  isFetching,
}: {
  users: any[];
  isFetching: boolean;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <Table className="min-w-[900px] lg:min-w-full">
        <TableHeader className="bg-muted/50 text-sm">
          <TableRow>
            <TableHead className="font-bold">Username</TableHead>
            <TableHead className="font-bold">System Role</TableHead>
            <TableHead className="font-bold text-center">Account Status</TableHead>
            <TableHead className="font-bold">Created At</TableHead>
            <TableHead className="text-right font-bold w-[120px]">Management</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetching ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground font-medium">Loading system registry...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : users.length > 0 ? (
            users.map((user) => {
              const RoleIcon = roleIcons[user.role];
              return (
                <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground capitalize">{user.username}</span>
                      <span className="text-xs text-muted-foreground font-medium">#{user.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold capitalize ${roleColors[user.role]}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                      <span className="text-sm font-bold">{user.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-bold">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                      : "---"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditUserDialog user={user} />
                      <DeleteUserDialog userId={user.id} username={user.username} />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                No users matched your search criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

