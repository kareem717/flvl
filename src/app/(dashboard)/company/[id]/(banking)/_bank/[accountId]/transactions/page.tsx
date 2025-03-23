// import { client } from "@/lib/client";
// import { redirect } from "next/navigation";
// import { redirects } from "@/lib/config/redirects";
// import { getTokenCached } from "@/app/actions/auth";

// export default async function BankAccountTransactionsPage({
//   params,
// }: { params: Promise<{ id: string; accountId: string }> }) {
//   const { accountId } = await params;
//   const token = await getTokenCached()
//   if (!token) {
//     return redirect(redirects.auth.login)
//   }

//   const bearerToken = `Bearer ${token}`

//   const req = await client.accounting.getTransactionsByBankAccountId.$get({ bankAccountId: accountId }, {
//     headers: {
//       Authorization: bearerToken,
//     },
//   })

//   const transactions = await req.json();

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-3">
//         <h1 className="text-3xl font-bold mb-2">Bank Transactions</h1>
//         <p className="text-muted-foreground">
//           Manage your linked account and view financial data
//         </p>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
//         {transactions.length > 0 ? (
//           transactions.map((transaction) => (
//             <pre
//               key={transaction.remoteId}
//               className="bg-muted p-4 rounded-md gap-4 flex flex-col overflow-hidden"
//             >
//               {JSON.stringify(transaction, null, 2)}
//             </pre>
//           ))
//         ) : (
//           <p className="text-muted-foreground">No transactions found</p>
//         )}
//       </div>
//     </div>
//   );
// }
