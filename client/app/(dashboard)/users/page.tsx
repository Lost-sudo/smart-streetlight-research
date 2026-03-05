"use client";

import { useState } from "react";
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
  User, 
  Wrench, 
  Eye, 
  Mail, 
  Trash2, 
  Edit2,
  Lock,
  History as HistoryIcon
} from "lucide-react";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Operator" | "Technician" | "Viewer";
  status: "Active" | "Inactive";
  lastActive: string;
}

const initialUsers: UserAccount[] = [
  {
    id: "1",
    name: "John Patrick",
    email: "admin@lgu.gov.ph",
    role: "Admin",
    status: "Active",
    lastActive: "Now",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.operator@lgu.gov.ph",
    role: "Operator",
    status: "Active",
    lastActive: "2 hours ago",
  },
  {
    id: "3",
    name: "Engr. Reyes",
    email: "reyes.tech@service.ph",
    role: "Technician",
    status: "Active",
    lastActive: "1 day ago",
  },
  {
    id: "4",
    name: "City Auditor",
    email: "auditor@lgu.gov.ph",
    role: "Viewer",
    status: "Inactive",
    lastActive: "5 days ago",
  },
];

const roleIcons = {
  Admin: Shield,
  Operator: User,
  Technician: Wrench,
  Viewer: Eye,
};

const roleColors = {
  Admin: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  Operator: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  Technician: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  Viewer: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground italic">Admin-only privilege for roles and system access.</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95">
              <UserPlus className="mr-2 h-4 w-4" />
              Add System User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl backdrop-blur-xl">
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
                <Label htmlFor="name" className="font-bold">Full Name</Label>
                <Input id="name" placeholder="Juan Dela Cruz" className="bg-card border-none shadow-inner" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-bold">Email Address</Label>
                <div className="relative">
                   <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                   <Input id="email" placeholder="juan@lgu.gov.ph" className="pl-10 bg-card border-none shadow-inner" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="font-bold">System Role</Label>
                <Select defaultValue="Viewer">
                  <SelectTrigger className="bg-card border-none shadow-inner">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                    <SelectItem value="Operator">Operator (Monitor \u0026 Control)</SelectItem>
                    <SelectItem value="Technician">Technician (Maintenance)</SelectItem>
                    <SelectItem value="Viewer">Viewer (Read Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={() => setIsAddUserOpen(false)} className="w-full h-11 text-base font-semibold">
                Register User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admin Accounts</p>
              <h3 className="text-2xl font-bold">1</h3>
            </div>
         </div>
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
              <h3 className="text-2xl font-bold">2</h3>
            </div>
         </div>
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <Lock className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Security Logs</p>
              <h3 className="text-2xl font-bold">100% OK</h3>
            </div>
         </div>
         <div className="bg-card/50 border border-border/50 rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-zinc-500/10 p-3 rounded-xl text-zinc-500">
               <HistoryIcon className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm font-medium text-muted-foreground">Total Registry</p>
               <h3 className="text-2xl font-bold">4 Users</h3>
            </div>
         </div>
      </div>

      <div className="rounded-2xl border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="font-bold text-lg">System Access Registry</h3>
           <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                 placeholder="Search by name or email..." 
                 className="pl-9 bg-card border-none shadow-sm"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Personnel</TableHead>
              <TableHead className="font-bold">System Role</TableHead>
              <TableHead className="font-bold">Account Status</TableHead>
              <TableHead className="font-bold">Last Activity</TableHead>
              <TableHead className="text-right font-bold w-[150px]">Management</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role];
                return (
                  <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground font-medium">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold ${roleColors[user.role]}`}>
                        <RoleIcon className="h-3 w-3" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full animate-pulse ${user.status === "Active" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        <span className="text-sm font-medium">{user.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">
                      {user.lastActive}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all">
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
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users matched your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
