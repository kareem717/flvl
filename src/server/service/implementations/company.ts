import { type ICompanyService, } from "../interfaces";
import { Storage } from "@/server/storage";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  CountryCode,
  Products,
  type Transaction,
  type RemovedTransaction,
  type TransactionCode,
} from "plaid";
import type {
  CreateCompanyParams,
  Company,
  CreatePlaidTransactionParams,
  QuickBooksOauthCredential,
  UpdateQuickBooksOauthCredentialParams,
  CreateQuickBooksOauthCredentialParams,
  PlaidCredential
} from "@/lib/db/types";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { IDB } from "@/server/storage";
import { CompanyRepository } from "@/server/storage/implementaions";
import { SyncJobType } from "@/lib/types"

export type QuickBooksConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: "sandbox" | "production";
}

export type PlaidConfig = {
  environment: "sandbox" | "production";
  clientId: string;
  secret: string;
  webhookUrl: string;
}

export class CompanyService implements ICompanyService {
  private plaid;
  private repo;
  private qbApiBaseUrl: string;
  private static qbStateExpiresInMs = 60 * 5 * 1000; // 5 minutes;
  private static QUICK_BOOKS_OAUTH_SCOPES = "com.intuit.quickbooks.accounting";
  private static readonly QUICK_BOOKS_OAUTH_BASE_URL =
    "https://appcenter.intuit.com/connect/oauth2";
  private static readonly QUICK_BOOKS_OAUTH_TOKEN_URL =
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
  private static readonly QUICK_BOOKS_OAUTH_REVOKE_URL =
    "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

  private readonly qbConfig: QuickBooksConfig;
  private readonly plaidConfig: PlaidConfig;

  private static readonly SYNC_JOB_NAME = "sync-job";

  constructor(
    repo: Storage,
    plaidProps: PlaidConfig,
    qbConfig: QuickBooksConfig,
  ) {
    this.repo = repo;
    this.plaidConfig = plaidProps;
    this.qbConfig = qbConfig;

    // Set the appropriate base URLs based on environment
    switch (this.qbConfig.environment) {
      case "sandbox":
        this.qbApiBaseUrl = "https://sandbox-quickbooks.api.intuit.com";
        break;
      default:
        this.qbApiBaseUrl = "https://quickbooks.api.intuit.com";
        break;
    }

    const plaidConfig = new Configuration({
      basePath: PlaidEnvironments[this.plaidConfig.environment],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": this.plaidConfig.clientId,
          "PLAID-SECRET": this.plaidConfig.secret,
        },
      },
    });

    this.plaid = new PlaidApi(plaidConfig);
  }

  async createPlaidLinkToken({
    companyId,
  }: {
    companyId: number;
  }) {
    const resp = await this.plaid.linkTokenCreate({
      // TODO: read from config
      client_name: "Fundlevel",
      language: "en",
      country_codes: [CountryCode.Us, CountryCode.Ca],
      products: [Products.Transactions],
      user: {
        client_user_id: String(companyId),
      },
      webhook: this.plaidConfig.webhookUrl,
    });

    return resp.data.link_token;
  }

  async createPlaidCredentials(params: {
    companyId: number;
    publicToken: string;
  }) {
    const { item_id, access_token } = (
      await this.plaid.itemPublicTokenExchange({
        public_token: params.publicToken,
      })
    ).data;

    const creds = await this.repo.company.createPlaidCredentials({
      itemId: item_id,
      accessToken: access_token,
    }, params.companyId);

    return creds;
  }

  async getPlaidCredentials(companyId: number): Promise<PlaidCredential> {
    // Get company and check for Plaid item id
    const creds = await this.repo.company.getPlaidCredentialsByCompanyId(companyId);
    return creds
  }

  async getById(id: number) {
    return this.repo.company.getById(id);
  }

  async getByAccountId(accountId: number) {
    return this.repo.company.getByAccountId(accountId);
  }

  async getCompanyByQuickBooksRealmId(
    realmId: string,
  ): Promise<Company | undefined> {
    return this.repo.company.getCompanyByQuickBooksRealmId(realmId);
  }

  async searchCompanies(query: string, accountId: number): Promise<Company[]> {
    return this.repo.company.searchCompanies(query, accountId);
  }

  async create(params: CreateCompanyParams, ownerId: number): Promise<Company> {
    return this.repo.company.create(params, ownerId);
  }

  async deletePlaidCredentials(companyId: number): Promise<void> {
    await this.repo.company.deletePlaidCredentials(companyId);
  }

  async deleteCompany(id: number): Promise<void> {
    try {
      await this.repo.company.deleteQuickBooksOAuthCredentials(id);
    } catch {
      //ignore error
    }

    await this.repo.company.deleteCompany(id);
  }

  async startQuickBooksOAuthFlow(companyId: number, redirectUrl: string) {
    try {
      // Clear old states to avoid conflicts
      await this.repo.company.deleteQuickBooksOauthStates(companyId);
    } catch {
      //ignore error
    }

    const state = uuidv4();

    const params = new URLSearchParams({
      client_id: this.qbConfig.clientId,
      response_type: "code",
      scope: CompanyService.QUICK_BOOKS_OAUTH_SCOPES,
      redirect_uri: this.qbConfig.redirectUri,
      state,
    });

    const auth_url = `${CompanyService.QUICK_BOOKS_OAUTH_BASE_URL}/authorize?${params.toString()}`;

    // Save the state in the session
    await this.repo.company.createQuickBooksOauthState(
      {
        state,
        expiresAt: new Date(
          Date.now() + CompanyService.qbStateExpiresInMs,
        ).toISOString(),
        redirectUrl: redirectUrl,
        authUrl: auth_url,
      },
      companyId,
    );

    return auth_url;
  }

  async completeQuickBooksOAuthFlow(params: {
    code: string;
    state: string;
    realmId: string;
  }) {
    const { code, state: callbackState, realmId } = params;
    const { companyId, redirectUrl } =
      await this.repo.company.getQuickBooksOauthState(callbackState);

    const response = await axios.post(
      CompanyService.QUICK_BOOKS_OAUTH_TOKEN_URL,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.qbConfig.redirectUri,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(
            `${this.qbConfig.clientId}:${this.qbConfig.clientSecret}`,
          ).toString("base64")}`,
        },
      },
    );

    if (typeof response.data === "string") {
      throw new Error("Invalid response format from QuickBooks API");
    }

    if (!response.data.access_token || !response.data.refresh_token) {
      throw new Error(
        "Invalid response format from QuickBooks API",
        response.data,
      );
    }

    const {
      access_token,
      refresh_token,
      expires_in,
      x_refresh_token_expires_in,
    } = response.data;

    // Make direct API call using axios instead of the buggy SDK method
    const companyResponse = await axios.get(
      `${this.qbApiBaseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      },
    );

    // Extract company info from response
    const companyInfo = companyResponse.data.CompanyInfo;
    if (!companyInfo) {
      throw new Error("Invalid response format from QuickBooks API");
    }

    await this.repo.runInTransaction(async (db: IDB) => {
      const companyRepo = new CompanyRepository(db);
      await companyRepo.createQuickBooksOAuthCredentials(
        {
          realmId: realmId,
          accessToken: access_token,
          refreshToken: refresh_token,
          accessTokenExpiry: new Date(
            Date.now() + expires_in * 1000,
          ).toISOString(),
          refreshTokenExpiry: new Date(
            Date.now() + x_refresh_token_expires_in * 1000,
          ).toISOString(),
        },
        companyId,
      );

      // Doesn't really have to be in a tx
      await companyRepo.deleteQuickBooksOauthStates(companyId);
    });

    // Execute sync operations asynchronously without blocking
    Promise.all([
      this.syncAccountingAccounts(companyId).catch(err => console.error('Error syncing accounts:', err)),
      this.syncAccountingTransactions(companyId).catch(err => console.error('Error syncing transactions:', err)),
      this.syncInvoices(companyId).catch(err => console.error('Error syncing invoices:', err)),
      this.syncJournalEntries(companyId).catch(err => console.error('Error syncing journal entries:', err)),
      this.syncPayments(companyId).catch(err => console.error('Error syncing payments:', err)),
      this.syncVendorCredits(companyId).catch(err => console.error('Error syncing vendor credits:', err)),
      this.syncCreditNotes(companyId).catch(err => console.error('Error syncing credit notes:', err))
    ]);

    return {
      redirect_url: redirectUrl,
      company_id: companyId,
    };
  }

  async getQuickBooksOAuthCredentials(companyId: number): Promise<QuickBooksOauthCredential> {
    const creds =
      await this.repo.company.getQuickBooksOAuthCredentials(companyId);

    // Check if token is expired or about to expire in the next 5 minutes
    const now = new Date();
    const tokenExpirationDate = new Date(creds.accessTokenExpiry);
    const bufferMs = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (tokenExpirationDate.getTime() - now.getTime() < bufferMs) {
      const response = await axios.post(
        CompanyService.QUICK_BOOKS_OAUTH_TOKEN_URL,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: creds.refreshToken,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            Authorization: `Basic ${Buffer.from(
              `${this.qbConfig.clientId}:${this.qbConfig.clientSecret}`,
            ).toString("base64")}`,
          },
        }
      );

      // Update token expiry times
      const accessTokenExpiry = new Date(
        Date.now() + response.data.expires_in * 1000,
      ).toISOString();
      const refreshTokenExpiry = new Date(
        Date.now() + response.data.x_refresh_token_expires_in * 1000,
      ).toISOString();

      // Update the database with new token data
      const newRecord = await this.repo.company.updateQuickBooksOAuthCredentials(
        {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          accessTokenExpiry,
          refreshTokenExpiry,
        },
        companyId,
      );

      // Update the return object with fresh data
      return newRecord;
    }

    return creds;
  }

  async deleteQuickBooksOAuthCredentials(companyId: number): Promise<void> {
    const creds =
      await this.repo.company.getQuickBooksOAuthCredentials(companyId);

    await axios.post(
      CompanyService.QUICK_BOOKS_OAUTH_REVOKE_URL,
      new URLSearchParams({
        token: creds.refreshToken,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(
            `${this.qbConfig.clientId}:${this.qbConfig.clientSecret}`,
          ).toString("base64")}`,
        },
      },
    );

    await this.repo.company.deleteQuickBooksOAuthCredentials(companyId);
  }

  async syncInvoices(companyId: number): Promise<void> {
    const response = await this.queryQuickbooks(companyId, 'SELECT * FROM Invoice');
    const invoices = response.Invoice || [];

    // Map to our format
    const invoiceParams = invoices.map((invoice: any) => ({
      remoteId: invoice.Id,
      content: invoice,
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (invoiceParams.length > 0) {
        await repo.accounting.upsertInvoice(invoiceParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.QUICKBOOKS_INVOICES, companyId);
    });
  }
  
  async syncAccountingAccounts(companyId: number): Promise<void> {
    const response = await this.queryQuickbooks(companyId, 'SELECT * FROM Account');
    const accounts = response.Account || [];

    // Map to our format
    const accountParams = accounts.map((account: any) => ({
      remoteId: account.Id,
      content: account,
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (accountParams.length > 0) {
        await repo.accounting.upsertAccount(accountParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.PLAID_BANK_ACCOUNTS, companyId);
    });
  }

  async syncCreditNotes(companyId: number): Promise<void> {
    const response = await this.queryQuickbooks(companyId, 'SELECT * FROM CreditMemo');
    const creditNotes = response.CreditMemo || [];

    // Map to our format
    const creditNoteParams = creditNotes.map((creditNote: any) => ({
      remoteId: creditNote.Id,
      content: creditNote,
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (creditNoteParams.length > 0) {
        await repo.accounting.upsertCreditNote(creditNoteParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.QUICKBOOKS_CREDIT_NOTES, companyId);
    });
  }

  async syncJournalEntries(companyId: number): Promise<void> {
    // Fetch journal entries from QuickBooks
    const response = await this.queryQuickbooks(companyId, 'SELECT * FROM JournalEntry');

    // Process the data
    const journalEntries = response.JournalEntry || [];

    // Map to our format
    const journalEntryParams = journalEntries.map((journalEntry: any) => ({
      remoteId: journalEntry.Id,
      content: journalEntry,
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (journalEntryParams.length > 0) {
        await repo.accounting.upsertJournalEntry(journalEntryParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.QUICKBOOKS_JOURNAL_ENTRIES, companyId);
    });
  }

  async syncPayments(companyId: number): Promise<void> {
    // Fetch payments from QuickBooks
    const response = await this.queryQuickbooks(companyId, 'SELECT * FROM Payment');

    // Process the data
    const payments = response.Payment || [];

    // Map to our format
    const paymentParams = payments.map((payment: any) => ({
      remoteId: payment.Id,
      content: payment,
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (paymentParams.length > 0) {
        await repo.accounting.upsertPayment(paymentParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.QUICKBOOKS_PAYMENTS, companyId);
    });
  }

  async syncAccountingTransactions(companyId: number): Promise<void> {
    // Fetch transactions from QuickBooks
    const response = await this.queryQuickbooks(companyId, 'SELECT * FROM Purchase');

    // Process the data
    const transactions = response.Purchase || [];

    // Map to our format
    const transactionParams = transactions.map((transaction: any) => ({
      remoteId: transaction.Id,
      content: transaction,
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (transactionParams.length > 0) {
        await repo.accounting.upsertQbTransaction(transactionParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.QUICKBOOKS_TRANSACTIONS, companyId);
    });
  }

  async syncVendorCredits(companyId: number): Promise<void> {
    // Fetch vendor credits from QuickBooks
    const response = await this.queryQuickbooks(companyId, 'SELECT * FROM VendorCredit');

    // Process the data
    const vendorCredits = response.VendorCredit || [];

    // Map to our format
    const vendorCreditParams = vendorCredits.map((vendorCredit: any) => ({
      remoteId: vendorCredit.Id,
      content: vendorCredit,
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (vendorCreditParams.length > 0) {
        await repo.accounting.upsertVendorCredit(vendorCreditParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.QUICKBOOKS_VENDOR_CREDITS, companyId);
    });
  }

  async syncBankAccounts(companyId: number): Promise<void> {
    // Get all Plaid items for this company
    const creds = await this.repo.company.getPlaidCredentialsByCompanyId(companyId);
    if (!creds) {
      throw new Error(`Plaid credentials with companyId ${companyId} not found`);
    }

    // Call the Plaid API to get accounts
    const accountsResponse = await this.plaid.accountsGet({
      access_token: creds.accessToken
    });

    if (!accountsResponse?.data?.accounts?.length) {
      throw new Error(`No accounts found for company ${companyId}`);
    }

    // Process the accounts
    const accounts = accountsResponse.data.accounts;
    const bankAccountParams = accounts.map(account => ({
      name: account.name,
      type: account.type as any,
      plaidAccountId: account.account_id,
      remoteId: account.account_id,
      remainingRemoteContent: JSON.stringify(account)
    }));

    // Store in database
    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (bankAccountParams.length > 0) {
        await repo.accounting.upsertBankAccount(bankAccountParams, companyId);
      }
      await repo.company.updateLastSyncedAt(SyncJobType.PLAID_BANK_ACCOUNTS, companyId);
    });
  }

  async syncBankTransactions(companyId: number): Promise<void> {
    const creds = await this.repo.company.getPlaidCredentialsByCompanyId(companyId);
    if (!creds) {
      throw new Error(`Plaid credentials with companyId ${companyId} not found`);
    }

    let cursor = creds.transactionCursor ?? undefined;

    // New transaction updates since "cursor"
    let upsert: Array<Transaction> = [];
    let remove: Array<RemovedTransaction> = [];
    let hasMore = true;

    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await this.plaid.transactionsSync({
        access_token: creds.accessToken,
        cursor,
      });
      const data = response.data;

      // Add this page of results
      upsert = upsert.concat(data.added, data.modified);
      remove = remove.concat(data.removed);

      hasMore = data.has_more;

      // Update cursor to the next cursor
      cursor = data.next_cursor;
    }

    const convertedUpsert: CreatePlaidTransactionParams[] = upsert.map((t) => {
      const {
        transaction_id,
        account_id,
        personal_finance_category,
        name,
        iso_currency_code,
        unofficial_currency_code,
        check_number,
        merchant_name,
        datetime,
        pending,
        original_description,
        authorized_datetime,
        date,
        website,
        amount,
        payment_channel,
        transaction_code,
        ...rest
      } = t;

      const remaining_remote_content = JSON.stringify({
        ...rest,
      });
      return {
        remoteId: transaction_id,
        bankAccountId: account_id,
        personalFinanceCategoryConfidenceLevel:
          personal_finance_category?.confidence_level as
          | "VERY_HIGH"
          | "HIGH"
          | "MEDIUM"
          | "LOW"
          | "UNKNOWN"
          | undefined,
        personalFinanceCategoryPrimary: personal_finance_category?.primary,
        personalFinanceCategoryDetailed: personal_finance_category?.detailed,
        remainingRemoteContent: remaining_remote_content,
        isoCurrencyCode: iso_currency_code,
        unofficialCurrencyCode: unofficial_currency_code,
        checkNumber: check_number,
        date,
        datetime,
        name,
        merchantName: merchant_name,
        website,
        authorizedAt: authorized_datetime,
        originalDescription: original_description,
        pending,
        amount,
        code: transaction_code as TransactionCode,
        paymentChannel: payment_channel,
      };
    });

    await this.repo.runInTransaction(async (db: IDB) => {
      const repo = new Storage(db);
      if (convertedUpsert.length > 0) {
        await repo.accounting.upsertTransaction(convertedUpsert, companyId);
      }

      if (remove.length > 0) {
        await repo.accounting.deleteTransaction(
          remove.map((r) => r.transaction_id),
        );
      }

      if (cursor) {
        await repo.company.updateTransactionCursor(companyId, cursor);
      }


    });


  }

  private async queryQuickbooks(companyId: number, query: string) {
    const credentials = await this.getQuickBooksOAuthCredentials(companyId);

    const response = await axios.get(
      `${this.qbApiBaseUrl}/v3/company/${credentials.realmId}/query`,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          query,
          minorversion: 65
        }
      }
    );

    if (!response.data?.QueryResponse) {
      throw new Error(`No QueryResponse from QuickBooks query for company ${companyId} and statement "${query}"`);
    }

    return response.data.QueryResponse;
  }
}