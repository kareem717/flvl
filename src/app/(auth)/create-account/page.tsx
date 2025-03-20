
import { Card, CardDescription, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { CreateAccountForm } from "./components/create-account-form";
import { currentUser } from "@clerk/nextjs/server";
import { redirects } from "@/lib/config/redirects";
import { redirect } from "next/navigation";

export default async function CreateAccountPage() {
  const user = await currentUser();
  if (!user) {
    console.error("User not found")
    redirect(redirects.auth.login)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create Account</CardTitle>
          <CardDescription>Create an account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAccountForm email={user.emailAddresses[0]?.emailAddress} />
        </CardContent>
      </Card>
    </div>
  );
}
