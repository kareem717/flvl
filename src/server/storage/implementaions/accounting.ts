import type {
  PlaidBankAccount,
  CreatePlaidBankAccountParams,
  PlaidTransaction,
  CreatePlaidTransactionParams,
  QuickBooksInvoice,
  CreateQuickBooksInvoiceParams,
  QuickBooksAccount,
  CreateQuickBooksAccountParams,
  QuickBooksCreditNote,
  CreateQuickBooksCreditNoteParams,
  QuickBooksJournalEntry,
  CreateQuickBooksJournalEntryParams,
  QuickBooksPayment,
  CreateQuickBooksPaymentParams,
  QuickBooksTransaction,
  CreateQuickBooksTransactionParams,
  QuickBooksVendorCredit,
  CreateQuickBooksVendorCreditParams,
} from "@/lib/db/types";
import type { IAccountingRepository } from "../interfaces/accounting";
import {
  plaidBankAccounts,
  plaidTransactions,
  quickBooksInvoices,
  quickBooksAccounts,
  quickBooksCreditNotes,
  quickBooksJournalEntries,
  quickBooksPayments,
  quickBooksTransactions,
  quickBooksVendorCredits
} from "@/lib/db/schema";
import type { DB, Transaction } from "@/lib/db/client";
import { eq, inArray, sql } from "drizzle-orm";
export class AccountingRepository implements IAccountingRepository {
  constructor(private db: DB | Transaction) { }

  async upsertBankAccount(
    bankAccounts: CreatePlaidBankAccountParams[],
    companyId: number,
  ): Promise<PlaidBankAccount[]> {
    if (bankAccounts.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(plaidBankAccounts)
      .values(
        bankAccounts.map(bankAccount => ({ ...bankAccount, companyId }))
      )
      .onConflictDoUpdate({
        target: [plaidBankAccounts.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${plaidBankAccounts.remoteId.name}`),
          name: sql.raw(`excluded.${plaidBankAccounts.name.name}`),
          type: sql.raw(`excluded.${plaidBankAccounts.type.name}`),
          subtype: sql.raw(`excluded.${plaidBankAccounts.subtype.name}`),
          mask: sql.raw(`excluded.${plaidBankAccounts.mask.name}`),
          currentBalance: sql.raw(`excluded.${plaidBankAccounts.currentBalance.name}`),
          availableBalance: sql.raw(`excluded.${plaidBankAccounts.availableBalance.name}`),
          isoCurrencyCode: sql.raw(`excluded.${plaidBankAccounts.isoCurrencyCode.name}`),
          unofficialCurrencyCode: sql.raw(`excluded.${plaidBankAccounts.unofficialCurrencyCode.name}`),
          officialName: sql.raw(`excluded.${plaidBankAccounts.officialName.name}`),
          remainingRemoteContent: sql.raw(`excluded.${plaidBankAccounts.remainingRemoteContent.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create bank accounts");
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
    transactions: CreatePlaidTransactionParams[],
    companyId: number,
  ): Promise<void> {
    if (transactions.length === 0) {
      return;
    }

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
    invoices: CreateQuickBooksInvoiceParams[],
    companyId: number,
  ): Promise<QuickBooksInvoice[]> {
    if (invoices.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(quickBooksInvoices)
      .values(
        invoices.map(invoice => ({ ...invoice, companyId }))
      )
      .onConflictDoUpdate({
        target: [quickBooksInvoices.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${quickBooksInvoices.remoteId.name}`),
          content: sql.raw(`excluded.${quickBooksInvoices.content.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create/update invoices");
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

  // QuickBooks Account methods
  async upsertAccount(
    accounts: CreateQuickBooksAccountParams[],
    companyId: number,
  ): Promise<QuickBooksAccount[]> {
    if (accounts.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(quickBooksAccounts)
      .values(
        accounts.map(account => ({ ...account, companyId }))
      )
      .onConflictDoUpdate({
        target: [quickBooksAccounts.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${quickBooksAccounts.remoteId.name}`),
          content: sql.raw(`excluded.${quickBooksAccounts.content.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create/update accounts");
    }

    return data;
  }

  async getAccountById(id: number): Promise<QuickBooksAccount | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksAccounts)
      .where(eq(quickBooksAccounts.id, id))
      .limit(1);

    return data;
  }

  async getAccountsByCompanyId(companyId: number): Promise<QuickBooksAccount[]> {
    const data = await this.db
      .select()
      .from(quickBooksAccounts)
      .where(eq(quickBooksAccounts.companyId, companyId));

    return data;
  }

  async deleteAccountByRemoteId(remoteId: string | string[]): Promise<void> {
    await this.db
      .delete(quickBooksAccounts)
      .where(inArray(quickBooksAccounts.remoteId, Array.isArray(remoteId) ? remoteId : [remoteId]));
  }

  // QuickBooks Credit Note methods
  async upsertCreditNote(
    creditNotes: CreateQuickBooksCreditNoteParams[],
    companyId: number,
  ): Promise<QuickBooksCreditNote[]> {
    if (creditNotes.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(quickBooksCreditNotes)
      .values(
        creditNotes.map(creditNote => ({ ...creditNote, companyId }))
      )
      .onConflictDoUpdate({
        target: [quickBooksCreditNotes.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${quickBooksCreditNotes.remoteId.name}`),
          content: sql.raw(`excluded.${quickBooksCreditNotes.content.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create/update credit notes");
    }

    return data;
  }

  async getCreditNoteById(id: number): Promise<QuickBooksCreditNote | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksCreditNotes)
      .where(eq(quickBooksCreditNotes.id, id))
      .limit(1);

    return data;
  }

  async getCreditNotesByCompanyId(companyId: number): Promise<QuickBooksCreditNote[]> {
    const data = await this.db
      .select()
      .from(quickBooksCreditNotes)
      .where(eq(quickBooksCreditNotes.companyId, companyId));

    return data;
  }

  async deleteCreditNoteByRemoteId(remoteId: string | string[]): Promise<void> {
    await this.db
      .delete(quickBooksCreditNotes)
      .where(inArray(quickBooksCreditNotes.remoteId, Array.isArray(remoteId) ? remoteId : [remoteId]));
  }

  // QuickBooks Journal Entry methods
  async upsertJournalEntry(
    journalEntries: CreateQuickBooksJournalEntryParams[],
    companyId: number,
  ): Promise<QuickBooksJournalEntry[]> {
    if (journalEntries.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(quickBooksJournalEntries)
      .values(
        journalEntries.map(journalEntry => ({ ...journalEntry, companyId }))
      )
      .onConflictDoUpdate({
        target: [quickBooksJournalEntries.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${quickBooksJournalEntries.remoteId.name}`),
          content: sql.raw(`excluded.${quickBooksJournalEntries.content.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create/update journal entries");
    }

    return data;
  }

  async getJournalEntryById(id: number): Promise<QuickBooksJournalEntry | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksJournalEntries)
      .where(eq(quickBooksJournalEntries.id, id))
      .limit(1);

    return data;
  }

  async getJournalEntriesByCompanyId(companyId: number): Promise<QuickBooksJournalEntry[]> {
    const data = await this.db
      .select()
      .from(quickBooksJournalEntries)
      .where(eq(quickBooksJournalEntries.companyId, companyId));

    return data;
  }

  async deleteJournalEntryByRemoteId(remoteId: string | string[]): Promise<void> {
    await this.db
      .delete(quickBooksJournalEntries)
      .where(inArray(quickBooksJournalEntries.remoteId, Array.isArray(remoteId) ? remoteId : [remoteId]));
  }

  // QuickBooks Payment methods
  async upsertPayment(
    payments: CreateQuickBooksPaymentParams[],
    companyId: number,
  ): Promise<QuickBooksPayment[]> {
    if (payments.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(quickBooksPayments)
      .values(
        payments.map(payment => ({ ...payment, companyId }))
      )
      .onConflictDoUpdate({
        target: [quickBooksPayments.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${quickBooksPayments.remoteId.name}`),
          content: sql.raw(`excluded.${quickBooksPayments.content.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create/update payments");
    }

    return data;
  }

  async getPaymentById(id: number): Promise<QuickBooksPayment | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksPayments)
      .where(eq(quickBooksPayments.id, id))
      .limit(1);

    return data;
  }

  async getPaymentsByCompanyId(companyId: number): Promise<QuickBooksPayment[]> {
    const data = await this.db
      .select()
      .from(quickBooksPayments)
      .where(eq(quickBooksPayments.companyId, companyId));

    return data;
  }

  async deletePaymentByRemoteId(remoteId: string | string[]): Promise<void> {
    await this.db
      .delete(quickBooksPayments)
      .where(inArray(quickBooksPayments.remoteId, Array.isArray(remoteId) ? remoteId : [remoteId]));
  }

  // QuickBooks Transaction methods
  async upsertQbTransaction(
    transactions: CreateQuickBooksTransactionParams[],
    companyId: number,
  ): Promise<QuickBooksTransaction[]> {
    if (transactions.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(quickBooksTransactions)
      .values(
        transactions.map(transaction => ({ ...transaction, companyId }))
      )
      .onConflictDoUpdate({
        target: [quickBooksTransactions.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${quickBooksTransactions.remoteId.name}`),
          content: sql.raw(`excluded.${quickBooksTransactions.content.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create/update QuickBooks transactions");
    }

    return data;
  }

  async getQbTransactionById(id: number): Promise<QuickBooksTransaction | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksTransactions)
      .where(eq(quickBooksTransactions.id, id))
      .limit(1);

    return data;
  }

  async getQbTransactionsByCompanyId(companyId: number): Promise<QuickBooksTransaction[]> {
    const data = await this.db
      .select()
      .from(quickBooksTransactions)
      .where(eq(quickBooksTransactions.companyId, companyId));

    return data;
  }

  async deleteQbTransactionByRemoteId(remoteId: string | string[]): Promise<void> {
    await this.db
      .delete(quickBooksTransactions)
      .where(inArray(quickBooksTransactions.remoteId, Array.isArray(remoteId) ? remoteId : [remoteId]));
  }

  // QuickBooks Vendor Credit methods
  async upsertVendorCredit(
    vendorCredits: CreateQuickBooksVendorCreditParams[],
    companyId: number,
  ): Promise<QuickBooksVendorCredit[]> {
    if (vendorCredits.length === 0) {
      return [];
    }

    const data = await this.db
      .insert(quickBooksVendorCredits)
      .values(
        vendorCredits.map(vendorCredit => ({ ...vendorCredit, companyId }))
      )
      .onConflictDoUpdate({
        target: [quickBooksVendorCredits.remoteId],
        set: {
          remoteId: sql.raw(`excluded.${quickBooksVendorCredits.remoteId.name}`),
          content: sql.raw(`excluded.${quickBooksVendorCredits.content.name}`),
        },
      })
      .returning();

    if (!data.length) {
      throw new Error("Failed to create/update vendor credits");
    }

    return data;
  }

  async getVendorCreditById(id: number): Promise<QuickBooksVendorCredit | undefined> {
    const [data] = await this.db
      .select()
      .from(quickBooksVendorCredits)
      .where(eq(quickBooksVendorCredits.id, id))
      .limit(1);

    return data;
  }

  async getVendorCreditsByCompanyId(companyId: number): Promise<QuickBooksVendorCredit[]> {
    const data = await this.db
      .select()
      .from(quickBooksVendorCredits)
      .where(eq(quickBooksVendorCredits.companyId, companyId));

    return data;
  }

  async deleteVendorCreditByRemoteId(remoteId: string | string[]): Promise<void> {
    await this.db
      .delete(quickBooksVendorCredits)
      .where(inArray(quickBooksVendorCredits.remoteId, Array.isArray(remoteId) ? remoteId : [remoteId]));
  }

  async getInvoice(id: number): Promise<QuickBooksInvoice | undefined> {
    return this.getInvoiceById(id);
  }

  async getJournalEntry(id: number): Promise<QuickBooksJournalEntry | undefined> {
    return this.getJournalEntryById(id);
  }
}
