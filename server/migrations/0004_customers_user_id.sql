-- Delta port dari nexara-coffee database/migrations/0002_customer_user_link.sql
-- Apply via: psql "$DIRECT_URL" -f drizzle/0001_customers_user_id.sql
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "user_id" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customers_user_id_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
-- Backfill: link profil CRM ke akun login via email (lower match), seperti 0002 di coffee
UPDATE "customers" c SET "user_id" = u."id"
FROM "public"."user" u
WHERE c."user_id" IS NULL AND u."email" IS NOT NULL AND c."email" IS NOT NULL
  AND lower(u."email") = lower(c."email");--> statement-breakpoint
