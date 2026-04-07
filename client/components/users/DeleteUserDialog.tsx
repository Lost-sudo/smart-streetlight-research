"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { 
  useDeleteUserMutation 
} from "@/lib/redux/api/userApi";

interface DeleteUserDialogProps {
  userId: number;
  username: string;
}

export function DeleteUserDialog({ userId, username }: DeleteUserDialogProps) {
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [isOpen, setIsOpen] = useState(false);

  const onDeleteConfirm = async () => {
    try {
      await deleteUser(userId).unwrap();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-none shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Delete User
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Are you sure you want to delete the user <span className="font-bold text-foreground">&quot;{username}&quot;</span>? This action cannot be undone and will permanently remove their access to the system.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDeleteConfirm} 
            disabled={isDeleting} 
            className="w-full sm:w-auto font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
