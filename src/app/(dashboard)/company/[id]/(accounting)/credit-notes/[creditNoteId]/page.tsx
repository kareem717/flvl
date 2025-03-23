import { client } from "@/lib/client";
import { redirect } from "next/navigation";
import { redirects } from "@/lib/config/redirects";
import { getTokenCached } from "@/app/actions/auth";

export default async function CreditNotePage({
  params,
}: { params: Promise<{ id: string; creditNoteId: string }> }) {
  const { creditNoteId } = await params;

  const token = await getTokenCached();
  if (!token) {
    return redirect(redirects.auth.login)
  }

  const req = await client.accounting.getCreditNote.$get({ creditNoteId: parseInt(creditNoteId) }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const creditNote = await req.json();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold mb-2">Credit Note {creditNote.id}</h1>
        <p className="text-muted-foreground">
          View credit note details and related information
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <pre className="bg-muted p-4 rounded-md w-min">
          {JSON.stringify(creditNote, null, 2)}
        </pre>
      </div>
    </div>
  );
} 