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
} from "./schema";

export type Company = InferSelectModel<typeof companies>;
export type CreateCompanyParams = Omit<
  OmitEntityFields<InferInsertModel<typeof companies>>,
  "ownerId"
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
  InferInsertModel<typeof quickBooksInvoices>,
  "companyId"
>;
export type UpdateQuickBooksInvoiceParams =
  Partial<CreateQuickBooksInvoiceParams>;

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
