-- domain: menu — urutan apply: 03 (tanpa dependensi ke domain lain)
-- tabel: menu_categories, menu_items

CREATE TABLE "menu_categories" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "menu_items" (
  "id" text PRIMARY KEY NOT NULL,
  "category_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "price" numeric(10, 2) NOT NULL,
  "variants" jsonb,
  "image_url" text,
  "is_available" boolean DEFAULT true NOT NULL
);

ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "menu_items_category_id_idx" ON "menu_items" USING btree ("category_id");
