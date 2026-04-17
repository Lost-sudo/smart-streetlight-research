"use client";

import { useMemo, useState } from "react";

import { useGetUsersQuery, useCreateUserMutation } from "@/lib/redux/api/userApi";
import type { User, UserCreate } from "@/types/auth";

import { AddUserDialog } from "@/components/users/management/parts/add-user-dialog";
import { RegistryHeader } from "@/components/users/management/parts/registry-header";
import { RegistryMobile } from "@/components/users/management/parts/registry-mobile";
import { RegistryDesktop } from "@/components/users/management/parts/registry-desktop";
import { StatsCards } from "@/components/users/management/parts/stats-cards";

export function UserManagementPage() {
  const { data: users = [], isLoading: isFetching } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const [search, setSearch] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const filteredUsers = useMemo(
    () => users.filter((user: User) => user.username.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  const adminCount = useMemo(() => users.filter((u: User) => u.role === "admin").length, [users]);
  const activeCount = useMemo(() => users.filter((u: User) => u.is_active).length, [users]);

  const onAddUserSubmit = async (data: UserCreate) => {
    try {
      await createUser(data).unwrap();
    } catch (err) {
      console.error("Failed to create user", err);
      throw err;
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground italic">
            Admin-only privilege for roles and system access.
          </p>
        </div>

        <AddUserDialog
          open={isAddUserOpen}
          onOpenChange={setIsAddUserOpen}
          isCreating={isCreating}
          onCreate={onAddUserSubmit}
        />
      </div>

      <StatsCards adminCount={adminCount} activeCount={activeCount} totalCount={users.length} />

      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <RegistryHeader search={search} onSearchChange={setSearch} />
        <RegistryMobile users={filteredUsers} isFetching={isFetching} />
        <RegistryDesktop users={filteredUsers} isFetching={isFetching} />
      </div>
    </div>
  );
}

