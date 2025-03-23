import type {
  CreateCompanyParams,
  CreatePlaidCredentialParams,
  CreateQuickBooksOauthCredentialParams,
  CreateQuickBooksOauthStateParams,
  Company,
  UpdateQuickBooksOauthCredentialParams,
} from "@/lib/db/types";
import type { ICompanyRepository } from "../interfaces/company";
import {
  companies,
  plaidCredentials,
  quickBooksOauthCredentials,
  quickBooksOauthStates,
} from "@/lib/db/schema";
import { and, eq, like } from "drizzle-orm";
import { SyncJobType } from "@/lib/types";
import { IDB } from "..";

export class CompanyRepository implements ICompanyRepository {
  constructor(private readonly db: IDB) { }

  async updateLastSyncedAt(type: SyncJobType, companyId: number): Promise<Company> {
    let column

    switch (type) {
      case SyncJobType.QUICKBOOKS_INVOICES:
        column = companies.invoicesLastSyncedAt.name
        break;
      case SyncJobType.QUICKBOOKS_ACCOUNTS:
        column = companies.bankAccountsLastSyncedAt.name
        break;
      case SyncJobType.QUICKBOOKS_TRANSACTIONS:
        column = companies.transactionsLastSyncedAt.name
        break;
      case SyncJobType.QUICKBOOKS_CREDIT_NOTES:
        column = companies.creditNotesLastSyncedAt.name
        break;
      case SyncJobType.QUICKBOOKS_JOURNAL_ENTRIES:
        column = companies.journalEntriesLastSyncedAt.name
        break;
      case SyncJobType.QUICKBOOKS_PAYMENTS:
        column = companies.paymentsLastSyncedAt.name
        break;
      case SyncJobType.QUICKBOOKS_VENDOR_CREDITS:
        column = companies.vendorCreditsLastSyncedAt.name
        break;
      case SyncJobType.PLAID_BANK_ACCOUNTS:
        column = companies.bankAccountsLastSyncedAt.name
        break;
      case SyncJobType.PLAID_TRANSACTIONS:
        column = companies.transactionsLastSyncedAt.name
        break;
      default:
        throw new Error(`Unknown sync job type: ${type}`);
    }

    console.log(`Updating ${column} for company ${companyId} to ${new Date().toISOString()}`);

    const [data] = await this.db
      .update(companies)
      .set({ [column]: new Date().toISOString() })
      .where(eq(companies.id, companyId))
      .returning();

    if (!data) {
      throw new Error("Failed to update company");
    }

    return data;
  }
  
  async create(params: CreateCompanyParams, ownerId: number) {
    const [data] = await this.db
      .insert(companies)
      .values({ ...params, ownerId })
      .returning();

    if (!data) {
      throw new Error("Failed to create company");
    }

    return data;
  }

  async getById(id: number): Promise<Company> {
    const [data] = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (!data) {
      throw new Error("Company not found");
    }

    return data;
  }

  async getByAccountId(accountId: number): Promise<Company[]> {
    const data = await this.db
      .select()
      .from(companies)
      .where(eq(companies.ownerId, accountId));

    return data;
  }

  async searchCompanies(query: string, accountId: number): Promise<Company[]> {
    // Create a base query
    const data = await this.db
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.ownerId, accountId),
          like(companies.name, `%${query}%`),
        ),
      );

    return data;
  }

  async createPlaidCredentials(params: CreatePlaidCredentialParams, companyId: number) {
    const [data] = await this.db
      .insert(plaidCredentials)
      .values({ ...params, companyId })
      .returning();

    if (!data) {
      throw new Error("Failed to create Plaid credentials");
    }

    return data;
  }

  async deletePlaidCredentials(companyId: number): Promise<void> {
    await this.db
      .delete(plaidCredentials)
      .where(eq(plaidCredentials.companyId, companyId));
  }

  async deleteCompany(id: number): Promise<void> {
    // First delete any credentials
    try {
      await this.deletePlaidCredentials(id);
    } catch (error) {
      console.error("Error deleting Plaid credentials:", error);
    }

    // Then delete the linked account
    await this.db.delete(companies).where(eq(companies.id, id));
  }

  async getPlaidCredentialsByItemId(itemId: string) {
    const [data] = await this.db
      .select()
      .from(plaidCredentials)
      .where(eq(plaidCredentials.itemId, itemId))
      .limit(1);

    if (!data) {
      throw new Error("Failed to get Plaid credentials");
    }

    return data;
  }

  async getPlaidCredentialsByCompanyId(companyId: number) {
    const [data] = await this.db
      .select()
      .from(plaidCredentials)
      .where(eq(plaidCredentials.companyId, companyId))
      .limit(1);

    if (!data) {
      throw new Error("Failed to get Plaid credentials");
    }

    return data;
  }

  async getQuickBooksOAuthCredentials(companyId: number) {
    const [data] = await this.db
      .select()
      .from(quickBooksOauthCredentials)
      .where(eq(quickBooksOauthCredentials.companyId, companyId))
      .limit(1);

    if (!data) {
      throw new Error("Failed to get QuickBooks OAuth credentials");
    }

    return data;
  }

  async updateQuickBooksOAuthCredentials(
    params: UpdateQuickBooksOauthCredentialParams,
    companyId: number,
  ) {
    const [data] = await this.db
      .update(quickBooksOauthCredentials)
      .set(params)
      .where(eq(quickBooksOauthCredentials.companyId, companyId))
      .returning();

    if (!data) {
      throw new Error("Failed to update QuickBooks OAuth credentials");
    }

    return data;
  }

  async createQuickBooksOAuthCredentials(
    params: CreateQuickBooksOauthCredentialParams,
    companyId: number,
  ) {
    const [data] = await this.db
      .insert(quickBooksOauthCredentials)
      .values({
        ...params,
        companyId,
      })
      .returning();

    if (!data) {
      throw new Error("Failed to create QuickBooks OAuth credentials");
    }

    return data;
  }

  async updateTransactionCursor(
    companyId: number,
    cursor: string,
  ): Promise<void> {
    const [data] = await this.db
      .update(plaidCredentials)
      .set({ transactionCursor: cursor })
      .where(eq(plaidCredentials.companyId, companyId))
      .returning();

    if (!data) {
      throw new Error("Failed to update transaction cursor");
    }
  }

  async deleteQuickBooksOAuthCredentials(companyId: number) {
    await this.db
      .delete(quickBooksOauthCredentials)
      .where(eq(quickBooksOauthCredentials.companyId, companyId));
  }

  async getQuickBooksOauthState(state: string) {
    const [data] = await this.db
      .select()
      .from(quickBooksOauthStates)
      .where(eq(quickBooksOauthStates.state, state))
      .limit(1);

    if (!data) {
      throw new Error("Failed to get QuickBooks OAuth state");
    }

    return data;
  }

  async deleteQuickBooksOauthStates(companyId: number) {
    await this.db
      .delete(quickBooksOauthStates)
      .where(eq(quickBooksOauthStates.companyId, companyId));
  }

  async createQuickBooksOauthState(
    params: CreateQuickBooksOauthStateParams,
    companyId: number,
  ): Promise<void> {
    const [data] = await this.db
      .insert(quickBooksOauthStates)
      .values({
        ...params,
        companyId,
      })
      .returning();

    if (!data) {
      throw new Error("Failed to create QuickBooks OAuth state");
    }
  }

  async getCompanyByQuickBooksRealmId(
    realmId: string,
  ): Promise<Company | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksOauthCredentials)
      .where(eq(quickBooksOauthCredentials.realmId, realmId))
      .limit(1);

    if (!data) {
      return undefined;
    }

    // Get the company using the company_id from the credentials
    const [company] = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, data.companyId))
      .limit(1);

    return company;
  }
}
