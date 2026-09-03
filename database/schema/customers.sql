-- domain: customers & reviews — urutan apply: 03 (setelah branches; FK reviews_order_id butuh tabel orders)
-- tabel: customers, reviews

CREATE TABLE "customers" (
  "id" text PRIMARY KEY NOT NULL,
  "full_name" text NOT NULL,
  "email" text,
  "phone" text,
  "segment" text DEFAULT 'regular' NOT NULL,
  "loyalty_points" integer DEFAULT 0 NOT NULL,
  "loyalty_tier" text DEFAULT 'bronze' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "reviews" (
  "id" text PRIMARY KEY NOT NULL,
  "branch_id" text NOT NULL,
  "customer_id" text,
  "order_id" text,
  "rating" integer NOT NULL,
  "comment" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "reply" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "reviews_branch_id_idx" ON "reviews" USING btree ("branch_id");
CREATE INDEX "reviews_customer_id_idx" ON "reviews" USING btree ("customer_id");
