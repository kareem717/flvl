import { AuthProvider } from "@/components/providers/auth-provider";
import { client } from "@/lib/client";
import { redirects } from "@/lib/config/redirects";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HTTPException } from "hono/http-exception";
import { Account } from "@/lib/db/types";
import { getTokenCached } from "../actions/auth";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const token = await getTokenCached()
  console.log("token", token)
  if (!token) {
    redirect(redirects.auth.login)
  }
  const bearerToken = `Bearer ${token}`

  let account: Account | null = null

  try {
    const resp = await client.auth.getAccountByUserId.$get(undefined, {
      headers: {
        Authorization: bearerToken,
      },
    })

    account = await resp.json()

  } catch (error) {
    if (error instanceof HTTPException) {
      if (error.status === 401) {
        redirect(redirects.auth.createAccount)
      }
      console.error(error)
    }

    else {
      console.error(error)
      throw error
    }
  }

  return (
    <AuthProvider account={account} bearerToken={bearerToken}>
      {/* // <NotificationProvider notifications={notifications}> */}
      {children}
      {/* // </NotificationProvider> */}
    </AuthProvider>
  );
}
