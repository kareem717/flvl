import { z } from "zod";
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import type { IAIService, ReconciliationResult } from "../interfaces/ai";
import type { IAccountingService } from "../interfaces/accounting";
import { streamText, tool, type Message, generateObject } from "ai";
import type { PlaidTransaction, PlaidBankAccount, QuickBooksInvoice } from "@/lib/db/types";

// Define the schema for transaction reconciliation output
const transactionMatchSchema = z.object({
  transactionId: z.string(),
  invoiceId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  matchReason: z.string(),
  needsReview: z.boolean(),
});

export type TransactionMatch = z.infer<typeof transactionMatchSchema>;

// Define types for intermediate data structures
interface CleanedTransaction {
  id: string;
  amount: number;
  date: string;
  description?: string;
  [key: string]: unknown;
}

interface CleanedInvoice {
  id: string;
  amount: number;
  date: string;
  dueDate?: string;
  [key: string]: unknown;
}

interface TransactionWithMatches {
  transactionId: string;
  potentialMatches: Array<{
    invoiceId: string;
    confidence: number;
    matchReason: string;
  }>;
}

interface PotentialMatch {
  transactionId: string;
  transactionAmount: number;
  transactionDate: string;
  invoiceId: string | null;
  invoiceAmount: number | null;
  invoiceDate: string | null;
  confidence: number;
  matchReason: string;
  needsReview: boolean;
}

/**
 * Service for creating AI agents that can perform financial analysis
 */
export class AIService implements IAIService {
  private openai: OpenAIProvider;
  private accountingService: IAccountingService;

  constructor(accountingService: IAccountingService, openAIKey: string) {
    this.accountingService = accountingService;

    // Initialize the OpenAI provider using env variables
    this.openai = createOpenAI({
      apiKey: openAIKey,
    });
  }

  /**
   * Analyze a company's balance sheet with custom tools
   */
  async analyzeBalanceSheet(
    messages: Message[],
    companyId: number,
  ): Promise<ReadableStream<Uint8Array>> {
    console.log("Analyzing balance sheet for company:", companyId);

    const stream = await streamText({
      onStepFinish: async (res) => {
        console.log("Step:", {
          text: res.text,
          toolsCalls: res.toolCalls,
        });
      },
      model: this.openai("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
      toolCallStreaming: true,
      tools: {
        getBalanceSheet: tool({
          description: "A tool for fetching the balance sheet of a company.",
          parameters: z.object({
            startDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The start date of the report, in YYYY-MM-DD format"),
            endDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The end date of the report, in YYYY-MM-DD format"),
          }),
          execute: async ({ startDate: start_date, endDate: end_date }) =>
            await this.accountingService.getBalanceSheet(companyId, {
              start_date,
              end_date,
            }),
        }),
        getProfitLoss: tool({
          description:
            "A tool for fetching the profit and loss report of a company.",
          parameters: z.object({
            startDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The start date of the report, in YYYY-MM-DD format"),
            endDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The end date of the report, in YYYY-MM-DD format"),
          }),
          execute: async ({ startDate: start_date, endDate: end_date }) =>
            await this.accountingService.getProfitLoss(companyId, {
              start_date,
              end_date,
            }),
        }),
      },
      maxSteps: 10,
      system: `
        You are a CFO at a company. You are analyzing the balance sheet of the company.
        You are always talking about the current year, which is from ${new Date().getFullYear() - 1} to ${new Date().getFullYear()}.
        Your goal is to provide clear, actionable insights from the balance sheet.

        Focus on key metrics like:
        1. Current ratio (current assets / current liabilities)
        2. Debt-to-equity ratio
        3. Asset turnover ratio
        4. Return on assets

        Highlight notable changes in assets, liabilities, and equity compared to previous periods.
        Provide context and clear explanations of what these numbers mean for the business.
        `,
      messages,
    });
    return stream.toDataStream();
  }

  /**
   * Perform a comprehensive analysis of financial health using multiple reports
   */
  async analyzeFinancialHealth(
    messages: Message[],
    companyId: number,
  ): Promise<ReadableStream<Uint8Array>> {
    console.log("Analyzing financial health for company:", companyId);

    const stream = await streamText({
      onStepFinish: async (res) => {
        console.log("Step:", {
          text: res.text,
          toolsCalls: res.toolCalls,
        });
      },
      model: this.openai("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
      toolCallStreaming: true,
      tools: {
        getBalanceSheet: tool({
          description: "A tool for fetching the balance sheet of a company.",
          parameters: z.object({
            startDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The start date of the report, in YYYY-MM-DD format"),
            endDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The end date of the report, in YYYY-MM-DD format"),
          }),
          execute: async ({ startDate: start_date, endDate: end_date }) =>
            await this.accountingService.getBalanceSheet(companyId, {
              start_date,
              end_date,
            }),
        }),
        getProfitLoss: tool({
          description:
            "A tool for fetching the profit and loss report of a company.",
          parameters: z.object({
            startDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The start date of the report, in YYYY-MM-DD format"),
            endDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The end date of the report, in YYYY-MM-DD format"),
          }),
          execute: async ({ startDate: start_date, endDate: end_date }) =>
            await this.accountingService.getProfitLoss(companyId, {
              start_date,
              end_date,
            }),
        }),
        getCashFlow: tool({
          description:
            "A tool for fetching the cash flow statement of a company.",
          parameters: z.object({
            startDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The start date of the report, in YYYY-MM-DD format"),
            endDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The end date of the report, in YYYY-MM-DD format"),
          }),
          execute: async ({ startDate: start_date, endDate: end_date }) =>
            await this.accountingService.getCashFlow(companyId, {
              start_date,
              end_date,
            }),
        }),
      },
      maxSteps: 15,
      system: `
        You are a financial analyst evaluating the overall financial health of a company.
        You analyze the balance sheet, profit and loss statement, and cash flow to provide a comprehensive assessment.
        You are always talking about the current year, which is from ${new Date().getFullYear() - 1} to ${new Date().getFullYear()}.
        
        Key metrics to focus on:
        1. Profitability (net profit margin, gross margin)
        2. Liquidity (current ratio, quick ratio)
        3. Solvency (debt-to-equity, interest coverage)
        4. Efficiency (inventory turnover, asset turnover)
        5. Growth (revenue growth, profit growth)
        
        Provide a clear summary of strengths and weaknesses, and specific recommendations for improvement.
        Use plain language that non-financial stakeholders can understand.
        `,
      messages,
    });
    return stream.toDataStream();
  }

  /**
   * Project future cash flow based on historical data
   */
  async projectCashFlow(
    messages: Message[],
    companyId: number,
  ): Promise<ReadableStream<Uint8Array>> {
    console.log("Projecting cash flow for company:", companyId);

    const stream = await streamText({
      onStepFinish: async (res) => {
        console.log("Step:", {
          text: res.text,
          toolsCalls: res.toolCalls,
        });
      },
      model: this.openai("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
      toolCallStreaming: true,
      tools: {
        getProfitLoss: tool({
          description:
            "A tool for fetching the profit and loss report of a company.",
          parameters: z.object({
            startDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The start date of the report, in YYYY-MM-DD format"),
            endDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The end date of the report, in YYYY-MM-DD format"),
          }),
          execute: async ({ startDate: start_date, endDate: end_date }) =>
            await this.accountingService.getProfitLoss(companyId, {
              start_date,
              end_date,
            }),
        }),
        getCashFlow: tool({
          description:
            "A tool for fetching the cash flow statement of a company.",
          parameters: z.object({
            startDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The start date of the report, in YYYY-MM-DD format"),
            endDate: z
              .string()
              .refine((date) => !!Date.parse(date))
              .describe("The end date of the report, in YYYY-MM-DD format"),
          }),
          execute: async ({ startDate: start_date, endDate: end_date }) =>
            await this.accountingService.getCashFlow(companyId, {
              start_date,
              end_date,
            }),
        }),
      },
      maxSteps: 15,
      system: `
        You are a financial forecasting expert who specializes in cash flow projections.
        Based on historical cash flow and profit/loss data, you project future cash flow trends.
        You are always talking about the current year, which is from ${new Date().getFullYear() - 1} to ${new Date().getFullYear()}.
        
        Your cash flow projections should:
        1. Identify seasonal patterns and trends in revenue and expenses
        2. Highlight potential cash crunches or surpluses in the upcoming months
        3. Consider accounts receivable, accounts payable, and inventory cycles
        4. Provide recommendations for optimizing cash management
        
        Keep your analysis practical and actionable. Focus on the most impactful insights.
        Present your findings clearly with specific timeframes and amounts.
        `,
      messages,
    });
    return stream.toDataStream();
  }

  /**
   * Reconcile bank transactions with invoices to identify matches and discrepancies
   */
  async reconcileTransactions(
    transactions: PlaidTransaction[],
    invoices: QuickBooksInvoice[],
    accountInfo: PlaidBankAccount,
  ): Promise<ReconciliationResult> {
    console.log(
      `Reconciling transactions for account: ${accountInfo.remoteId}`,
    );

    // Step 1: Preprocess and clean the transaction and invoice data in parallel
    console.log(
      `Preparing reconciliation data for ${transactions.length} transactions and ${invoices.length} invoices`,
    );
    const [cleanedTransactions, cleanedInvoices] = await Promise.all([
      this.cleanTransactions(transactions),
      this.cleanInvoices(invoices),
    ]);

    // Step 2: Find potential matches between transactions and invoices
    console.log(
      `Finding potential matches for ${cleanedTransactions.length} transactions and ${cleanedInvoices.length} invoices`,
    );
    const potentialMatches = await this.findPotentialMatches(
      cleanedTransactions,
      cleanedInvoices,
      accountInfo,
    );

    // Step 3: Create a final reconciliation report
    console.log(
      `Creating reconciliation report for ${cleanedTransactions.length} transactions and ${cleanedInvoices.length} invoices`,
    );
    const reconciliationResult = await this.createReconciliationReport(
      cleanedTransactions,
      cleanedInvoices,
      potentialMatches,
    );

    console.log(
      `Reconciliation complete for ${cleanedTransactions.length} transactions and ${cleanedInvoices.length} invoices`,
    );
    return reconciliationResult;
  }

  /**
   * Clean and standardize transaction data
   */
  private async cleanTransactions(
    transactions: PlaidTransaction[],
  ): Promise<CleanedTransaction[]> {
    const transactionSchema = z.object({
      transactions: z.array(
        z
          .object({
            id: z.string(),
            amount: z.number(),
            date: z.string(),
            description: z.string().nullable(),
            category: z.string().nullable(),
            payee: z.string().nullable(),
          })
          .passthrough(),
      ),
    });

    const cleanedData = await generateObject({
      model: this.openai("gpt-4o-mini"),
      system: `
        You are a financial data processor specialized in preparing transaction data for reconciliation.
        Your task is to clean and standardize bank transaction data to make it easier to match with invoices.
        Normalize dates to ISO format (YYYY-MM-DD), ensure amounts are in the same format (positive numbers),
        and extract key information from descriptions when possible.
      `,
      prompt: `
        Process the following bank transactions to prepare them for reconciliation:
        
        Bank Transactions:
        ${JSON.stringify(transactions, null, 2)}
        
        Clean and standardize this data for reconciliation. Identify and fix any formatting issues,
        normalize dates, ensure consistent amount representations, and extract any useful matching information.
      `,
      schema: transactionSchema,
    });

    // Convert any null values to undefined to match our CleanedTransaction interface
    return cleanedData.object.transactions.map((transaction) => ({
      ...transaction,
      description: transaction.description || undefined,
      category: transaction.category || undefined,
      payee: transaction.payee || undefined,
    }));
  }

  /**
   * Clean and standardize invoice data
   */
  private async cleanInvoices(invoices: QuickBooksInvoice[]): Promise<CleanedInvoice[]> {
    const invoiceSchema = z.object({
      invoices: z.array(
        z
          .object({
            id: z.string(),
            amount: z.number(),
            date: z.string(),
            dueDate: z.string().nullable(),
            customer: z.string().nullable(),
            status: z.string().nullable(),
          })
          .passthrough(),
      ),
    });

    const cleanedData = await generateObject({
      model: this.openai("gpt-4o-mini"),
      system: `
        You are a financial data processor specialized in preparing invoice data for reconciliation.
        Your task is to clean and standardize invoice data to make it easier to match with bank transactions.
        Normalize dates to ISO format (YYYY-MM-DD), ensure amounts are in the same format (positive numbers),
        and extract key information that can help with matching.
      `,
      prompt: `
        Process the following invoices to prepare them for reconciliation:
        
        Invoices:
        ${JSON.stringify(invoices, null, 2)}
        
        Clean and standardize this data for reconciliation. Identify and fix any formatting issues,
        normalize dates, ensure consistent amount representations, and extract any useful matching information.
      `,
      schema: invoiceSchema,
    });

    // Convert any null values to undefined to match our CleanedInvoice interface
    return cleanedData.object.invoices.map((invoice) => ({
      ...invoice,
      dueDate: invoice.dueDate || undefined,
      customer: invoice.customer || undefined,
      status: invoice.status || undefined,
    }));
  }

  /**
   * Step 2: Find potential matches between transactions and invoices
   */
  private async findPotentialMatches(
    transactions: CleanedTransaction[],
    invoices: CleanedInvoice[],
    accountInfo: PlaidBankAccount,
  ) {
    // Define interface for the potential matches
    interface PotentialMatch {
      transactionId: string;
      transactionAmount: number;
      transactionDate: string;
      invoiceId: string | null;
      invoiceAmount: number | null;
      invoiceDate: string | null;
      confidence: number;
      matchReason: string;
      needsReview: boolean;
    }

    const matchingSchema = z.object({
      matches: z.array(
        z.object({
          transactionId: z.string(),
          transactionAmount: z.number(),
          transactionDate: z.string(),
          invoiceId: z.string().nullable(),
          invoiceAmount: z.number().nullable(),
          invoiceDate: z.string().nullable(),
          confidence: z.number(),
          matchReason: z.string(),
          needsReview: z.boolean(),
        }),
      ),
    });

    const matchingResult = await generateObject({
      model: this.openai("gpt-4o-mini"),
      system: `
        You are a financial reconciliation assistant that specializes in matching bank transactions to invoices.
        Your task is to find potential matches between transactions and invoices based on:
        1. Amount (exact or approximate matches, considering possible fees or partial payments)
        2. Date proximity (transactions should generally occur on or after invoice dates)
        3. Description matching (look for invoice numbers, customer names, or other identifiable information)
        
        For each transaction, you should identify the most likely matching invoice, or indicate that no match was found.
        Provide a confidence score (0-100) and explanation for each match.
        Flag any matches that need human review due to uncertainty or unusual patterns.
      `,
      prompt: `
        Match the following bank transactions to the corresponding invoices:
        
        Bank Account Information:
        ${JSON.stringify(accountInfo, null, 2)}
        
        Transactions:
        ${JSON.stringify(transactions, null, 2)}
        
        Invoices:
        ${JSON.stringify(invoices, null, 2)}
        
        For each transaction, identify the best matching invoice (if any) and provide:
        1. The confidence level of the match (0-100)
        2. A brief explanation of why you made the match
        3. Flag if it needs human review
      `,
      schema: matchingSchema,
    });

    return matchingResult.object.matches as PotentialMatch[];
  }

  /**
   * Step 3: Create a final reconciliation report based on the matches
   */
  private async createReconciliationReport(
    transactions: CleanedTransaction[],
    invoices: CleanedInvoice[],
    potentialMatches: PotentialMatch[],
  ): Promise<ReconciliationResult> {
    const reconciliationSchema = z.object({
      matches: z.array(
        z.object({
          transactionId: z.string(),
          invoiceId: z.string().nullable(),
          confidence: z.number(),
          matchReason: z.string(),
          needsReview: z.boolean(),
        }),
      ),
      unmatchedTransactions: z.array(z.string()),
      unmatchedInvoices: z.array(z.string()),
      summary: z.object({
        totalMatched: z.number(),
        totalUnmatched: z.number(),
        totalAmount: z.number(),
        suggestedActions: z.array(z.string()),
      }),
    });

    const reportResult = await generateObject({
      model: this.openai("gpt-4o-mini"),
      system: `
        You are a financial reconciliation specialist creating detailed reconciliation reports.
        Your task is to analyze the matches between transactions and invoices and generate a clear report.
        Identify any discrepancies, unmatched items, or unusual patterns that need attention.
        Provide actionable recommendations based on the analysis.
      `,
      prompt: `
        Generate a detailed reconciliation report based on:
        
        Original Transactions:
        ${JSON.stringify(transactions, null, 2)}
        
        Original Invoices:
        ${JSON.stringify(invoices, null, 2)}
        
        Potential Matches:
        ${JSON.stringify(potentialMatches, null, 2)}
        
        Create a comprehensive report with:
        1. Confirmed matches with confidence scores
        2. Unmatched transactions and invoices
        3. Summary statistics 
        4. Suggested actions for the accounting team
      `,
      schema: reconciliationSchema,
    });

    // Ensure the result matches the ReconciliationResult type
    const finalResult: ReconciliationResult = {
      matches: reportResult.object.matches.map((match) => ({
        transactionId: match.transactionId,
        invoiceId: match.invoiceId,
        confidence: match.confidence,
        matchReason: match.matchReason,
        needsReview: match.needsReview,
      })),
      unmatchedTransactions: reportResult.object.unmatchedTransactions,
      unmatchedInvoices: reportResult.object.unmatchedInvoices,
      summary: {
        totalMatched: reportResult.object.summary.totalMatched,
        totalUnmatched: reportResult.object.summary.totalUnmatched,
        totalAmount: reportResult.object.summary.totalAmount,
        suggestedActions: reportResult.object.summary.suggestedActions,
      },
    };

    return finalResult;
  }
}
