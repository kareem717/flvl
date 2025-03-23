import { client } from "@/lib/client";
import { redirect } from "next/navigation";
import { redirects } from "@/lib/config/redirects";
import { getTokenCached } from "@/app/actions/auth";

export default async function AccountingAccountPage({
  params,
}: { params: Promise<{ id: string; accountId: string }> }) {
  const { accountId } = await params;

  const token = await getTokenCached();
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const req = await client.accounting.getAccountingAccount.$get({ accountId: parseInt(accountId) }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const account = await req.json();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold mb-2">Account {account.id}</h1>
        <p className="text-muted-foreground">
          View account details and transaction history
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <pre className="bg-muted p-4 rounded-md w-min">
          {JSON.stringify(account, null, 2)}
        </pre>
      </div>
    </div>
  );
} 