"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateCompanyParamsSchema } from "@/lib/db/validators";
import { useRouter } from "next/navigation";
import { redirects } from "@/lib/config/redirects";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

interface CreateCompanyDialogProps
  extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> {
  triggerProps?: ComponentPropsWithoutRef<typeof Button>;
}

type CreateCompanyFormValues = z.infer<typeof CreateCompanyParamsSchema>;

export function CreateCompanyDialog({
  className,
  triggerProps,
  ...props
}: CreateCompanyDialogProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { bearerToken } = useAuth();
  if (!bearerToken) {
    throw new Error("CreateCompanyDialog: No bearer token found")
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: CreateCompanyFormValues) => {
      const result = await client.company.create.$post(values, {
        headers: {
          Authorization: bearerToken,
        },
      });
      return await result.json();
    },
    onSuccess: (result) => {
      form.reset();
      setDialogOpen(false);

      toast.success(
        "Success!",
        {
          description:
            "Account linked successfully. We're redirecting you to the dashboard.",
        });

      router.push(redirects.app.company(result.id).root);
    },
    onError: (error) => {
      toast.error("Uh oh! An error occurred.", {
        description: error.message,
      });
    },
  })

  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(CreateCompanyParamsSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })



  // 2. Define a submit handler.
  function onSubmit(values: CreateCompanyFormValues) {
    mutate(values);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({
            variant: triggerProps?.variant,
            size: triggerProps?.size,
          }),
          triggerProps?.className,
        )}
      >
        {triggerProps?.children || "New"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
          <DialogDescription>
            Some stuff about adding a linked account
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn("space-y-4", className)}
            {...props}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a name for this connection"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This name will help you identify this linked account, try to
                    use either your company name or the name used on the third
                    party service you want to link.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a name for this connection"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use either the same email you use on the party services
                    (i.e. QuickBooks) you want to link.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 animate-spin" />}
              Create Company
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
