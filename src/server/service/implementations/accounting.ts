import type { IAccountingService } from "../interfaces/accounting";
import type {
  PlaidTransaction as BankTransaction,
  PlaidBankAccount as BankAccount,
  QuickBooksInvoice as Invoice,
  QuickBooksAccount,
  QuickBooksTransaction,
  QuickBooksJournalEntry,
  QuickBooksVendorCredit,
  QuickBooksCreditNote,
  QuickBooksPayment
} from "@/lib/db/types";
import type {
  BalanceSheetReport,
  CashFlowReport,
  ProfitLossReport,
} from "../interfaces/accounting";
import axios from "axios";
import type { ICompanyService } from "../interfaces";
import type { IAccountingRepository } from "@/server/storage/interfaces";

// Define types for QuickBooks report structures (moved from quickbooks.ts)
interface QBReport {
  Header?: {
    ReportName?: string;
    ColData?: Array<{ value?: string }>;
  };
  Rows?: {
    Row?: Array<QBRow>;
  };
}

interface QBRow {
  type?: string;
  Header?: {
    ColData?: Array<{ value?: string }>;
  };
  Summary?: {
    ColData?: Array<{ value?: string }>;
  };
  Rows?: {
    Row?: Array<QBRow>;
  };
  ColData?: Array<{
    value?: string;
    id?: string;
  }>;
}

/**
 * Service for accessing accounting data including bank accounts, transactions, invoices,
 * and QuickBooks financial reports
 */
export class AccountingService implements IAccountingService {
  private accountingRepo: IAccountingRepository;
  private companyService: ICompanyService;
  private qbApiBaseUrl: string;

  constructor(
    accountingRepo: IAccountingRepository,
    companyService: ICompanyService,
    qbEnv: "sandbox" | "production"
  ) {
    this.accountingRepo = accountingRepo;
    this.companyService = companyService;
    // Set the appropriate base URLs based on environment
    switch (qbEnv) {
      case "sandbox":
        this.qbApiBaseUrl = "https://sandbox-quickbooks.api.intuit.com";
        break;
      default:
        this.qbApiBaseUrl = "https://quickbooks.api.intuit.com";
        break;
    }
  }

  /**
   * Fetch bank accounts for a company
   */
  async getBankAccountsForCompany(companyId: number): Promise<BankAccount[]> {
    return await this.accountingRepo.getBankAccountsByCompanyId(companyId);
  }

  /**
   * Fetch bank transactions for a specific account
   */
  async getTransactionsByBankAccountId(
    bankAccountId: string,
  ): Promise<BankTransaction[]> {
    return await this.accountingRepo.getTransactionsByBankAccountId(
      bankAccountId,
    );
  }

  /**
   * Fetch bank account details
   */
  async getBankAccountDetails(remoteId: string): Promise<BankAccount> {
    const result = await this.accountingRepo.getBankAccountByRemoteId(remoteId);
    if (!result) {
      throw new Error(`Bank account not found: ${remoteId}`);
    }
    return result;
  }

  /**
   * Fetch invoices for a company
   */
  async getInvoicesForCompany(companyId: number): Promise<Invoice[]> {
    return await this.accountingRepo.getInvoicesByCompanyId(companyId);
  }

  /**
   * Get a company's QuickBooks credentials and refresh if needed
   */
  private async getCompanyCredentials(companyId: number) {
    return await this.companyService.getQuickBooksOAuthCredentials(companyId);
  }

  /**
   * Fetch the balance sheet report from QuickBooks
   */
  async getBalanceSheet(
    companyId: number,
    params: { start_date: string; end_date: string },
  ): Promise<BalanceSheetReport> {
    try {
      const credentials = await this.getCompanyCredentials(companyId);

      const response = await axios.get(
        `${this.qbApiBaseUrl}/v3/company/${credentials.realmId}/reports/BalanceSheet`,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            Accept: "application/json",
          },
          params: {
            start_date: params.start_date,
            end_date: params.end_date,
            minorversion: 65,
          },
        },
      );

      // Transform the QB response into our standardized BalanceSheetReport format
      const report = response.data as QBReport;

      // This is a simplified transformation - in a real implementation,
      // you would need to properly map the QB data structure to your defined interface
      const balanceSheet: BalanceSheetReport = {
        header: {
          reportName: report.Header?.ReportName || "Balance Sheet",
          time: {
            startDate: params.start_date,
            endDate: params.end_date,
          },
        },
        accounts: this.extractAccountsFromReport(report),
        totalAssets: this.extractTotalValue(report, "TotalAssets"),
        totalLiabilities: this.extractTotalValue(report, "TotalLiabilities"),
        equity: this.extractTotalValue(report, "TotalEquity"),
      };

      return balanceSheet;
    } catch (error) {
      console.error("Error fetching balance sheet:", error);
      throw new Error(
        `Failed to fetch balance sheet: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Fetch the profit and loss report from QuickBooks
   */
  async getProfitLoss(
    companyId: number,
    params: { start_date: string; end_date: string },
  ): Promise<ProfitLossReport> {
    try {
      const credentials = await this.getCompanyCredentials(companyId);

      const response = await axios.get(
        `${this.qbApiBaseUrl}/v3/company/${credentials.realmId}/reports/ProfitAndLoss`,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            Accept: "application/json",
          },
          params: {
            start_date: params.start_date,
            end_date: params.end_date,
            minorversion: 65,
          },
        },
      );

      // Transform the QB response into our standardized ProfitLossReport format
      const report = response.data as QBReport;

      // This is a simplified transformation
      const profitLoss: ProfitLossReport = {
        header: {
          reportName: report.Header?.ReportName || "Profit and Loss",
          time: {
            startDate: params.start_date,
            endDate: params.end_date,
          },
        },
        income: this.extractIncomeFromReport(report),
        expenses: this.extractExpensesFromReport(report),
        totalIncome: this.extractTotalValue(report, "TotalIncome"),
        totalExpenses: this.extractTotalValue(report, "TotalExpenses"),
        netIncome: this.extractTotalValue(report, "NetIncome"),
      };

      return profitLoss;
    } catch (error) {
      console.error("Error fetching profit and loss:", error);
      throw new Error(
        `Failed to fetch profit and loss: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Fetch the cash flow report from QuickBooks
   */
  async getCashFlow(
    companyId: number,
    params: { start_date: string; end_date: string },
  ): Promise<CashFlowReport> {
    try {
      const credentials = await this.getCompanyCredentials(companyId);

      const response = await axios.get(
        `${this.qbApiBaseUrl}/v3/company/${credentials.realmId}/reports/CashFlow`,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            Accept: "application/json",
          },
          params: {
            start_date: params.start_date,
            end_date: params.end_date,
            minorversion: 65,
          },
        },
      );

      // Transform the QB response into our standardized CashFlowReport format
      const report = response.data as QBReport;

      // This is a simplified transformation
      const cashFlow: CashFlowReport = {
        header: {
          reportName: report.Header?.ReportName || "Cash Flow",
          time: {
            startDate: params.start_date,
            endDate: params.end_date,
          },
        },
        operatingActivities: this.extractCashFlowSection(
          report,
          "OperatingActivities",
        ),
        investingActivities: this.extractCashFlowSection(
          report,
          "InvestingActivities",
        ),
        financingActivities: this.extractCashFlowSection(
          report,
          "FinancingActivities",
        ),
        netCashFlow: this.extractTotalValue(report, "NetCashFlow"),
        beginningCashBalance: this.extractTotalValue(
          report,
          "BeginningCashBalance",
        ),
        endingCashBalance: this.extractTotalValue(report, "EndingCashBalance"),
      };

      return cashFlow;
    } catch (error) {
      console.error("Error fetching cash flow:", error);
      throw new Error(`Failed to fetch cash flow: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to extract accounts from QuickBooks report
   */
  private extractAccountsFromReport(
    report: QBReport,
  ): Array<{ name: string; id: string; amount: number; type: string }> {
    // This is a simplified extraction - in a real implementation,
    // you would need to properly traverse the QB report structure
    try {
      const rows = report.Rows?.Row || [];
      return rows
        .filter((row: QBRow) => row.type === "Section")
        .flatMap((section: QBRow) => {
          const sectionName = section.Header?.ColData?.[0]?.value || "Unknown";
          return (section.Rows?.Row || [])
            .filter((row: QBRow) => row.type === "Data")
            .map((row: QBRow) => ({
              name: row.ColData?.[0]?.value || "Unknown",
              id: row.ColData?.[0]?.id || `unknown-${Math.random()}`,
              amount: Number.parseFloat(row.ColData?.[1]?.value || "0"),
              type: sectionName,
            }));
        });
    } catch (error) {
      console.error("Error extracting accounts:", error);
      return [];
    }
  }

  /**
   * Helper method to extract income items from QuickBooks report
   */
  private extractIncomeFromReport(
    report: QBReport,
  ): Array<{ name: string; id: string; amount: number }> {
    try {
      const rows = report.Rows?.Row || [];
      const incomeSection = rows.find(
        (row: QBRow) =>
          row.Header?.ColData?.[0]?.value === "Income" ||
          row.Header?.ColData?.[0]?.value === "Revenue",
      );

      if (!incomeSection || !incomeSection.Rows?.Row) {
        return [];
      }

      return incomeSection.Rows.Row.filter(
        (row: QBRow) => row.type === "Data",
      ).map((row: QBRow) => ({
        name: row.ColData?.[0]?.value || "Unknown",
        id: row.ColData?.[0]?.id || `unknown-${Math.random()}`,
        amount: Number.parseFloat(row.ColData?.[1]?.value || "0"),
      }));
    } catch (error) {
      console.error("Error extracting income:", error);
      return [];
    }
  }

  /**
   * Helper method to extract expense items from QuickBooks report
   */
  private extractExpensesFromReport(
    report: QBReport,
  ): Array<{ name: string; id: string; amount: number }> {
    try {
      const rows = report.Rows?.Row || [];
      const expenseSection = rows.find(
        (row: QBRow) =>
          row.Header?.ColData?.[0]?.value === "Expenses" ||
          row.Header?.ColData?.[0]?.value === "Expenditures",
      );

      if (!expenseSection || !expenseSection.Rows?.Row) {
        return [];
      }

      return expenseSection.Rows.Row.filter(
        (row: QBRow) => row.type === "Data",
      ).map((row: QBRow) => ({
        name: row.ColData?.[0]?.value || "Unknown",
        id: row.ColData?.[0]?.id || `unknown-${Math.random()}`,
        amount: Number.parseFloat(row.ColData?.[1]?.value || "0"),
      }));
    } catch (error) {
      console.error("Error extracting expenses:", error);
      return [];
    }
  }

  /**
   * Helper method to extract cash flow sections from QuickBooks report
   */
  private extractCashFlowSection(
    report: QBReport,
    sectionName: string,
  ): Array<{ name: string; id: string; amount: number }> {
    try {
      const rows = report.Rows?.Row || [];
      const section = rows.find(
        (row: QBRow) =>
          row.Header?.ColData?.[0]?.value?.includes(sectionName) ||
          row.Header?.ColData?.[0]?.value?.includes(
            sectionName.replace(/([A-Z])/g, " $1").trim(),
          ),
      );

      if (!section || !section.Rows?.Row) {
        return [];
      }

      return section.Rows.Row.filter((row: QBRow) => row.type === "Data").map(
        (row: QBRow) => ({
          name: row.ColData?.[0]?.value || "Unknown",
          id: row.ColData?.[0]?.id || `unknown-${Math.random()}`,
          amount: Number.parseFloat(row.ColData?.[1]?.value || "0"),
        }),
      );
    } catch (error) {
      console.error(`Error extracting ${sectionName}:`, error);
      return [];
    }
  }

  /**
   * Helper method to extract total values from QuickBooks report
   */
  private extractTotalValue(report: QBReport, totalName: string): number {
    try {
      const rows = report.Rows?.Row || [];
      for (const row of rows) {
        if (row.Summary?.ColData?.[0]?.value?.includes(totalName)) {
          return Number.parseFloat(row.Summary.ColData?.[1]?.value || "0");
        }

        // Look for the total in nested rows
        if (row.Rows?.Row) {
          for (const subRow of row.Rows.Row) {
            if (subRow.Summary?.ColData?.[0]?.value?.includes(totalName)) {
              return Number.parseFloat(
                subRow.Summary.ColData?.[1]?.value || "0",
              );
            }
          }
        }
      }
      return 0;
    } catch (error) {
      console.error(`Error extracting ${totalName}:`, error);
      return 0;
    }
  }
  async getInvoice(invoiceId: number): Promise<Invoice> {
    const invoice = await this.accountingRepo.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }
    return invoice;
  }

  async getInvoicesByCompanyId(companyId: number): Promise<Invoice[]> {
    return await this.accountingRepo.getInvoicesByCompanyId(companyId);
  }

  async getAccountingAccount(id: number): Promise<QuickBooksAccount> {
    const account = await this.accountingRepo.getAccountById(id);
    if (!account) {
      throw new Error(`Account not found: ${id}`);
    }
    return account;
  }

  async getAccountingAccountsByCompanyId(companyId: number): Promise<QuickBooksAccount[]> {
    return await this.accountingRepo.getAccountsByCompanyId(companyId);
  }

  async getAccountingTransaction(id: number): Promise<QuickBooksTransaction> {
    const transaction = await this.accountingRepo.getQbTransactionById(id);
    if (!transaction) {
      throw new Error(`Transaction not found: ${id}`);
    }
    return transaction;
  }

  async getAccountingTransactionsByCompanyId(companyId: number): Promise<QuickBooksTransaction[]> {
    return await this.accountingRepo.getQbTransactionsByCompanyId(companyId);
  }

  async getJournalEntry(id: number): Promise<QuickBooksJournalEntry> {
    const journalEntry = await this.accountingRepo.getJournalEntryById(id);
    if (!journalEntry) {
      throw new Error(`Journal entry not found: ${id}`);
    }
    return journalEntry;
  }

  async getJournalEntriesByCompanyId(companyId: number): Promise<QuickBooksJournalEntry[]> {
    return await this.accountingRepo.getJournalEntriesByCompanyId(companyId);
  }

  async getVendorCredit(id: number): Promise<QuickBooksVendorCredit> {
    const vendorCredit = await this.accountingRepo.getVendorCreditById(id);
    if (!vendorCredit) {
      throw new Error(`Vendor credit not found: ${id}`);
    }
    return vendorCredit;
  }

  async getVendorCreditsByCompanyId(companyId: number): Promise<QuickBooksVendorCredit[]> {
    return await this.accountingRepo.getVendorCreditsByCompanyId(companyId);
  }

  async getCreditNote(id: number): Promise<QuickBooksCreditNote> {
    const creditNote = await this.accountingRepo.getCreditNoteById(id);
    if (!creditNote) {
      throw new Error(`Credit note not found: ${id}`);
    }
    return creditNote;
  }

  async getCreditNotesByCompanyId(companyId: number): Promise<QuickBooksCreditNote[]> {
    return await this.accountingRepo.getCreditNotesByCompanyId(companyId);
  }

  async getPayment(id: number): Promise<QuickBooksPayment> {
    const payment = await this.accountingRepo.getPaymentById(id);
    if (!payment) {
      throw new Error(`Payment not found: ${id}`);
    }
    return payment;
  }

  async getPaymentsByCompanyId(companyId: number): Promise<QuickBooksPayment[]> {
    return await this.accountingRepo.getPaymentsByCompanyId(companyId);
  }
}
