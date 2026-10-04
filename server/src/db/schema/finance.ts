import { relations } from "drizzle-orm";
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { branches } from "./branches";
import { orders } from "./orders";

export const transactions = pgTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    branchId: text("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    paymentMethod: text("payment_method").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("completed"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("transactions_order_id_idx").on(table.orderId),
    index("transactions_branch_id_idx").on(table.branchId),
  ],
);

export const payouts = pgTable(
  "payouts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    franchiseOwnerId: text("franchise_owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    branchId: text("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    status: text("status").notNull().default("pending"),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("payouts_franchise_owner_id_idx").on(table.franchiseOwnerId),
    index("payouts_branch_id_idx").on(table.branchId),
    index("payouts_approved_by_idx").on(table.approvedBy),
  ],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
  branch: one(branches, {
    fields: [transactions.branchId],
    references: [branches.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  franchiseOwner: one(user, {
    fields: [payouts.franchiseOwnerId],
    references: [user.id],
  }),
  branch: one(branches, {
    fields: [payouts.branchId],
    references: [branches.id],
  }),
  approvedByUser: one(user, {
    fields: [payouts.approvedBy],
    references: [user.id],
  }),
}));
