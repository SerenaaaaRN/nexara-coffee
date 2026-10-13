import { and, count, desc, eq, inArray, ne, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";
import { orders } from "../../db/schema/orders.js";

export type MyOrdersArgs = {
	scope: SQL | undefined;
	completedScope: SQL | undefined;
	page: number;
	pageSize: number;
};

export type NewCustomerProfile = typeof customers.$inferInsert;
export type NewSelfReview = typeof reviews.$inferInsert;

export const myRepo = {
	ordersPage: async (args: MyOrdersArgs) => {
		const [rows, totalRows, completedRows] = await Promise.all([
			db
				.select({
					id: orders.id,
					branchId: orders.branchId,
					branchName: branches.name,
					orderNumber: orders.orderNumber,
					status: orders.status,
					totalAmount: orders.totalAmount,
					createdAt: orders.createdAt,
				})
				.from(orders)
				.leftJoin(branches, eq(orders.branchId, branches.id))
				.where(args.scope)
				.orderBy(desc(orders.createdAt))
				.limit(args.pageSize)
				.offset(args.page * args.pageSize),
			db.select({ cnt: count() }).from(orders).where(args.scope),
			db.select({ cnt: count() }).from(orders).where(args.completedScope),
		]);
		return { rows, totalRows, completedRows };
	},

	reviewedOrderIds: async (orderIds: string[]) => {
		if (orderIds.length === 0) return new Set<string>();
		const reviewRows = await db
			.select({ orderId: reviews.orderId })
			.from(reviews)
			.where(inArray(reviews.orderId, orderIds));
		const reviewed = new Set<string>();
		for (const rr of reviewRows) if (rr.orderId) reviewed.add(rr.orderId);
		return reviewed;
	},

	countOrders: async (scope: SQL | undefined) => {
		const [row] = await db.select({ cnt: count() }).from(orders).where(scope);
		return row?.cnt ?? 0;
	},

	findProfile: async (uid: string) => {
		const [row] = await db
			.select()
			.from(customers)
			.where(eq(customers.userId, uid))
			.limit(1);
		return row ?? null;
	},

	createProfile: async (payload: NewCustomerProfile) => {
		const [row] = await db.insert(customers).values(payload).returning();
		return row ?? null;
	},

	findPhoneOwner: async (phone: string, exceptUid: string) => {
		const [row] = await db
			.select({ id: customers.id })
			.from(customers)
			.where(and(eq(customers.phone, phone), ne(customers.userId, exceptUid)))
			.limit(1);
		return row ?? null;
	},

	setPhone: async (id: string, phone: string) => {
		await db.update(customers).set({ phone }).where(eq(customers.id, id));
	},

	findOrderInScope: async (orderId: string, scope: SQL | undefined) => {
		const [row] = await db
			.select({
				id: orders.id,
				branchId: orders.branchId,
				customerId: orders.customerId,
				status: orders.status,
			})
			.from(orders)
			.where(and(eq(orders.id, orderId), scope))
			.limit(1);
		return row ?? null;
	},

	findReviewByOrder: async (orderId: string) => {
		const [row] = await db
			.select({ id: reviews.id })
			.from(reviews)
			.where(eq(reviews.orderId, orderId))
			.limit(1);
		return row ?? null;
	},

	createReview: async (payload: NewSelfReview) => {
		const [row] = await db.insert(reviews).values(payload).returning({ id: reviews.id });
		return row ?? null;
	},
};
