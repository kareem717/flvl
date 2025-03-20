"use client";

import {
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu as SidebarMenuComponent,
} from "@/components/ui/sidebar";
import type { ComponentPropsWithoutRef } from "react";
import { ChevronsUpDown, LinkIcon, Plus } from "lucide-react";
import { redirects } from "@/lib/config/redirects";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompany } from "@/components/providers/company-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Companieswitcher({
  ...props
}: ComponentPropsWithoutRef<typeof SidebarHeader>) {
  const { selectedAccount, accounts } = useCompany();
  const isMobile = useIsMobile();
  const router = useRouter();

  return (
    <SidebarHeader {...props}>
      <SidebarMenuComponent>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LinkIcon className="h-4 w-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {selectedAccount.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Connected Account
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Linked Accounts
              </DropdownMenuLabel>
              {accounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() =>
                    router.push(redirects.app.company(account.id).root)
                  }
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <LinkIcon className="h-3 w-3" />
                  </div>
                  {account.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <Link
                  href={redirects.app.root}
                  className="font-medium text-muted-foreground"
                  prefetch={true}
                >
                  Add Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenuComponent>
    </SidebarHeader>
  );
}
