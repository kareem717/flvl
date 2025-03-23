import { client } from "@/lib/client";
import { redirects } from "@/lib/config/redirects";
import { redirect } from "next/navigation";
import { getTokenCached } from "@/app/actions/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PaymentsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = Number.parseInt(id, 10);
  const token = await getTokenCached();
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const req = await client.accounting.getPaymentsByCompanyId.$get({ companyId }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payments = await req.json();

  return (
    <div>
      <h1>Payments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <pre
              key={payment.id}
              className="bg-muted p-4 rounded-md gap-4 flex flex-col overflow-hidden"
            >
              {JSON.stringify(payment, null, 2)}
              <Link
                href={redirects.app
                  .company(companyId)
                  .accounting.payment(payment.id.toString())}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View Payment
              </Link>
            </pre>
          ))
        ) : (
          <p className="text-muted-foreground">No payments found</p>
        )}
      </div>
    </div>
  )
} 