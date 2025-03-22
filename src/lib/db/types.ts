import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  accounts,
  companies,
  plaidCredentials,
  plaidBankAccounts,
  plaidTransactions,
  quickBooksOauthCredentials,
  quickBooksOauthStates,
  quickBooksInvoices,
  quickBooksCreditNotes,
  quickBooksPayments,
  quickBooksAccounts,
  quickBooksJournalEntries,
  quickBooksVendorCredits,
  quickBooksTransactions,
} from "./schema";

export type Company = InferSelectModel<typeof companies>;
export type CreateCompanyParams = Omit<
  OmitEntityFields<InferInsertModel<typeof companies>>,
  "ownerId" | "bankAccountsLastSyncedAt" | "transactionsLastSyncedAt" | "invoicesLastSyncedAt" | "journalEntriesLastSyncedAt" | "vendorCreditsLastSyncedAt" | "creditNotesLastSyncedAt" | "paymentsLastSyncedAt"
>;
export type UpdateCompanyParams = Partial<CreateCompanyParams>;

export type Account = InferSelectModel<typeof accounts>;
export type CreateAccountParams = OmitEntityFields<
  InferInsertModel<typeof accounts>
>;
export type UpdateAccountParams = Omit<Partial<CreateAccountParams>, "userId">;

export type PlaidCredential = InferSelectModel<typeof plaidCredentials>;
export type CreatePlaidCredentialParams = Omit<
  OmitTimeStampFields<InferInsertModel<typeof plaidCredentials>>,
  "companyId"
>;
export type UpdatePlaidCredentialParams = Partial<CreatePlaidCredentialParams>;

export type PlaidBankAccount = InferSelectModel<typeof plaidBankAccounts>;
export type CreatePlaidBankAccountParams = Omit<
  OmitTimeStampFields<InferInsertModel<typeof plaidBankAccounts>>,
  "companyId"
>;
export type UpdatePlaidBankAccountParams =
  Partial<CreatePlaidBankAccountParams>;

export type PlaidTransaction = InferSelectModel<typeof plaidTransactions>;
export type CreatePlaidTransactionParams = Omit<
  OmitTimeStampFields<InferInsertModel<typeof plaidTransactions>>,
  "companyId"
>;
export type UpdatePlaidTransactionParams =
  Partial<CreatePlaidTransactionParams>;

export type QuickBooksOauthCredential = InferSelectModel<
  typeof quickBooksOauthCredentials
>;
export type CreateQuickBooksOauthCredentialParams = Omit<
  OmitTimeStampFields<InferInsertModel<typeof quickBooksOauthCredentials>>,
  "companyId"
>;
export type UpdateQuickBooksOauthCredentialParams = Omit<
  Partial<CreateQuickBooksOauthCredentialParams>,
  "realmId"
>;

export type QuickBooksOauthState = InferSelectModel<
  typeof quickBooksOauthStates
>;
export type CreateQuickBooksOauthStateParams = Omit<
  InferInsertModel<typeof quickBooksOauthStates>,
  "companyId"
>;
export type UpdateQuickBooksOauthStateParams =
  Partial<CreateQuickBooksOauthStateParams>;

export type QuickBooksInvoice = InferSelectModel<typeof quickBooksInvoices>;
export type CreateQuickBooksInvoiceParams = Omit<
  OmitEntityFields<InferInsertModel<typeof quickBooksInvoices>>,
  "companyId"
>;
export type UpdateQuickBooksInvoiceParams =
  Partial<CreateQuickBooksInvoiceParams>;

export type QuickBooksCreditNote = InferSelectModel<typeof quickBooksCreditNotes>;
export type CreateQuickBooksCreditNoteParams = Omit<
  OmitEntityFields<InferInsertModel<typeof quickBooksCreditNotes>>,
  "companyId"
>;
export type UpdateQuickBooksCreditNoteParams =
  Partial<CreateQuickBooksCreditNoteParams>;

export type QuickBooksPayment = InferSelectModel<typeof quickBooksPayments>;
export type CreateQuickBooksPaymentParams = Omit<
  OmitEntityFields<InferInsertModel<typeof quickBooksPayments>>,
  "companyId"
>;
export type UpdateQuickBooksPaymentParams = Partial<CreateQuickBooksPaymentParams>;

export type QuickBooksAccount = InferSelectModel<typeof quickBooksAccounts>;
export type CreateQuickBooksAccountParams = Omit<
  OmitEntityFields<InferInsertModel<typeof quickBooksAccounts>>,
  "companyId"
>;
export type UpdateQuickBooksAccountParams = Partial<CreateQuickBooksAccountParams>;

export type QuickBooksJournalEntry = InferSelectModel<typeof quickBooksJournalEntries>;
export type CreateQuickBooksJournalEntryParams = Omit<
  OmitEntityFields<InferInsertModel<typeof quickBooksJournalEntries>>,
  "companyId"
>;
export type UpdateQuickBooksJournalEntryParams = Partial<CreateQuickBooksJournalEntryParams>;

export type QuickBooksVendorCredit = InferSelectModel<typeof quickBooksVendorCredits>;
export type CreateQuickBooksVendorCreditParams = Omit<
  OmitEntityFields<InferInsertModel<typeof quickBooksVendorCredits>>,
  "companyId" 
>;
export type UpdateQuickBooksVendorCreditParams = Partial<CreateQuickBooksVendorCreditParams>;

export type QuickBooksTransaction = InferSelectModel<typeof quickBooksTransactions>;
export type CreateQuickBooksTransactionParams = Omit<
  OmitEntityFields<InferInsertModel<typeof quickBooksTransactions>>,
  "companyId"
>;
export type UpdateQuickBooksTransactionParams = Partial<CreateQuickBooksTransactionParams>;

// utils
type TimeStampFields = {
  createdAt: string | Date;
  updatedAt: string | Date | null;
};

type EntityFields = TimeStampFields & {
  id: string | number;
};

type OmitTimeStampFields<T extends Partial<TimeStampFields>> = Omit<
  T,
  "createdAt" | "updatedAt"
>;
type OmitEntityFields<T extends Partial<EntityFields>> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;
