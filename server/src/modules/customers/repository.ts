import { and, asc, count, desc, eq, ilike, or, sum } from "drizzle-orm";
import { db } from "../../db/index.js";
import { customers } from "../../db/schema/customers.js";
import { orders } from "../../db/schema/orders.js";
import type { TableSortDir } from "../../lib/schema.js";
import { toSort } from "../../lib/sort.js";
import { containsPattern } from "../../lib/table.js";

const CUSTOMER_SORT_COLUMNS = {
	createdAt: customers.createdAt,
	fullName: customers.fullName,
	loyaltyPoints: customers.loyaltyPoints,
} as const;

export type CustomerListArgs = {
	segment?: string;
	tier?: string;
	q?: string;
	sortBy?: string;
	sortDir: TableSortDir;
	page: number;
	pageSize: number;
};

export type NewCustomer = typeof customers.$inferInsert;
export type CustomerPatch = Partial<typeof customers.$inferInsert>;

export const customerRepo = {
	list: async (args: CustomerListArgs) => {
		const segment = args.segment ? eq(customers.segment, args.segment) : undefined;
		const tier = args.tier ? eq(customers.loyaltyTier, args.tier) : undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(customers.fullName, containsPattern(term)),
					ilike(customers.email, containsPattern(term)),
					ilike(customers.phone, containsPattern(term)),
				)
			: undefined;

		const where = and(segment, tier, search);
		const orderBy = toSort(
			CUSTOMER_SORT_COLUMNS,
			args.sortBy,
			args.sortDir,
			args.sortDir === "asc" ? asc(customers.createdAt) : desc(customers.createdAt),
		);

		const [rows, [{ value: total }], [{ value: orderTotal }], [{ value: pointsTotal }]] =
			await Promise.all([
				db
					.select({
						id: customers.id,
						fullName: customers.fullName,
						email: customers.email,
						phone: customers.phone,
						segment: customers.segment,
						loyaltyPoints: customers.loyaltyPoints,
						loyaltyTier: customers.loyaltyTier,
						userId: customers.userId,
						createdAt: customers.createdAt,
						orderCount: count(orders.id),
					})
					.from(customers)
					.leftJoin(orders, eq(orders.customerId, customers.id))
					.where(where)
					.groupBy(customers.id)
					.orderBy(orderBy)
					.limit(args.pageSize)
					.offset(args.page * args.pageSize),
				db.select({ value: count() }).from(customers).where(where),
				db
					.select({ value: count(orders.id) })
					.from(customers)
					.leftJoin(orders, eq(orders.customerId, customers.id))
					.where(where),
				db
					.select({ value: sum(customers.loyaltyPoints) })
					.from(customers)
					.where(where),
			]);

		return { rows, total, orderTotal, pointsTotal };
	},

	findDetail: async (id: string) => {
		const [row] = await db
			.select({
				id: customers.id,
				fullName: customers.fullName,
				email: customers.email,
				phone: customers.phone,
				segment: customers.segment,
				loyaltyPoints: customers.loyaltyPoints,
				loyaltyTier: customers.loyaltyTier,
				userId: customers.userId,
				createdAt: customers.createdAt,
				orderCount: count(orders.id),
			})
			.from(customers)
			.leftJoin(orders, eq(orders.customerId, customers.id))
			.where(eq(customers.id, id))
			.groupBy(customers.id)
			.limit(1);
		return row ?? null;
	},

	findByPhone: async (phone: string) => {
		const [row] = await db
			.select()
			.from(customers)
			.where(eq(customers.phone, phone))
			.limit(1);
		return row ?? null;
	},

	findByName: async (fullName: string) => {
		const [row] = await db
			.select()
			.from(customers)
			.where(eq(customers.fullName, fullName))
			.limit(1);
		return row ?? null;
	},

	findLoyaltyCard: async (phone: string) => {
		const [row] = await db
			.select({
				id: customers.id,
				fullName: customers.fullName,
				loyaltyTier: customers.loyaltyTier,
				loyaltyPoints: customers.loyaltyPoints,
			})
			.from(customers)
			.where(eq(customers.phone, phone))
			.limit(1);
		return row ?? null;
	},

	create: async (payload: NewCustomer) => {
		const [row] = await db.insert(customers).values(payload).returning();
		return row ?? null;
	},

	update: async (id: string, patch: CustomerPatch) => {
		const [row] = await db
			.update(customers)
			.set(patch)
			.where(eq(customers.id, id))
			.returning();
		return row ?? null;
	},

	remove: async (id: string) => {
		await db.delete(customers).where(eq(customers.id, id));
	},

	setLoyalty: async (id: string, points: number, tier: string) => {
		const [row] = await db
			.update(customers)
			.set({ loyaltyPoints: points, loyaltyTier: tier })
			.where(eq(customers.id, id))
			.returning();
		return row ?? null;
	},
};
