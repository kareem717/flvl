import { AuthProvider } from "@/components/providers/auth-provider";
import { client } from "@/lib/client";
import { redirects } from "@/lib/config/redirects";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HTTPException } from "hono/http-exception";
import { Account } from "@/lib/db/types";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { getToken } = await auth()

  let account: Account | null = null
  let bearerToken: string | null = null

  const token = await getToken()
  if (token) {
    bearerToken = `Bearer ${token}`
  } else {
    redirect(redirects.auth.login)
  }

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
