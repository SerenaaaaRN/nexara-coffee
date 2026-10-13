import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { customers } from "../../db/schema/customers.js";
import { menuItems } from "../../db/schema/menu.js";
import { orderItems, orders } from "../../db/schema/orders.js";
import type { TableSortDir } from "../../lib/schema.js";
import { toSort } from "../../lib/sort.js";
import { containsPattern } from "../../lib/table.js";

/**
 * Columns addressable through `sortBy`. Values outside this map resolve
 * to the default ordering.
 */
const ORDER_SORT_COLUMNS = {
	createdAt: orders.createdAt,
	orderNumber: orders.orderNumber,
	totalAmount: orders.totalAmount,
	status: orders.status,
} as const;

export type OrderListArgs = {
	ids: string[] | null;
	branchId?: string;
	status?: string;
	dateFrom?: string;
	dateTo?: string;
	q?: string;
	sortBy?: string;
	sortDir: TableSortDir;
	page: number;
	pageSize: number;
};

export type NewOrder = typeof orders.$inferInsert;
export type NewOrderItem = typeof orderItems.$inferInsert;

const createdByUser = alias(userTable, "created_by_user");

const listColumns = {
	id: orders.id,
	branchId: orders.branchId,
	customerId: orders.customerId,
	orderNumber: orders.orderNumber,
	status: orders.status,
	totalAmount: orders.totalAmount,
	createdBy: orders.createdBy,
	createdAt: orders.createdAt,
	branchName: branches.name,
	customerName: customers.fullName,
	createdByName: createdByUser.name,
};

export const orderRepo = {
	list: async (args: OrderListArgs) => {
		const branch = args.branchId
			? eq(orders.branchId, args.branchId)
			: args.ids !== null && args.ids.length > 0
				? inArray(orders.branchId, args.ids)
				: undefined;
		const status = args.status ? eq(orders.status, args.status) : undefined;
		const from = args.dateFrom
			? gte(orders.createdAt, new Date(args.dateFrom))
			: undefined;
		const to = args.dateTo
			? lte(orders.createdAt, new Date(args.dateTo))
			: undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(orders.orderNumber, containsPattern(term)),
					ilike(customers.fullName, containsPattern(term)),
					ilike(branches.name, containsPattern(term)),
				)
			: undefined;

		const where = and(branch, status, from, to, search);
		const orderBy = toSort(
			ORDER_SORT_COLUMNS,
			args.sortBy,
			args.sortDir,
			args.sortDir === "asc" ? asc(orders.createdAt) : desc(orders.createdAt),
		);

		const [rows, [{ value: total }], statusCounts] = await Promise.all([
			db
				.select(listColumns)
				.from(orders)
				.leftJoin(branches, eq(orders.branchId, branches.id))
				.leftJoin(customers, eq(orders.customerId, customers.id))
				.leftJoin(createdByUser, eq(orders.createdBy, createdByUser.id))
				.where(where)
				.orderBy(orderBy)
				.limit(args.pageSize)
				.offset(args.page * args.pageSize),
			db
				.select({ value: count() })
				.from(orders)
				.leftJoin(branches, eq(orders.branchId, branches.id))
				.leftJoin(customers, eq(orders.customerId, customers.id))
				.where(where),
			db
				.select({ status: orders.status, value: count() })
				.from(orders)
				.leftJoin(branches, eq(orders.branchId, branches.id))
				.leftJoin(customers, eq(orders.customerId, customers.id))
				.where(where)
				.groupBy(orders.status),
		]);

		return { rows, total, statusCounts };
	},

	findDetail: async (orderId: string) => {
		const [order] = await db
			.select({
				id: orders.id,
				branchId: orders.branchId,
				customerId: orders.customerId,
				orderNumber: orders.orderNumber,
				status: orders.status,
				totalAmount: orders.totalAmount,
				createdBy: orders.createdBy,
				createdAt: orders.createdAt,
				branchName: branches.name,
				customerName: customers.fullName,
				createdByName: createdByUser.name,
			})
			.from(orders)
			.leftJoin(branches, eq(orders.branchId, branches.id))
			.leftJoin(customers, eq(orders.customerId, customers.id))
			.leftJoin(createdByUser, eq(orders.createdBy, createdByUser.id))
			.where(eq(orders.id, orderId))
			.limit(1);
		return order ?? null;
	},

	findItems: async (orderId: string) => {
		return db
			.select({
				id: orderItems.id,
				orderId: orderItems.orderId,
				menuItemId: orderItems.menuItemId,
				nameSnapshot: orderItems.nameSnapshot,
				priceSnapshot: orderItems.priceSnapshot,
				variantSnapshot: orderItems.variantSnapshot,
				qty: orderItems.qty,
				subtotal: orderItems.subtotal,
				menuItemName: menuItems.name,
			})
			.from(orderItems)
			.leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
			.where(eq(orderItems.orderId, orderId));
	},

	findStatus: async (orderId: string) => {
		const [row] = await db
			.select({
				branchId: orders.branchId,
				status: orders.status,
				customerId: orders.customerId,
				totalAmount: orders.totalAmount,
			})
			.from(orders)
			.where(eq(orders.id, orderId))
			.limit(1);
		return row ?? null;
	},

	createFull: async (order: NewOrder, items: NewOrderItem[]) => {
		await db.insert(orders).values(order);
		await db.insert(orderItems).values(items);
	},

	setStatus: async (orderId: string, status: string) => {
		const [row] = await db
			.update(orders)
			.set({ status })
			.where(eq(orders.id, orderId))
			.returning();
		return row ?? null;
	},

	findLoyaltyProfile: async (customerId: string) => {
		const [row] = await db
			.select({ loyaltyPoints: customers.loyaltyPoints })
			.from(customers)
			.where(eq(customers.id, customerId))
			.limit(1);
		return row ?? null;
	},

	accrueLoyalty: async (customerId: string, points: number, tier: string) => {
		await db
			.update(customers)
			.set({ loyaltyPoints: points, loyaltyTier: tier })
			.where(eq(customers.id, customerId));
	},
};
