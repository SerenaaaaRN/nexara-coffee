import { relations } from "drizzle-orm";
import {
	date,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { branches } from "./branches";
import { customers } from "./customers";
import { transactions } from "./finance";
import { menuItems } from "./menu";

export const dailySetorans = pgTable(
	"daily_setorans",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		branchId: text("branch_id")
			.notNull()
			.references(() => branches.id, { onDelete: "cascade" }),
		cashierId: text("cashier_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		date: date("date").notNull().defaultNow(),
		status: text("status").notNull().default("pending"),
		verifiedBy: text("verified_by").references(() => user.id, {
			onDelete: "set null",
		}),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("daily_setorans_branch_id_idx").on(table.branchId),
		index("daily_setorans_cashier_id_idx").on(table.cashierId),
		index("daily_setorans_date_idx").on(table.date),
		uniqueIndex("daily_setorans_branch_date_idx").on(
			table.branchId,
			table.date,
		),
	],
);

export const orders = pgTable(
	"orders",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		branchId: text("branch_id")
			.notNull()
			.references(() => branches.id, { onDelete: "cascade" }),
		customerId: text("customer_id").references(() => customers.id, {
			onDelete: "set null",
		}),
		orderNumber: text("order_number").notNull(),
		status: text("status").notNull().default("pending"),
		totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("orders_branch_id_idx").on(table.branchId),
		index("orders_customer_id_idx").on(table.customerId),
	],
);

export const orderItems = pgTable(
	"order_items",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		orderId: text("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		menuItemId: text("menu_item_id").references(() => menuItems.id, {
			onDelete: "set null",
		}),
		nameSnapshot: text("name_snapshot").notNull(),
		priceSnapshot: numeric("price_snapshot", {
			precision: 10,
			scale: 2,
		}).notNull(),
		variantSnapshot: text("variant_snapshot"),
		qty: integer("qty").notNull(),
		subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
	},
	(table) => [index("order_items_order_id_idx").on(table.orderId)],
);

export const dailySetoransRelations = relations(dailySetorans, ({ one }) => ({
	branch: one(branches, {
		fields: [dailySetorans.branchId],
		references: [branches.id],
	}),
	cashier: one(user, {
		fields: [dailySetorans.cashierId],
		references: [user.id],
	}),
	verifiedBy: one(user, {
		fields: [dailySetorans.verifiedBy],
		references: [user.id],
	}),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
	branch: one(branches, {
		fields: [orders.branchId],
		references: [branches.id],
	}),
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id],
	}),
	createdByUser: one(user, {
		fields: [orders.createdBy],
		references: [user.id],
	}),
	orderItems: many(orderItems),
	transaction: one(transactions, {
		fields: [orders.id],
		references: [transactions.orderId],
	}),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	menuItem: one(menuItems, {
		fields: [orderItems.menuItemId],
		references: [menuItems.id],
	}),
}));
