"use client";

import { Button } from "@/components/ui/button";
import type { ComponentPropsWithoutRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useAuth } from "@/components/providers/auth-provider";
import { redirects } from "@/lib/config/redirects";

interface LinkQuickBooksButtonProps
  extends ComponentPropsWithoutRef<typeof Button> {
  companyId: number;
}

export function LinkQuickBooksButton({
  className,
  companyId,
  ...props
}: LinkQuickBooksButtonProps) {
  const router = useRouter();
  const { bearerToken } = useAuth()
  if (!bearerToken) {
    throw new Error("LinkQuickBooksButton: No bearer token found")
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async () => client.company.connectQuickBooks.$post({
      companyId,
      redirectUrl: process.env.NEXT_PUBLIC_APP_URL + redirects.app.company(companyId).settings.connections,
    }, {
      headers: {
        Authorization: bearerToken,
      },
    }),
    onSuccess: async (result) => {
      const { url } = await result.json()
      toast.info("Hold on tight, we're taking you to QuickBooks");
      router.push(url);
    },
    onError: () => {
      toast.error("Uh oh!", {
        description: "An error occurred, please try again.",
      });
    },
  });

  return (
    <Button
      className={cn(className)}
      onClick={() => mutate()}
      {...props}
    >
      {isPending && <Loader2 className="mr-2 animate-spin" />}
      Link QuickBooks
    </Button>
  );
}
