import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { ReactNode } from "react";
import { CompanyProvider } from "@/components/providers/company-provider";
import { Companiesidebar } from "./components/company-sidebar";
import { client } from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { redirects } from "@/lib/config/redirects";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { getToken } = await auth()
  const { id } = await params;
  const parsedId = Number.parseInt(id, 10);

  if (Number.isNaN(parsedId)) {
    return notFound();
  }

  const token = await getToken()
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const resp = await client.company.getByAccountId.$get(undefined, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const companies = await resp.json()
  if (!companies.length) {
    return notFound();
  }

  const current = companies.find((account) => account.id === parsedId);
  if (!current) {
    return notFound();
  }

  return (
    <CompanyProvider accounts={companies} defaultAccount={current}>
      <SidebarProvider>
        <Companiesidebar accountId={current.id} />
        <SidebarInset>
          {/* {alertComponent} */}
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              {/* <BusinessBreadcrumb /> */}
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 px-4 container mx-auto py-12">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CompanyProvider>
  );
}
