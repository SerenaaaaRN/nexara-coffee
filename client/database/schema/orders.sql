-- domain: orders & kasir (setoran) — urutan apply: 04 (setelah branches, customers, menu)
-- tabel: orders, order_items, daily_setorans
-- catatan: kolom shift pernah ada lalu di-drop (0003) — final: tidak ada.
-- satu setoran per cabang per hari: UNIQUE(branch_id, date).

CREATE TABLE "orders" (
  "id" text PRIMARY KEY NOT NULL,
  "branch_id" text NOT NULL,
  "customer_id" text,
  "order_number" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "total_amount" numeric(12, 2) NOT NULL,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "order_items" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "menu_item_id" text,
  "name_snapshot" text NOT NULL,
  "price_snapshot" numeric(10, 2) NOT NULL,
  "variant_snapshot" text,
  "qty" integer NOT NULL,
  "subtotal" numeric(12, 2) NOT NULL
);

CREATE TABLE "daily_setorans" (
  "id" text PRIMARY KEY NOT NULL,
  "branch_id" text NOT NULL,
  "cashier_id" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "date" date DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "verified_by" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_user_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk"
  FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "daily_setorans" ADD CONSTRAINT "daily_setorans_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "daily_setorans" ADD CONSTRAINT "daily_setorans_cashier_id_user_id_fk"
  FOREIGN KEY ("cashier_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "daily_setorans" ADD CONSTRAINT "daily_setorans_verified_by_user_id_fk"
  FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX "daily_setorans_branch_date_idx" ON "daily_setorans" USING btree ("branch_id", "date");
CREATE INDEX "orders_branch_id_idx" ON "orders" USING btree ("branch_id");
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");
CREATE INDEX "daily_setorans_branch_id_idx" ON "daily_setorans" USING btree ("branch_id");
CREATE INDEX "daily_setorans_cashier_id_idx" ON "daily_setorans" USING btree ("cashier_id");
CREATE INDEX "daily_setorans_date_idx" ON "daily_setorans" USING btree ("date");
