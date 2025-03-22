DROP TABLE "quick_books_sync_state" CASCADE;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "bank_accounts_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "transactions_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "invoices_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "journal_entries_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "vendor_credits_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "credit_notes_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "payments_last_synced_at" timestamp with time zone;