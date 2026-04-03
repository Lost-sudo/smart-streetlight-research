import { useState } from "react";
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
  DialogTrigger,
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
import { useCreateStreetlightMutation } from "@/lib/redux/api/streetlightApi";

const nodeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  device_id: z.string().min(1, "Device ID is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type NodeFormValues = z.infer<typeof nodeSchema>;

export function CreateNodeDialog() {
  const [open, setOpen] = useState(false);
  const [createStreetlight, { isLoading }] = useCreateStreetlightMutation();

  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeSchema),
    defaultValues: {
      name: "",
      device_id: "",
      latitude: 0,
      longitude: 0,
    },
  });

  const onSubmit = async (data: NodeFormValues) => {
    try {
      await createStreetlight({
        ...data,
        model_info: "Standard LED Node",
        installation_date: new Date().toISOString(),
        status: "active", // matches DB enum: active, inactive, faulty, maintenance
        is_on: false,
      }).unwrap();
      
      toast.success("Streetlight node created successfully");
      setOpen(false);
      form.reset();
    } catch (error) {
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || "Failed to create node");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Node</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Streetlight Node</DialogTitle>
          <DialogDescription>
            Register a new physical node to the dashboard. The Device ID must match the hardware&apos;s unique identifier.
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Node
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
