import type {
  PlaidBankAccount,
  CreatePlaidBankAccountParams,
  PlaidTransaction,
  CreatePlaidTransactionParams,
  QuickBooksInvoice,
  CreateQuickBooksInvoiceParams,
} from "@/lib/db/types";
import type { IAccountingRepository } from "../interfaces/accounting";
import { plaidBankAccounts, plaidTransactions, quickBooksInvoices } from "@/lib/db/schema";
import type { DB } from "@/lib/db/client";
import { eq, inArray } from "drizzle-orm";
export class AccountingRepository implements IAccountingRepository {
  constructor(private db: DB) { }

  async upsertBankAccount(
    bankAccount: CreatePlaidBankAccountParams,
    companyId: number,
  ): Promise<PlaidBankAccount> {
    const [data] = await this.db
      .insert(plaidBankAccounts)
      .values({ ...bankAccount, companyId })
      .onConflictDoUpdate({
        target: [plaidBankAccounts.remoteId],
        set: { ...bankAccount },
      })
      .returning();

    if (!data) {
      throw new Error("Failed to create bank account");
    }

    return data;
  }

  async getBankAccountByRemoteId(id: string): Promise<PlaidBankAccount> {
    const [data] = await this.db
      .select()
      .from(plaidBankAccounts)
      .where(eq(plaidBankAccounts.remoteId, id))
      .limit(1);

    if (!data) {
      throw new Error(`Failed to get bank account: ${id}`);
    }

    return data;
  }

  async getBankAccountsByCompanyId(companyId: number): Promise<PlaidBankAccount[]> {
    const data = await this.db
      .select()
      .from(plaidBankAccounts)
      .where(eq(plaidBankAccounts.companyId, companyId));

    return data;
  }

  async updateBankAccount(
    remoteId: string,
    bankAccount: Partial<CreatePlaidBankAccountParams>,
  ): Promise<PlaidBankAccount> {
    const [data] = await this.db
      .update(plaidBankAccounts)
      .set(bankAccount)
      .where(eq(plaidBankAccounts.remoteId, remoteId))
      .returning();

    if (!data) {
      throw new Error("Failed to update bank account");
    }

    return data;
  }

  async deleteBankAccount(remoteId: string): Promise<void> {
    await this.db
      .delete(plaidBankAccounts)
      .where(eq(plaidBankAccounts.remoteId, remoteId));
  }

  async upsertTransaction(
    transaction: CreatePlaidTransactionParams | CreatePlaidTransactionParams[],
    companyId: number,
  ) {
    const transactions = Array.isArray(transaction)
      ? transaction
      : [transaction];

    await this.db.insert(plaidTransactions).values(
      transactions.map((t) => ({ ...t, companyId })),
    );
  }

  async getTransactionById(id: string): Promise<PlaidTransaction | undefined> {
    const [data] = await this.db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.remoteId, id))
      .limit(1);

    return data;
  }

  async getTransactionsByBankAccountId(
    bankAccountId: string,
  ): Promise<PlaidTransaction[]> {
    const data = await this.db
      .select()
      .from(plaidTransactions)
      .where(eq(plaidTransactions.bankAccountId, bankAccountId));

    return data;
  }

  async deleteTransaction(id: string | string[]): Promise<void> {
    await this.db
      .delete(plaidTransactions)
      .where(inArray(plaidTransactions.remoteId, Array.isArray(id) ? id : [id]));
  }

  async upsertInvoice(
    invoice: CreateQuickBooksInvoiceParams,
    companyId: number,
  ): Promise<QuickBooksInvoice> {
    const [data] = await this.db
      .insert(quickBooksInvoices)
      .values({ ...invoice, companyId })
      .onConflictDoUpdate({
        target: [quickBooksInvoices.remoteId],
        set: { ...invoice },
      })
      .returning();

    if (!data) {
      throw new Error("Failed to create/update invoice");
    }

    return data;
  }

  async getInvoiceById(id: number): Promise<QuickBooksInvoice | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksInvoices)
      .where(eq(quickBooksInvoices.id, id))
      .limit(1);

    return data;
  }

  async getInvoicesByCompanyId(companyId: number): Promise<QuickBooksInvoice[]> {
    const data = await this.db
      .select()
      .from(quickBooksInvoices)
      .where(eq(quickBooksInvoices.companyId, companyId));

    return data;
  }

  async deleteInvoiceByRemoteId(remoteId: string | string[]): Promise<void> {
    await this.db
      .delete(quickBooksInvoices)
      .where(inArray(quickBooksInvoices.remoteId, Array.isArray(remoteId) ? remoteId : [remoteId]));
  }
}
