import type {
  Company,
  CreateCompanyParams,
  CreatePlaidCredentialParams,
  PlaidCredential,
  QuickBooksOauthCredential,
  CreateQuickBooksOauthStateParams,
  QuickBooksOauthState,
  UpdateQuickBooksOauthCredentialParams,
  CreateQuickBooksOauthCredentialParams,
} from "../../entities";

export interface ICompanyRepository {
  create(account: CreateCompanyParams, ownerId: number): Promise<Company>;
  getById(id: number): Promise<Company>;
  getByAccountId(accountId: number): Promise<Company[]>;
  searchCompanies(query: string, accountId: number): Promise<Company[]>;

  createPlaidCredentials(
    params: CreatePlaidCredentialParams,
    companyId: number,
  ): Promise<PlaidCredential>;
  deletePlaidCredentials(companyId: number): Promise<void>;
  getPlaidCredentialsByItemId(itemId: string): Promise<PlaidCredential>;
  updateTransactionCursor(companyId: number, cursor: string): Promise<void>;
  deleteCompany(id: number): Promise<void>;

  getQuickBooksOAuthCredentials(
    companyId: number,
  ): Promise<QuickBooksOauthCredential>;
  getCompanyByQuickBooksRealmId(realmId: string): Promise<Company | undefined>;
  updateQuickBooksOAuthCredentials(
    params: UpdateQuickBooksOauthCredentialParams,
    companyId: number,
  ): Promise<QuickBooksOauthCredential>;
  deleteQuickBooksOAuthCredentials(companyId: number): Promise<void>;
  createQuickBooksOAuthCredentials(
    params: CreateQuickBooksOauthCredentialParams,
    companyId: number,
  ): Promise<QuickBooksOauthCredential>;

  getQuickBooksOauthState(state: string): Promise<QuickBooksOauthState>;
  deleteQuickBooksOauthStates(companyId: number): Promise<void>;
  createQuickBooksOauthState(
    params: CreateQuickBooksOauthStateParams,
    companyId: number,
  ): Promise<void>;
}
