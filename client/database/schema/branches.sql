-- domain: branches & mitra — urutan apply: 02 (setelah auth)
-- tabel: branches, franchise_branches

CREATE TABLE "branches" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "lat" numeric(10, 7),
  "lng" numeric(10, 7),
  "phone" text,
  "opening_time" time,
  "closing_time" time,
  "status" text DEFAULT 'active' NOT NULL,
  "ownership_type" text DEFAULT 'corporate' NOT NULL,
  "manager_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "branches_manager_id_unique" UNIQUE("manager_id")
);

CREATE TABLE "franchise_branches" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "branch_id" text NOT NULL,
  "commission_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "branches" ADD CONSTRAINT "branches_manager_id_user_id_fk"
  FOREIGN KEY ("manager_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "franchise_branches" ADD CONSTRAINT "franchise_branches_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "franchise_branches" ADD CONSTRAINT "franchise_branches_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "branches_status_idx" ON "branches" USING btree ("status");
CREATE INDEX "branches_created_at_idx" ON "branches" USING btree ("created_at");
CREATE INDEX "franchise_branches_user_id_idx" ON "franchise_branches" USING btree ("user_id");
CREATE INDEX "franchise_branches_branch_id_idx" ON "franchise_branches" USING btree ("branch_id");
