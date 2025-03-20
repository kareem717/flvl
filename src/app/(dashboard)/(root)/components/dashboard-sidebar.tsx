"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";  
import { SidebarMenu } from "@/components/sidebar/sidebar-menu";
import type { ComponentPropsWithoutRef } from "react";
import { SidebarUser } from "@/components/sidebar/sidebar-user";
import { sidebar } from "@/lib/config/sidebar";
import { SidebarNotification } from "@/components/sidebar/sidebar-notification";
import { SidebarLogo } from "@/components/sidebar/sidebar-logo";

//TODO: this doesn't have to be a client component
export function DashboardSidebar({
  ...props
}: ComponentPropsWithoutRef<typeof Sidebar>) {
  const { dashboard } = sidebar;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="border-b px-4">
        <h1 className="text-2xl">Dashboard</h1>
      </SidebarHeader>
      <SidebarContent className="divide-y border-b-2">
        {dashboard.map((menu) => (
          <SidebarMenu key={menu.name} config={menu} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification notificationId="identity-not-verified" />
      </SidebarFooter>
    </Sidebar>
  );
}
