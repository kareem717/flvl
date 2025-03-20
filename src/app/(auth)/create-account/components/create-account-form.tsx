"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { CreateAccountParamsSchema } from "@/lib/db/validators";
import { useRouter } from "next/navigation";
import { redirects } from "@/lib/config/redirects";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface CreateAccountFormProps
  extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> {
  triggerProps?: ComponentPropsWithoutRef<typeof Button>;
  email?: string;
}

type CreateAccountFormValues = z.infer<typeof CreateAccountParamsSchema>;

export function CreateAccountForm({
  className,
  triggerProps,
  email,
  ...props
}: CreateAccountFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();


  const { mutate, isPending } = useMutation({
    mutationFn: async (values: CreateAccountFormValues) => {
      const token = await getToken()
      if (!token) {
        throw new Error("No token found")
      }

      const result = await client.auth.createAccount.$post(values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("result", result)
      return await result.json();
    },
    onSuccess: (result) => {
      form.reset();

      toast.success(
        "Success!",
        {
          description:
            "Account created successfully. We're redirecting you to the dashboard.",
        });

      router.push(redirects.app.root);
    },
    onError: (error) => {
      toast.error("Uh oh! An error occurred.", {
        description: error.message,
      });
    },
  })

  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(CreateAccountParamsSchema),
    defaultValues: {
      email: email || "",
    },
  })

  function onSubmit(values: CreateAccountFormValues) {
    mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>

  );
}
