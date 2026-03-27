"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Edit2,
  Loader2,
} from "lucide-react";
import { 
  useUpdateUserMutation 
} from "@/lib/redux/api/userApi";
import { User, Role } from "@/types/auth";

interface EditUserDialogProps {
  user: User;
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
  } = useForm({
    defaultValues: {
      username: user.username,
      role: user.role,
      is_active: user.is_active,
    },
  });

  const onUpdateSubmit = async (data: { username: string; role: Role; is_active: boolean }) => {
    try {
      await updateUser({ id: user.id, data }).unwrap();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-none shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit(onUpdateSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
               <Edit2 className="h-6 w-6 text-primary" />
               Edit User Account
            </DialogTitle>
            <DialogDescription>
              Modify system roles and account status for #{user.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-username" className="font-bold">Username</Label>
              <Input 
                id="edit-username" 
                {...register("username")}
                className="bg-card border-none shadow-inner" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role" className="font-bold">System Role</Label>
              <Select onValueChange={(v) => setValue("role", v as Role)} defaultValue={user.role}>
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
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="edit-active"
                {...register("is_active")}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="edit-active" className="font-bold cursor-pointer">Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUpdating} className="w-full h-11 text-base font-semibold">
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
