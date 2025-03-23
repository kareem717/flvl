import type {
  PlaidBankAccount,
  CreatePlaidBankAccountParams,
  CreatePlaidTransactionParams,
  PlaidTransaction,
  CreateQuickBooksInvoiceParams,
  QuickBooksInvoice,
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

export interface IAccountingRepository {
  // Plaid Bank Account methods
  upsertBankAccount(
    bankAccount: CreatePlaidBankAccountParams[],
    companyId: number,
  ): Promise<PlaidBankAccount[]>;
  getBankAccountByRemoteId(id: string): Promise<PlaidBankAccount>;
  getBankAccountsByCompanyId(companyId: number): Promise<PlaidBankAccount[]>;
  updateBankAccount(
    remoteId: string,
    bankAccount: Partial<CreatePlaidBankAccountParams>,
  ): Promise<PlaidBankAccount>;
  deleteBankAccount(remoteId: string): Promise<void>;

  // Plaid Transaction methods
  upsertTransaction(
    transaction: CreatePlaidTransactionParams[],
    companyId: number,
  ): Promise<void>;
  getTransactionById(id: string): Promise<PlaidTransaction | undefined>;
  getTransactionsByBankAccountId(
    bankAccountId: string,
  ): Promise<PlaidTransaction[]>;
  deleteTransaction(id: string | string[]): Promise<void>;

  // QuickBooks Invoice methods
  upsertInvoice(
    invoice: CreateQuickBooksInvoiceParams[],
    companyId: number,
  ): Promise<QuickBooksInvoice[]>;
  getInvoiceById(id: number): Promise<QuickBooksInvoice | undefined>;
  getInvoicesByCompanyId(companyId: number): Promise<QuickBooksInvoice[]>;
  deleteInvoiceByRemoteId(remoteId: string | string[]): Promise<void>;

  // QuickBooks Account methods
  upsertAccount(
    account: CreateQuickBooksAccountParams[],
    companyId: number,
  ): Promise<QuickBooksAccount[]>;
  getAccountById(id: number): Promise<QuickBooksAccount | undefined>;
  getAccountsByCompanyId(companyId: number): Promise<QuickBooksAccount[]>;
  deleteAccountByRemoteId(remoteId: string | string[]): Promise<void>;

  // QuickBooks Credit Note methods
  upsertCreditNote(
    creditNote: CreateQuickBooksCreditNoteParams[],
    companyId: number,
  ): Promise<QuickBooksCreditNote[]>;
  getCreditNoteById(id: number): Promise<QuickBooksCreditNote | undefined>;
  getCreditNotesByCompanyId(companyId: number): Promise<QuickBooksCreditNote[]>;
  deleteCreditNoteByRemoteId(remoteId: string | string[]): Promise<void>;

  // QuickBooks Journal Entry methods
  upsertJournalEntry(
    journalEntry: CreateQuickBooksJournalEntryParams[],
    companyId: number,
  ): Promise<QuickBooksJournalEntry[]>;
  getJournalEntryById(id: number): Promise<QuickBooksJournalEntry | undefined>;
  getJournalEntriesByCompanyId(
    companyId: number,
  ): Promise<QuickBooksJournalEntry[]>;
  deleteJournalEntryByRemoteId(remoteId: string | string[]): Promise<void>;

  // QuickBooks Payment methods
  upsertPayment(
    payment: CreateQuickBooksPaymentParams[],
    companyId: number,
  ): Promise<QuickBooksPayment[]>;
  getPaymentById(id: number): Promise<QuickBooksPayment | undefined>;
  getPaymentsByCompanyId(companyId: number): Promise<QuickBooksPayment[]>;
  deletePaymentByRemoteId(remoteId: string | string[]): Promise<void>;

  // QuickBooks Transaction methods
  upsertQbTransaction(
    transaction: CreateQuickBooksTransactionParams[],
    companyId: number,
  ): Promise<QuickBooksTransaction[]>;
  getQbTransactionById(id: number): Promise<QuickBooksTransaction | undefined>;
  getQbTransactionsByCompanyId(
    companyId: number,
  ): Promise<QuickBooksTransaction[]>;
  deleteQbTransactionByRemoteId(remoteId: string | string[]): Promise<void>;

  // QuickBooks Vendor Credit methods
  upsertVendorCredit(
    vendorCredit: CreateQuickBooksVendorCreditParams[],
    companyId: number,
  ): Promise<QuickBooksVendorCredit[]>;
  getVendorCreditById(id: number): Promise<QuickBooksVendorCredit | undefined>;
  getVendorCreditsByCompanyId(
    companyId: number,
  ): Promise<QuickBooksVendorCredit[]>;
  deleteVendorCreditByRemoteId(remoteId: string | string[]): Promise<void>;

  getInvoice(id: number): Promise<QuickBooksInvoice | undefined>;
  getInvoicesByCompanyId(companyId: number): Promise<QuickBooksInvoice[]>;

  getJournalEntry(id: number): Promise<QuickBooksJournalEntry | undefined>;
  getJournalEntriesByCompanyId(
    companyId: number,
  ): Promise<QuickBooksJournalEntry[]>;
}
