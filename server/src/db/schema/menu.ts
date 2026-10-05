import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
} from "drizzle-orm/pg-core";

export const menuCategories = pgTable("menu_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    categoryId: text("category_id")
      .notNull()
      .references(() => menuCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    variants: jsonb("variants"),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
  },
  (table) => [index("menu_items_category_id_idx").on(table.categoryId)],
);

export const menuCategoriesRelations = relations(
  menuCategories,
  ({ many }) => ({
    menuItems: many(menuItems),
  }),
);

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));
