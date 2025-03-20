import { notFound, redirect } from "next/navigation";
import { client } from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import { redirects } from "@/lib/config/redirects";

export default async function CompanyPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = Number.parseInt(id, 10);

  const { getToken } = await auth()

  const token = await getToken()
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const resp = await client.company.getById.$get({ companyId: parsedId }, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  })

  const company = await resp.json()

  if (!company) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
        <p className="text-muted-foreground">
          Manage your linked account and view financial data
        </p>
      </div>
      <pre className="bg-muted p-4 rounded-md w-min">
        {JSON.stringify(company, null, 2)}
      </pre>
    </div>
  );
}
