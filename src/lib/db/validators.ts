import { createSelectSchema, createUpdateSchema, createInsertSchema } from "drizzle-zod";
import {
  accounts,
  companies,
  plaidCredentials,
  plaidBankAccounts,
  plaidTransactions,
  quickBooksOauthCredentials,
  quickBooksOauthStates,
  quickBooksInvoices,
} from "./schema";
import { z } from "zod";

// Account schemas
export const AccountSchema = createSelectSchema(accounts);
export const CreateAccountParamsSchema = createInsertSchema(accounts)
  .omit({ id: true, createdAt: true, updatedAt: true, userId: true });
export const UpdateAccountParamsSchema = createUpdateSchema(accounts)
  .omit({ id: true, createdAt: true, updatedAt: true, userId: true });

// Company schemas
export const CompanySchema = createSelectSchema(companies);
export const CreateCompanyParamsSchema = createInsertSchema(companies)
  .omit({ id: true, createdAt: true, updatedAt: true, ownerId: true });
export const UpdateCompanyParamsSchema = createUpdateSchema(companies)
  .omit({ id: true, createdAt: true, updatedAt: true, ownerId: true });

// PlaidCredential schemas
export const PlaidCredentialSchema = createSelectSchema(plaidCredentials);
export const CreatePlaidCredentialParamsSchema = createInsertSchema(plaidCredentials)
  .omit({ createdAt: true, updatedAt: true, companyId: true });
export const UpdatePlaidCredentialParamsSchema = createUpdateSchema(plaidCredentials)
  .omit({ createdAt: true, updatedAt: true, companyId: true });

// PlaidBankAccount schemas
export const PlaidBankAccountSchema = createSelectSchema(plaidBankAccounts);
export const CreatePlaidBankAccountParamsSchema = createInsertSchema(plaidBankAccounts)
  .omit({ createdAt: true, updatedAt: true, companyId: true });
export const UpdatePlaidBankAccountParamsSchema = createUpdateSchema(plaidBankAccounts)
  .omit({ createdAt: true, updatedAt: true, companyId: true });

// PlaidTransaction schemas
export const PlaidTransactionSchema = createSelectSchema(plaidTransactions);
export const CreatePlaidTransactionParamsSchema = createInsertSchema(plaidTransactions)
  .omit({ createdAt: true, updatedAt: true, companyId: true });
export const UpdatePlaidTransactionParamsSchema = createUpdateSchema(plaidTransactions)
  .omit({ createdAt: true, updatedAt: true, companyId: true });

// QuickBooksOauthCredential schemas
export const QuickBooksOauthCredentialSchema = createSelectSchema(quickBooksOauthCredentials);
export const CreateQuickBooksOauthCredentialParamsSchema = createInsertSchema(quickBooksOauthCredentials)
  .omit({ createdAt: true, updatedAt: true, companyId: true });
export const UpdateQuickBooksOauthCredentialParamsSchema = createUpdateSchema(quickBooksOauthCredentials)
  .omit({ createdAt: true, updatedAt: true, companyId: true, realmId: true });

// QuickBooksOauthState schemas
export const QuickBooksOauthStateSchema = createSelectSchema(quickBooksOauthStates);
export const CreateQuickBooksOauthStateParamsSchema = createInsertSchema(quickBooksOauthStates)
  .omit({ companyId: true });
export const UpdateQuickBooksOauthStateParamsSchema = createUpdateSchema(quickBooksOauthStates)
  .omit({ companyId: true });

// QuickBooksInvoice schemas
export const QuickBooksInvoiceSchema = createSelectSchema(quickBooksInvoices);
export const CreateQuickBooksInvoiceParamsSchema = createInsertSchema(quickBooksInvoices)
  .omit({ id: true, createdAt: true, updatedAt: true, companyId: true });
export const UpdateQuickBooksInvoiceParamsSchema = createUpdateSchema(quickBooksInvoices)
  .omit({ id: true, createdAt: true, updatedAt: true, companyId: true });
