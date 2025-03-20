import { relations } from "drizzle-orm/relations";
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

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  companies: many(companies),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  account: one(accounts, {
    fields: [companies.ownerId],
    references: [accounts.id],
  }),
  plaidCredentials: many(plaidCredentials),
  plaidBankAccounts: many(plaidBankAccounts),
  plaidTransactions: many(plaidTransactions),
  quickBooksOauthCredentials: many(quickBooksOauthCredentials),
  quickBooksOauthStates: many(quickBooksOauthStates),
  quickBooksInvoices: many(quickBooksInvoices),
}));

export const plaidCredentialsRelations = relations(
  plaidCredentials,
  ({ one }) => ({
    company: one(companies, {
      fields: [plaidCredentials.companyId],
      references: [companies.id],
    }),
  }),
);

export const plaidBankAccountsRelations = relations(
  plaidBankAccounts,
  ({ one }) => ({
    company: one(companies, {
      fields: [plaidBankAccounts.companyId],
      references: [companies.id],
    }),
  }),
);

export const plaidTransactionsRelations = relations(
  plaidTransactions,
  ({ one }) => ({
    company: one(companies, {
      fields: [plaidTransactions.companyId],
      references: [companies.id],
    }),
  }),
);

export const quickBooksOauthCredentialsRelations = relations(
  quickBooksOauthCredentials,
  ({ one }) => ({
    company: one(companies, {
      fields: [quickBooksOauthCredentials.companyId],
      references: [companies.id],
    }),
  }),
);

export const quickBooksOauthStatesRelations = relations(
  quickBooksOauthStates,
  ({ one }) => ({
    company: one(companies, {
      fields: [quickBooksOauthStates.companyId],
      references: [companies.id],
    }),
  }),
);

export const quickBooksInvoicesRelations = relations(
  quickBooksInvoices,
  ({ one }) => ({
    company: one(companies, {
      fields: [quickBooksInvoices.companyId],
      references: [companies.id],
    }),
  }),
);
