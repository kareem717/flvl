import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { redirects } from "@/lib/config/redirects";
import Link from "next/link";

export default async function LogoutPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Are you sure?</CardTitle>
        <CardDescription>Logout from your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-2 gap-4 md:grid-cols-1"
        >
          <SignOutButton>
            <Button
              className="w-full"
              variant="secondary"
            >
              Logout
            </Button>
          </SignOutButton>
          <Link
            className={cn(buttonVariants(), "w-full")}
            href={redirects.app.root}
          >
            Dashboard
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
