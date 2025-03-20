import type {
  CreateCompanyParams,
  Company,
  PlaidCredential,
  QuickBooksOauthCredential,
} from "@/lib/db/types";

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

  syncPlaidBankAccounts(itemId: string): Promise<void>;
  syncPlaidTransactions(itemId: string): Promise<void>;

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

  syncQuickBooksInvoices(companyId: number): Promise<void>;
}
