import { client } from "@/lib/client";
import { redirects } from "@/lib/config/redirects";
import { redirect } from "next/navigation";
import { getTokenCached } from "@/app/actions/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AccountsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = Number.parseInt(id, 10);
  const token = await getTokenCached();
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const req = await client.accounting.getAccountingAccountsByCompanyId.$get({ companyId }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const accounts = await req.json();

  return (
    <div>
      <h1>Accounting Accounts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <pre
              key={account.id}
              className="bg-muted p-4 rounded-md gap-4 flex flex-col overflow-hidden"
            >
              {JSON.stringify(account, null, 2)}
              <Link
                href={redirects.app
                  .company(companyId)
                  .accounting.account(account.id.toString())}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View Account
              </Link>
            </pre>
          ))
        ) : (
          <p className="text-muted-foreground">No accounts found</p>
        )}
      </div>
    </div>
  )
} 