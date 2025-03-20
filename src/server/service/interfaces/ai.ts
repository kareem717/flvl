import type { Message } from "ai";
import type { PlaidTransaction, PlaidBankAccount, QuickBooksInvoice } from "@/lib/db/types";

/**
 * Result of transaction reconciliation process
 */
export interface ReconciliationResult {
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

/**
 * Interface for AI Agent service that can analyze financial data
 */
export interface IAIService {
  /**
   * Analyzes a company's balance sheet and provides insights.
   *
   * @param messages Chat history messages for context
   * @param companyId ID of the company to analyze
   * @returns A readable stream of the AI's response
   */
  analyzeBalanceSheet(
    messages: Message[],
    companyId: number,
  ): Promise<ReadableStream<Uint8Array>>;

  /**
   * Analyzes a company's financial health based on various reports.
   *
   * @param messages Chat history messages for context
   * @param companyId ID of the company to analyze
   * @returns A readable stream of the AI's response
   */
  analyzeFinancialHealth(
    messages: Message[],
    companyId: number,
  ): Promise<ReadableStream<Uint8Array>>;

  /**
   * Provides cash flow projections based on historical data.
   *
   * @param messages Chat history messages for context
   * @param companyId ID of the company to analyze
   * @returns A readable stream of the AI's response
   */
  projectCashFlow(
    messages: Message[],
    companyId: number,
  ): Promise<ReadableStream<Uint8Array>>;

  /**
   * Reconciles bank transactions with invoices to identify matches and discrepancies.
   * This is a non-conversational method that returns structured data rather than a stream.
   *
   * @param transactions List of bank transactions to reconcile
   * @param invoices List of invoices to match with transactions
   * @param accountInfo Information about the bank account
   * @returns Structured reconciliation results
   */
  reconcileTransactions(
    transactions: PlaidTransaction[],
    invoices: QuickBooksInvoice[],
    accountInfo: PlaidBankAccount,
  ): Promise<ReconciliationResult>;
}
