import { client } from "@/lib/client";
import { redirect } from "next/navigation";
import { redirects } from "@/lib/config/redirects";
import { getTokenCached } from "@/app/actions/auth";

export default async function AccountingTransactionPage({
  params,
}: { params: Promise<{ id: string; transactionId: string }> }) {
  const { transactionId } = await params;

  const token = await getTokenCached();
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const req = await client.accounting.getAccountingTransaction.$get({ transactionId: parseInt(transactionId) }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const transaction = await req.json();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold mb-2">Transaction {transaction.id}</h1>
        <p className="text-muted-foreground">
          View transaction details and related information
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <pre className="bg-muted p-4 rounded-md w-min">
          {JSON.stringify(transaction, null, 2)}
        </pre>
      </div>
    </div>
  );
} 