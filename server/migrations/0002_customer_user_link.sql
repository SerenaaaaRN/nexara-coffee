-- migrasi 0002
-- 1 user = max 1 profil customer (UNIQUE, NULL boleh banyak)

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "user_id" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "customers_user_id_idx" ON "customers" USING btree ("user_id");

-- backfill sekali: cocokkan email persis (case-insensitive), hanya yang belum terisi
UPDATE "customers" c SET "user_id" = u."id"
FROM "public"."user" u
WHERE c."user_id" IS NULL AND c."email" IS NOT NULL
  AND lower(c."email") = lower(u."email");
