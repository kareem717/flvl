import type {
  CreateCompanyParams,
  Company,
  PlaidCredential,
  QuickBooksOauthCredential,
} from "@/lib/db/types";
import { SyncJobType } from "@/lib/types";
export interface ICompanyService {
  getById(id: number): Promise<Company>;
  getByAccountId(accountId: number): Promise<Company[]>;
  getCompanyByQuickBooksRealmId(realmId: string): Promise<Company | undefined>;
  searchCompanies(query: string, accountId: number): Promise<Company[]>;
  create(params: CreateCompanyParams, ownerId: number): Promise<Company>;
  deleteCompany(id: number): Promise<void>;

  deletePlaidCredentials(companyId: number): Promise<void>;
  createPlaidLinkToken({
    companyId,
  }: {
    companyId: number;
  }): Promise<string>;
  createPlaidCredentials(params: {
    companyId: number;
    publicToken: string;
  }): Promise<PlaidCredential>;

  /**
   * Get Plaid credentials for a company
   * @param companyId The company ID
   * @returns Array of Plaid credentials
   */
  getPlaidCredentials(companyId: number): Promise<PlaidCredential>;

  startQuickBooksOAuthFlow(
    companyId: number,
    redirectUrl: string,
  ): Promise<string>;
  getQuickBooksOAuthCredentials(
    companyId: number,
  ): Promise<QuickBooksOauthCredential>;
  deleteQuickBooksOAuthCredentials(companyId: number): Promise<void>;
  completeQuickBooksOAuthFlow(params: {
    code: string;
    state: string;
    realmId: string;
  }): Promise<{
    redirect_url: string;
    company_id: number;
  }>;

  syncAccountingAccounts(companyId: number): Promise<void>;
  syncBankAccounts(companyId: number): Promise<void>;
  syncAccountingTransactions(companyId: number): Promise<void>;
  syncBankTransactions(companyId: number): Promise<void>;
  syncInvoices(companyId: number): Promise<void>;
  syncJournalEntries(companyId: number): Promise<void>;
  syncVendorCredits(companyId: number): Promise<void>;
  syncCreditNotes(companyId: number): Promise<void>;
  syncPayments(companyId: number): Promise<void>;
}