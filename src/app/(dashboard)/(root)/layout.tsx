import type { ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "./components/dashboard-sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { auth } from "@clerk/nextjs/server";
import { client } from "@/lib/client";
import { redirect } from "next/navigation";
import { redirects } from "@/lib/config/redirects";

export default async function RootDashboardLayout({
  children,
}: { children: ReactNode }) {
  const { getToken } = await auth();
  const token = await getToken()
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const bearerToken = `Bearer ${token}` 

  const req = await client.auth.getAccountByUserId.$get(undefined, {
    headers: {
      Authorization: bearerToken,
    },
  });
  const account = await req.json();

  return (
    <AuthProvider account={account} bearerToken={bearerToken}>
      <NotificationProvider notifications={[]}>
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
