import type { ICompanyService } from "../interfaces";
import type { IAccountingRepository, ICompanyRepository } from "@/server/storage/interfaces";
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
} from "@/lib/db/types";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

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
  private companyRepo;
  private accountingRepo;
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
  constructor(
    companyRepo: ICompanyRepository,
    accountingRepo: IAccountingRepository,
    plaidProps: PlaidConfig,
    qbConfig: QuickBooksConfig,
  ) {
    this.companyRepo = companyRepo;
    this.accountingRepo = accountingRepo;
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
    this.companyRepo = companyRepo;
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

    const creds = await this.companyRepo.createPlaidCredentials({
      itemId: item_id,
      accessToken: access_token,
    }, params.companyId);

    return creds;
  }

  async getById(id: number) {
    return this.companyRepo.getById(id);
  }

  async getByAccountId(accountId: number) {
    return this.companyRepo.getByAccountId(accountId);
  }

  async getCompanyByQuickBooksRealmId(
    realmId: string,
  ): Promise<Company | undefined> {
    return this.companyRepo.getCompanyByQuickBooksRealmId(realmId);
  }

  async searchCompanies(query: string, accountId: number): Promise<Company[]> {
    return this.companyRepo.searchCompanies(query, accountId);
  }

  async create(params: CreateCompanyParams, ownerId: number): Promise<Company> {
    return this.companyRepo.create(params, ownerId);
  }

  async deletePlaidCredentials(companyId: number): Promise<void> {
    await this.companyRepo.deletePlaidCredentials(companyId);
  }

  async deleteCompany(id: number): Promise<void> {
    try {
      await this.companyRepo.deleteQuickBooksOAuthCredentials(id);
    } catch {
      //ignore error
    }

    await this.companyRepo.deleteCompany(id);
  }

  async startQuickBooksOAuthFlow(companyId: number, redirectUrl: string) {
    try {
      // Clear old states to avoid conflicts
      await this.companyRepo.deleteQuickBooksOauthStates(companyId);
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
    await this.companyRepo.createQuickBooksOauthState(
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
      await this.companyRepo.getQuickBooksOauthState(callbackState);

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

    await this.companyRepo.createQuickBooksOAuthCredentials(
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
    await this.companyRepo.deleteQuickBooksOauthStates(companyId);

    return {
      redirect_url: redirectUrl,
      company_id: companyId,
    };
  }

  async getQuickBooksOAuthCredentials(companyId: number) {
    const creds =
      await this.companyRepo.getQuickBooksOAuthCredentials(companyId);

    if (creds.accessTokenExpiry < new Date().toISOString()) {
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
        },
      );

      // Update token expiry times
      const accessTokenExpiry = new Date(
        Date.now() + response.data.expires_in * 1000,
      ).toISOString();
      const refreshTokenExpiry = new Date(
        Date.now() + response.data.x_refresh_token_expires_in * 1000,
      ).toISOString();

      // Update the database with new token data
      const newRrcord = await this.companyRepo.updateQuickBooksOAuthCredentials(
        {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          accessTokenExpiry,
          refreshTokenExpiry,
        },
        companyId,
      );

      // Update the return object with fresh data
      return newRrcord;
    }

    return creds;
  }

  async deleteQuickBooksOAuthCredentials(companyId: number): Promise<void> {
    const creds =
      await this.companyRepo.getQuickBooksOAuthCredentials(companyId);

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

    await this.companyRepo.deleteQuickBooksOAuthCredentials(companyId);
  }

  async syncPlaidBankAccounts(itemId: string) {
    const creds = await this.companyRepo.getPlaidCredentialsByItemId(itemId);

    const plaidResp = await this.plaid.accountsGet({
      access_token: creds.accessToken,
    });

    const accounts = plaidResp.data.accounts;

    for (const account of accounts) {
      const {
        account_id,
        balances,
        mask,
        name,
        official_name,
        subtype,
        type,
        ...rest
      } = account;
      const {
        current,
        available,
        iso_currency_code,
        unofficial_currency_code,
        ...restBalances
      } = balances;

      // Not possible according to plaid docs
      if (iso_currency_code && unofficial_currency_code) {
        throw new Error(
          "Payload contains both iso and unofficial currency code",
        );
      }

      // Not possible according to plaid docs
      if (!iso_currency_code && !unofficial_currency_code) {
        throw new Error(
          "Payload contains neither iso nor unofficial currency code",
        );
      }

      const remaining_remote_content = JSON.stringify({
        ...rest,
        balances: restBalances,
      });

      await this.accountingRepo.upsertBankAccount(
        {
          remoteId: account_id,
          remainingRemoteContent: remaining_remote_content,
          currentBalance: current,
          availableBalance: available,
          isoCurrencyCode: iso_currency_code,
          unofficialCurrencyCode: unofficial_currency_code,
          mask,
          name,
          officialName: official_name,
          subtype,
          type,
        },
        creds.companyId,
      );
    }
  }

  async syncPlaidTransactions(itemId: string) {
    const { accessToken, companyId, transactionCursor } =
      await this.companyRepo.getPlaidCredentialsByItemId(itemId);

    let cursor = transactionCursor ?? undefined;

    // New transaction updates since "cursor"
    let upsert: Array<Transaction> = [];
    let remove: Array<RemovedTransaction> = [];
    let hasMore = true;

    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await this.plaid.transactionsSync({
        access_token: accessToken,
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

    //TODO: THIS IS SUPER UNSAFE, WE NEED TO USE TXN - MIGRATE TO DRIZZLE
    await this.accountingRepo.upsertTransaction(convertedUpsert, companyId);
    await this.accountingRepo.deleteTransaction(
      remove.map((r) => r.transaction_id),
    );

    if (cursor) {
      await this.companyRepo.updateTransactionCursor(companyId, cursor);
    }
  }

  async syncQuickBooksInvoices(companyId: number): Promise<void> {
    try {
      // Get QuickBooks OAuth credentials for the company
      const credentials = await this.getQuickBooksOAuthCredentials(companyId);

      if (!credentials) {
        throw new Error(
          `No QuickBooks credentials found for company ${companyId}`,
        );
      }

      // Check if access token is expired and refresh if needed
      const now = new Date();
      const tokenExpirationDate = new Date(credentials.accessTokenExpiry);

      let accessToken = credentials.accessToken;

      // If token is expired or about to expire in the next 5 minutes, refresh it
      if (tokenExpirationDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        // Refresh the token
        const refreshResponse = await axios.post(
          CompanyService.QUICK_BOOKS_OAUTH_TOKEN_URL,
          new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: credentials.refreshToken,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${this.qbConfig.clientId}:${this.qbConfig.clientSecret}`,
              ).toString("base64")}`,
            },
          },
        );

        const refreshData = refreshResponse.data;

        // Update credentials in database
        await this.companyRepo.updateQuickBooksOAuthCredentials(
          {
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token,
            accessTokenExpiry: new Date(
              Date.now() + refreshData.expires_in * 1000,
            ).toISOString(),
            refreshTokenExpiry: new Date(
              Date.now() + refreshData.x_refresh_token_expires_in * 1000,
            ).toISOString(),
          },
          companyId,
        );

        accessToken = refreshData.access_token;
      }

      // Fetch invoices from QuickBooks API
      const response = await axios.get(
        `${this.qbApiBaseUrl}/v3/company/${credentials.realmId}/query`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
          params: {
            query:
              "SELECT * FROM Invoice WHERE Metadata.LastUpdatedTime > '2000-01-01'",
            minorversion: 65, // Use appropriate minor version
          },
        },
      );

      const invoicesData = response.data;

      // Process and store invoices
      if (invoicesData.QueryResponse?.Invoice) {
        const invoices = invoicesData.QueryResponse.Invoice;

        // Process each invoice
        for (const invoice of invoices) {
          await this.accountingRepo.upsertInvoice(
            {
              remoteId: invoice.Id,
              content: invoice, // Store the full invoice response as JSON
            },
            companyId,
          );
        }

        console.log(
          `Synced ${invoices.length} invoices for company ${companyId}`,
        );
      } else {
        console.log(`No invoices found for company ${companyId}`);
      }
    } catch (error: unknown) {
      console.error("Error syncing QuickBooks invoices:", error);
      throw new Error(
        `Failed to sync QuickBooks invoices: ${(error as Error).message || "Unknown error"}`,
      );
    }
  }

  async updateQuickBooksOAuthCredentials(
    params: UpdateQuickBooksOauthCredentialParams,
    companyId: number,
  ): Promise<QuickBooksOauthCredential> {
    return this.companyRepo.updateQuickBooksOAuthCredentials(params, companyId);
  }

  async createQuickBooksOAuthCredentials(
    params: CreateQuickBooksOauthCredentialParams,
    companyId: number,
  ): Promise<QuickBooksOauthCredential> {
    return this.companyRepo.createQuickBooksOAuthCredentials(params, companyId);
  }
}
