"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  User as UserIcon, 
  Wrench, 
  Eye, 
  Trash2, 
  Lock,
  History as HistoryIcon,
  Loader2,
  AlertCircle,
  type LucideIcon
} from "lucide-react";
import { 
  useGetUsersQuery, 
  useCreateUserMutation, 
  useDeleteUserMutation
} from "@/lib/redux/api/userApi";
import { UserCreate, UserCreateSchema, Role } from "@/types/auth";

const roleIcons: Record<Role, LucideIcon> = {
  admin: Shield,
  operator: UserIcon,
  technician: Wrench,
  viewer: Eye,
};

const roleColors: Record<Role, string> = {
  admin: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  operator: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  technician: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  viewer: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

import { EditUserDialog } from "@/components/users/EditUserDialog";

export default function UserManagementPage() {
  const { data: users = [], isLoading: isFetching } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  
  const [search, setSearch] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserCreate>({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "viewer",
    },
  });

  const onAddUserSubmit = async (data: UserCreate) => {
    try {
      await createUser(data).unwrap();
      setIsAddUserOpen(false);
      reset();
    } catch (err) {
      console.error("Failed to create user", err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground italic">Admin-only privilege for roles and system access.</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={(open) => {
          setIsAddUserOpen(open);
          if (!open) reset();
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95">
              <UserPlus className="mr-2 h-4 w-4" />
              Add System User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSubmit(onAddUserSubmit)}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                   <UserPlus className="h-6 w-6 text-primary" />
                   Create New Account
                </DialogTitle>
                <DialogDescription className="text-base">
                  Assign a role and grant access to the SmartLight network.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username" className="font-bold">Username</Label>
                  <Input 
                    id="username" 
                    {...register("username")}
                    placeholder="juandlc" 
                    className={`bg-card border-none shadow-inner ${errors.username ? "ring-2 ring-destructive" : ""}`} 
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.username.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" title="Password must be at least 6 characters" className="font-bold">Password</Label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input 
                      id="password" 
                      type="password"
                      {...register("password")}
                      placeholder="••••••••" 
                      className={`pl-10 bg-card border-none shadow-inner ${errors.password ? "ring-2 ring-destructive" : ""}`} 
                     />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="font-bold">System Role</Label>
                  <Select onValueChange={(v) => setValue("role", v as Role)} defaultValue="viewer">
                    <SelectTrigger className="bg-card border-none shadow-inner">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Full Access)</SelectItem>
                      <SelectItem value="operator">Operator (Monitor & Control)</SelectItem>
                      <SelectItem value="technician">Technician (Maintenance)</SelectItem>
                      <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isCreating} className="w-full h-11 text-base font-semibold">
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : "Register User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admin Accounts</p>
              <h3 className="text-2xl font-bold">{users.filter(u => u.role === "admin").length}</h3>
            </div>
         </div>
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <h3 className="text-2xl font-bold">{users.filter(u => u.is_active).length}</h3>
            </div>
         </div>
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <Lock className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Security Status</p>
              <h3 className="text-2xl font-bold">Encrypted</h3>
            </div>
         </div>
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-zinc-500/10 p-3 rounded-xl text-zinc-500">
               <HistoryIcon className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm font-medium text-muted-foreground">Total Registry</p>
               <h3 className="text-2xl font-bold">{users.length} Users</h3>
            </div>
         </div>
      </div>

      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h3 className="font-bold text-lg">System Access Registry</h3>
           <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                 placeholder="Search by username..." 
                 className="flex h-10 w-full rounded-md border-none bg-card px-9 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        {/* Mobile View (Cards) */}
        <div className="grid gap-4 p-4 md:hidden">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Refreshing user registry...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors" 
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-semibold mb-1">Role</p>
                      <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold capitalize ${roleColors[user.role]}`}>
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
                      <p className="font-bold">{user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "---"}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground font-medium">
              No users matched your search criteria.
            </div>
          )}
        </div>

        {/* Desktop View (Table) */}
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
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
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
                        <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold capitalize ${roleColors[user.role]}`}>
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
                        {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "---"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditUserDialog user={user} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
      </div>
    </div>
  );
}
