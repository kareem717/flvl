import {
  pgTable,
  foreignKey,
  serial,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  check,
  doublePrecision,
  jsonb,
  index,
  date,
  boolean,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const plaidAccountSubtype = pgEnum("plaid_account_subtype", [
  "401a",
  "401k",
  "403B",
  "457b",
  "529",
  "auto",
  "brokerage",
  "business",
  "cash isa",
  "cash management",
  "cd",
  "checking",
  "commercial",
  "construction",
  "consumer",
  "credit card",
  "crypto exchange",
  "ebt",
  "education savings account",
  "fixed annuity",
  "gic",
  "health reimbursement arrangement",
  "home equity",
  "hsa",
  "isa",
  "ira",
  "keogh",
  "lif",
  "life insurance",
  "line of credit",
  "lira",
  "loan",
  "lrif",
  "lrsp",
  "money market",
  "mortgage",
  "mutual fund",
  "non-custodial wallet",
  "non-taxable brokerage account",
  "other",
  "other insurance",
  "other annuity",
  "overdraft",
  "paypal",
  "payroll",
  "pension",
  "prepaid",
  "prif",
  "profit sharing plan",
  "rdsp",
  "resp",
  "retirement",
  "rlif",
  "roth",
  "roth 401k",
  "rrif",
  "rrsp",
  "sarsep",
  "savings",
  "sep ira",
  "simple ira",
  "sipp",
  "stock plan",
  "student",
  "thrift savings plan",
  "tfsa",
  "trust",
  "ugma",
  "utma",
  "variable annuity",
]);
export const plaidAccountType = pgEnum("plaid_account_type", [
  "investment",
  "credit",
  "depository",
  "loan",
  "brokerage",
  "other",
]);
export const plaidConfidenceLevel = pgEnum("plaid_confidence_level", [
  "VERY_HIGH",
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNKNOWN",
]);
export const plaidTransactionCode = pgEnum("plaid_transaction_code", [
  "adjustment",
  "atm",
  "bank charge",
  "bill payment",
  "cash",
  "cashback",
  "cheque",
  "direct debit",
  "interest",
  "purchase",
  "standing order",
  "transfer",
  "null",
]);
export const plaidTransactionPaymentChannel = pgEnum(
  "plaid_transaction_payment_channel",
  ["online", "in store", "other"],
);

export const accounts = pgTable(
  "accounts",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    email: varchar({ length: 360 }).notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const companies = pgTable(
  "companies",
  {
    id: serial().primaryKey().notNull(),
    ownerId: integer("owner_id").notNull(),
    name: text().notNull(),
    bankAccountsLastSyncedAt: timestamp("bank_accounts_last_synced_at", { withTimezone: true, mode: "string" }),
    transactionsLastSyncedAt: timestamp("transactions_last_synced_at", { withTimezone: true, mode: "string" }),
    invoicesLastSyncedAt: timestamp("invoices_last_synced_at", { withTimezone: true, mode: "string" }),
    journalEntriesLastSyncedAt: timestamp("journal_entries_last_synced_at", { withTimezone: true, mode: "string" }),
    vendorCreditsLastSyncedAt: timestamp("vendor_credits_last_synced_at", { withTimezone: true, mode: "string" }),
    creditNotesLastSyncedAt: timestamp("credit_notes_last_synced_at", { withTimezone: true, mode: "string" }),
    paymentsLastSyncedAt: timestamp("payments_last_synced_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [accounts.id],
      name: "companies_owner_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const plaidCredentials = pgTable(
  "plaid_credentials",
  {
    companyId: integer("company_id").primaryKey().notNull(),
    accessToken: text("access_token").notNull(),
    itemId: text("item_id").notNull(),
    transactionCursor: text("transaction_cursor"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "plaid_credentials_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const plaidBankAccounts = pgTable(
  "plaid_bank_accounts",
  {
    remoteId: text("remote_id").primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    availableBalance: doublePrecision("available_balance"),
    currentBalance: doublePrecision("current_balance"),
    isoCurrencyCode: varchar("iso_currency_code", { length: 3 }),
    unofficialCurrencyCode: varchar("unofficial_currency_code", { length: 3 }),
    mask: varchar({ length: 4 }),
    name: text().notNull(),
    officialName: text("official_name"),
    type: plaidAccountType().notNull(),
    subtype: plaidAccountSubtype(),
    remainingRemoteContent: jsonb("remaining_remote_content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "plaid_bank_accounts_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    check(
      "plaid_bank_accounts_check",
      sql`((iso_currency_code IS NOT NULL) AND (unofficial_currency_code IS NULL)) OR ((iso_currency_code IS NULL) AND (unofficial_currency_code IS NOT NULL))`,
    ),
  ],
);

export const plaidTransactions = pgTable(
  "plaid_transactions",
  {
    remoteId: text("remote_id").primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    bankAccountId: text("bank_account_id").notNull(),
    isoCurrencyCode: varchar("iso_currency_code", { length: 3 }),
    unofficialCurrencyCode: varchar("unofficial_currency_code", { length: 3 }),
    checkNumber: text("check_number"),
    date: date().notNull(),
    datetime: timestamp({ withTimezone: true, mode: "string" }),
    name: text().notNull(),
    merchantName: text("merchant_name"),
    originalDescription: text("original_description"),
    pending: boolean().notNull(),
    website: text(),
    authorizedAt: timestamp("authorized_at", {
      withTimezone: true,
      mode: "string",
    }),
    paymentChannel: plaidTransactionPaymentChannel("payment_channel").notNull(),
    amount: doublePrecision().notNull(),
    personalFinanceCategoryPrimary: text("personal_finance_category_primary"),
    personalFinanceCategoryDetailed: text("personal_finance_category_detailed"),
    personalFinanceCategoryConfidenceLevel: plaidConfidenceLevel(
      "personal_finance_category_confidence_level",
    ),
    code: plaidTransactionCode(),
    remainingRemoteContent: jsonb("remaining_remote_content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    index("plaid_transactions_bank_account_id_idx").using(
      "btree",
      table.bankAccountId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "plaid_transactions_company_id_fkey",
    }).onDelete("restrict").onUpdate("cascade"),
    check(
      "plaid_transactions_check",
      sql`((personal_finance_category_primary IS NULL) AND (personal_finance_category_detailed IS NULL)) OR ((personal_finance_category_primary IS NOT NULL) AND (personal_finance_category_detailed IS NOT NULL))`,
    ),
  ],
);

export const quickBooksOauthCredentials = pgTable(
  "quick_books_oauth_credentials",
  {
    companyId: serial("company_id").primaryKey().notNull(),
    realmId: text("realm_id").notNull(),
    accessToken: text("access_token").notNull(),
    accessTokenExpiry: timestamp("access_token_expiry", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    refreshToken: text("refresh_token").notNull(),
    refreshTokenExpiry: timestamp("refresh_token_expiry", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_oauth_credentials_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const quickBooksOauthStates = pgTable(
  "quick_books_oauth_states",
  {
    companyId: serial("company_id").primaryKey().notNull(),
    state: uuid().notNull(),
    redirectUrl: text("redirect_url").notNull(),
    authUrl: text("auth_url").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_oauth_states_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const quickBooksInvoices = pgTable(
  "quick_books_invoices",
  {
    id: serial().primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    remoteId: text("remote_id").notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_invoices_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    unique("quick_books_invoices_remote_id_key").on(table.remoteId),
  ],
);

export const quickBooksTransactions = pgTable(
  "quick_books_transactions",
  {
    id: serial().primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    remoteId: text("remote_id").notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_transactions_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    unique("quick_books_transactions_remote_id_key").on(table.remoteId),
  ],
);

export const quickBooksJournalEntries = pgTable(
  "quick_books_journal_entries",
  {
    id: serial().primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    remoteId: text("remote_id").notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_journal_entries_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    unique("quick_books_journal_entries_remote_id_key").on(table.remoteId),
  ],
);

export const quickBooksVendorCredits = pgTable(
  "quick_books_vendor_credits",
  {
    id: serial().primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    remoteId: text("remote_id").notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_vendor_credits_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    unique("quick_books_vendor_credits_remote_id_key").on(table.remoteId),
  ],
);

export const quickBooksCreditNotes = pgTable(
  "quick_books_credit_notes",
  {
    id: serial().primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    remoteId: text("remote_id").notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_credit_notes_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    unique("quick_books_credit_notes_remote_id_key").on(table.remoteId),
  ],
);

export const quickBooksPayments = pgTable(
  "quick_books_payments",
  {
    id: serial().primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    remoteId: text("remote_id").notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_payments_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    unique("quick_books_payments_remote_id_key").on(table.remoteId),
  ],
);

export const quickBooksAccounts = pgTable(
  "quick_books_accounts",
  {
    id: serial().primaryKey().notNull(),
    companyId: integer("company_id").notNull(),
    remoteId: text("remote_id").notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [companies.id],
      name: "quick_books_accounts_company_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    unique("quick_books_accounts_remote_id_key").on(table.remoteId),
  ],
);