import { client } from "@/lib/client";
import { redirects } from "@/lib/config/redirects";
import { redirect } from "next/navigation";
import { getTokenCached } from "@/app/actions/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function TransactionsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = Number.parseInt(id, 10);
  const token = await getTokenCached();
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const req = await client.accounting.getAccountingTransactionsByCompanyId.$get({ companyId }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const transactions = await req.json();

  return (
    <div>
      <h1>Transactions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <pre
              key={transaction.id}
              className="bg-muted p-4 rounded-md gap-4 flex flex-col overflow-hidden"
            >
              {JSON.stringify(transaction, null, 2)}
              <Link
                href={redirects.app
                  .company(companyId)
                  .accounting.transaction(transaction.id.toString())}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View Transaction
              </Link>
            </pre>
          ))
        ) : (
          <p className="text-muted-foreground">No transactions found</p>
        )}
      </div>
    </div>
  )
} 