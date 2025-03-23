CREATE TYPE "public"."plaid_account_subtype" AS ENUM('401a', '401k', '403B', '457b', '529', 'auto', 'brokerage', 'business', 'cash isa', 'cash management', 'cd', 'checking', 'commercial', 'construction', 'consumer', 'credit card', 'crypto exchange', 'ebt', 'education savings account', 'fixed annuity', 'gic', 'health reimbursement arrangement', 'home equity', 'hsa', 'isa', 'ira', 'keogh', 'lif', 'life insurance', 'line of credit', 'lira', 'loan', 'lrif', 'lrsp', 'money market', 'mortgage', 'mutual fund', 'non-custodial wallet', 'non-taxable brokerage account', 'other', 'other insurance', 'other annuity', 'overdraft', 'paypal', 'payroll', 'pension', 'prepaid', 'prif', 'profit sharing plan', 'rdsp', 'resp', 'retirement', 'rlif', 'roth', 'roth 401k', 'rrif', 'rrsp', 'sarsep', 'savings', 'sep ira', 'simple ira', 'sipp', 'stock plan', 'student', 'thrift savings plan', 'tfsa', 'trust', 'ugma', 'utma', 'variable annuity');--> statement-breakpoint
CREATE TYPE "public"."plaid_account_type" AS ENUM('investment', 'credit', 'depository', 'loan', 'brokerage', 'other');--> statement-breakpoint
CREATE TYPE "public"."plaid_confidence_level" AS ENUM('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."plaid_transaction_code" AS ENUM('adjustment', 'atm', 'bank charge', 'bill payment', 'cash', 'cashback', 'cheque', 'direct debit', 'interest', 'purchase', 'standing order', 'transfer', 'null');--> statement-breakpoint
CREATE TYPE "public"."plaid_transaction_payment_channel" AS ENUM('online', 'in store', 'other');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" varchar(360) NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" varchar(360) NOT NULL,
	"bank_accounts_last_synced_at" timestamp with time zone,
	"transactions_last_synced_at" timestamp with time zone,
	"invoices_last_synced_at" timestamp with time zone,
	"journal_entries_last_synced_at" timestamp with time zone,
	"vendor_credits_last_synced_at" timestamp with time zone,
	"credit_notes_last_synced_at" timestamp with time zone,
	"payments_last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plaid_bank_accounts" (
	"remote_id" text PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"available_balance" double precision,
	"current_balance" double precision,
	"iso_currency_code" varchar(3),
	"unofficial_currency_code" varchar(3),
	"mask" varchar(4),
	"name" text NOT NULL,
	"official_name" text,
	"type" "plaid_account_type" NOT NULL,
	"subtype" "plaid_account_subtype",
	"remaining_remote_content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "plaid_bank_accounts_check" CHECK (((iso_currency_code IS NOT NULL) AND (unofficial_currency_code IS NULL)) OR ((iso_currency_code IS NULL) AND (unofficial_currency_code IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "plaid_credentials" (
	"company_id" integer PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"item_id" text NOT NULL,
	"transaction_cursor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plaid_transactions" (
	"remote_id" text PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"bank_account_id" text NOT NULL,
	"iso_currency_code" varchar(3),
	"unofficial_currency_code" varchar(3),
	"check_number" text,
	"date" date NOT NULL,
	"datetime" timestamp with time zone,
	"name" text NOT NULL,
	"merchant_name" text,
	"original_description" text,
	"pending" boolean NOT NULL,
	"website" text,
	"authorized_at" timestamp with time zone,
	"payment_channel" "plaid_transaction_payment_channel" NOT NULL,
	"amount" double precision NOT NULL,
	"personal_finance_category_primary" text,
	"personal_finance_category_detailed" text,
	"personal_finance_category_confidence_level" "plaid_confidence_level",
	"code" "plaid_transaction_code",
	"remaining_remote_content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "plaid_transactions_check" CHECK (((personal_finance_category_primary IS NULL) AND (personal_finance_category_detailed IS NULL)) OR ((personal_finance_category_primary IS NOT NULL) AND (personal_finance_category_detailed IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "quick_books_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"remote_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quick_books_accounts_remote_id_key" UNIQUE("remote_id")
);
--> statement-breakpoint
CREATE TABLE "quick_books_credit_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"remote_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quick_books_credit_notes_remote_id_key" UNIQUE("remote_id")
);
--> statement-breakpoint
CREATE TABLE "quick_books_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"remote_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quick_books_invoices_remote_id_key" UNIQUE("remote_id")
);
--> statement-breakpoint
CREATE TABLE "quick_books_journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"remote_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quick_books_journal_entries_remote_id_key" UNIQUE("remote_id")
);
--> statement-breakpoint
CREATE TABLE "quick_books_oauth_credentials" (
	"company_id" serial PRIMARY KEY NOT NULL,
	"realm_id" text NOT NULL,
	"access_token" text NOT NULL,
	"access_token_expiry" timestamp with time zone NOT NULL,
	"refresh_token" text NOT NULL,
	"refresh_token_expiry" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quick_books_oauth_states" (
	"company_id" serial PRIMARY KEY NOT NULL,
	"state" uuid NOT NULL,
	"redirect_url" text NOT NULL,
	"auth_url" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_books_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"remote_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quick_books_payments_remote_id_key" UNIQUE("remote_id")
);
--> statement-breakpoint
CREATE TABLE "quick_books_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"remote_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quick_books_transactions_remote_id_key" UNIQUE("remote_id")
);
--> statement-breakpoint
CREATE TABLE "quick_books_vendor_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"remote_id" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "quick_books_vendor_credits_remote_id_key" UNIQUE("remote_id")
);
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "plaid_bank_accounts" ADD CONSTRAINT "plaid_bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "plaid_credentials" ADD CONSTRAINT "plaid_credentials_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "plaid_transactions" ADD CONSTRAINT "plaid_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_accounts" ADD CONSTRAINT "quick_books_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_credit_notes" ADD CONSTRAINT "quick_books_credit_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_invoices" ADD CONSTRAINT "quick_books_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_journal_entries" ADD CONSTRAINT "quick_books_journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_oauth_credentials" ADD CONSTRAINT "quick_books_oauth_credentials_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_oauth_states" ADD CONSTRAINT "quick_books_oauth_states_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_payments" ADD CONSTRAINT "quick_books_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_transactions" ADD CONSTRAINT "quick_books_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quick_books_vendor_credits" ADD CONSTRAINT "quick_books_vendor_credits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plaid_transactions_bank_account_id_idx" ON "plaid_transactions" USING btree ("bank_account_id" text_ops);