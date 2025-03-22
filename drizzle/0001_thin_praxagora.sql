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
CREATE TABLE "quick_books_sync_state" (
	"company_id" serial PRIMARY KEY NOT NULL,
	"transactions_synced_at" timestamp with time zone,
	"invoices_synced_at" timestamp with time zone,
	"accounts_synced_at" timestamp with time zone,
	"credit_notes_synced_at" timestamp with time zone,
	"journal_entries_synced_at" timestamp with time zone,
	"payments_synced_at" timestamp with time zone,
	"vendor_credits_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
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
ALTER TABLE "quick_books_accounts" ADD CONSTRAINT "quick_books_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_books_credit_notes" ADD CONSTRAINT "quick_books_credit_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_books_journal_entries" ADD CONSTRAINT "quick_books_journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_books_payments" ADD CONSTRAINT "quick_books_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_books_sync_state" ADD CONSTRAINT "quick_books_sync_state_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_books_transactions" ADD CONSTRAINT "quick_books_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_books_vendor_credits" ADD CONSTRAINT "quick_books_vendor_credits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;