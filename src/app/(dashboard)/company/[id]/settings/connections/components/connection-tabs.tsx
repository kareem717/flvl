"use client";

import type { ComponentPropsWithoutRef } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { parseAsStringEnum, useQueryState } from "nuqs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LinkQuickBooksButton } from "./link-quick-books-button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
// import { LinkPlaidButton } from "./link-plaid-button";

interface ConnectionTabsProps extends ComponentPropsWithoutRef<typeof Tabs> {
  companyId: number;
}

enum ConnectionProvider {
  QUICKBOOKS = "quickbooks",
  // PLAID = "plaid",
}

export function ConnectionTabs({
  className,
  companyId,
  ...props
}: ConnectionTabsProps) {
  const [provider, setProvider] = useQueryState("provider",
    parseAsStringEnum<ConnectionProvider>(Object.values(ConnectionProvider))
      .withDefault(ConnectionProvider.QUICKBOOKS)
      .withOptions({
        clearOnDefault: true,
      }));

  return (
    <Tabs
      defaultValue={provider}
      onValueChange={(value) => setProvider(value as ConnectionProvider)}
      className={cn(className)}
      {...props}
    >
      <TabsList className="w-full justify-start">
        <TabsTrigger value="quickbooks">Quickbooks</TabsTrigger>
        <TabsTrigger value="" disabled>
          Plaid
          <Badge className="text-xs">
            <Sparkles className="size-4" />
            Coming Soon...
          </Badge>
        </TabsTrigger>
      </TabsList>
      {/* <TabsContent value="plaid" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Plaid</CardTitle>
            <CardDescription>
              Link your bank account to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <LinkPlaidButton companyId={companyId} />
          </CardContent>
        </Card>
      </TabsContent> */}
      <TabsContent value="quickbooks" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Quickbooks</CardTitle>
            <CardDescription>Link your Quickbooks account</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkQuickBooksButton companyId={companyId} className="w-full" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
