"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { PlaidBankAccount } from "@/lib/db/types";
import { toast } from "sonner";

interface ReconciliationResult {
  matches: Array<{
    transactionId: string;
    invoiceId: string | null;
    confidence: number;
    matchReason: string;
    needsReview: boolean;
  }>;
  unmatchedTransactions: string[];
  unmatchedInvoices: string[];
  summary: {
    totalMatched: number;
    totalUnmatched: number;
    totalAmount: number;
    suggestedActions: string[];
  };
}

interface ReconciliationClientProps {
  bankAccounts: PlaidBankAccount[];
}

export function ReconciliationClient({
  bankAccounts,
}: ReconciliationClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >();
  const [results, setResults] = useState<{
    matches: Array<{
      transactionId: string;
      invoiceId: string | null;
      confidence: number;
      matchReason: string;
      needsReview: boolean;
    }>;
    unmatchedTransactions: string[];
    unmatchedInvoices: string[];
  } | null>(null);


  const handleReconcile = () => {
    if (!selectedAccountId) {
      return toast.error("No account selected", {
        description: "Please select a bank account to reconcile",
      });
    }

    toast.info("Not implemented");
  };

  const handleAccountSelection = (accountId: string) => {
    if (accountId === selectedAccountId) {
      setSelectedAccountId(undefined);
    } else {
      setSelectedAccountId(accountId);
    }
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Bank Account</CardTitle>
          <CardDescription>
            Choose a bank account to reconcile its transactions with invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {bankAccounts.length > 0 ? (
              bankAccounts.map((account) => {
                return (
                  <button
                    key={account.remoteId}
                    onClick={() => handleAccountSelection(account.remoteId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleAccountSelection(account.remoteId);
                      }
                    }}
                    tabIndex={0}
                    type="button"
                    aria-selected={selectedAccountId === account.remoteId}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAccountId === account.remoteId
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {account.name?.charAt(0) || "A"}
                      </div>
                      <div>
                        <div className="font-medium">
                          {account.name || "Account"}
                        </div>
                        {account.mask && (
                          <div className="text-sm text-muted-foreground">
                            ****{account.mask}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full text-center p-6 border rounded-lg text-muted-foreground">
                No bank accounts found for this company
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleReconcile}
              disabled={!selectedAccountId}
              className="w-full"
            >
              Reconcile Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Tabs defaultValue="matches">
          <TabsList className="mb-4">
            <TabsTrigger
              value="matches"
              disabled={results.matches.length === 0}
            >
              Matches ({results.matches.length})
            </TabsTrigger>
            <TabsTrigger
              value="unmatched"
              disabled={results.unmatchedTransactions.length === 0}
            >
              Unmatched Items ({results.unmatchedTransactions.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Matched Transactions</CardTitle>
                <CardDescription>
                  Transactions that have been matched to invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.matches.map((match) => (
                    <div
                      key={match.transactionId}
                      className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Transaction: {match.transactionId}
                          </span>
                          {match.needsReview && (
                            <Badge variant="outline" className="bg-yellow-100">
                              Needs Review
                            </Badge>
                          )}
                        </div>
                        {match.invoiceId && (
                          <div className="text-sm text-muted-foreground">
                            Matched to Invoice: {match.invoiceId}
                          </div>
                        )}
                        <div className="text-sm mt-1">{match.matchReason}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            match.confidence > 80
                              ? "bg-green-100 text-green-800"
                              : match.confidence > 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          Confidence: {match.confidence}%
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {results.matches.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No matched transactions found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unmatched">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Unmatched Transactions</CardTitle>
                  <CardDescription>
                    Transactions with no matching invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.unmatchedTransactions.map((transactionId) => (
                      <div
                        key={transactionId}
                        className="p-3 border rounded-lg"
                      >
                        {transactionId}
                      </div>
                    ))}

                    {results.unmatchedTransactions.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        No unmatched transactions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Unmatched Invoices</CardTitle>
                  <CardDescription>
                    Invoices with no matching transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.unmatchedInvoices.map((invoiceId) => (
                      <div key={invoiceId} className="p-3 border rounded-lg">
                        {invoiceId}
                      </div>
                    ))}

                    {results.unmatchedInvoices.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        No unmatched invoices
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
