"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateStreetlightMutation } from "@/lib/redux/api/streetlightApi";
import type { Streetlight } from "@/lib/redux/api/streetlightApi";

const editNodeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  device_id: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.string().min(1, "Status is required"),
  model_info: z.string().min(1, "Model info is required"),
});

type EditNodeFormValues = z.infer<typeof editNodeSchema>;

interface EditNodeDialogProps {
  node: Streetlight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditNodeDialog({ node, open, onOpenChange }: EditNodeDialogProps) {
  const [updateStreetlight, { isLoading }] = useUpdateStreetlightMutation();

  const form = useForm<EditNodeFormValues>({
    resolver: zodResolver(editNodeSchema),
    defaultValues: {
      name: "",
      device_id: "",
      latitude: 0,
      longitude: 0,
      status: "active",
      model_info: "",
    },
  });

  // Reset form values when the node changes or dialog opens
  useEffect(() => {
    if (node && open) {
      form.reset({
        name: node.name,
        device_id: node.device_id || "",
        latitude: node.latitude,
        longitude: node.longitude,
        status: node.status,
        model_info: node.model_info,
      });
    }
  }, [node, open, form]);

  const onSubmit = async (data: EditNodeFormValues) => {
    if (!node) return;
    try {
      await updateStreetlight({
        id: node.id,
        data: {
          ...data,
          device_id: data.device_id || undefined,
        },
      }).unwrap();

      toast.success("Node updated successfully");
      onOpenChange(false);
    } catch (error) {
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || "Failed to update node");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Streetlight Node</DialogTitle>
          <DialogDescription>
            Update the configuration for {node?.name || "this node"}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Node Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Node 5 - North Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="device_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device ID (MAC Address / Serial)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. HW-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.0000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.0000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="faulty">Faulty</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </div>

            <FormField
              control={form.control}
              name="model_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Info</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Standard LED Node" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
