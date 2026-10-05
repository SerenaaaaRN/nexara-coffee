-- domain: finance (transactions & payouts) — urutan apply: 04 (setelah orders, branches)
-- tabel: transactions, payouts

CREATE TABLE "transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "branch_id" text NOT NULL,
  "payment_method" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "status" text DEFAULT 'completed' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "payouts" (
  "id" text PRIMARY KEY NOT NULL,
  "franchise_owner_id" text NOT NULL,
  "branch_id" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "approved_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_franchise_owner_id_user_id_fk"
  FOREIGN KEY ("franchise_owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_approved_by_user_id_fk"
  FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "transactions_order_id_idx" ON "transactions" USING btree ("order_id");
CREATE INDEX "transactions_branch_id_idx" ON "transactions" USING btree ("branch_id");
CREATE INDEX "payouts_franchise_owner_id_idx" ON "payouts" USING btree ("franchise_owner_id");
CREATE INDEX "payouts_branch_id_idx" ON "payouts" USING btree ("branch_id");
CREATE INDEX "payouts_approved_by_idx" ON "payouts" USING btree ("approved_by");
