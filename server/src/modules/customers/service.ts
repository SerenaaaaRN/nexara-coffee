import { and, asc, count, desc, eq, ilike, or, sum } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { db } from "../../db/index.js";
import { customers } from "../../db/schema/customers.js";
import { orders } from "../../db/schema/orders.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { containsPattern } from "../../lib/table.js";
import { checkRate, logAudit } from "../../utils/effects.js";
import { normalizePhone, tierForPoints } from "../../utils/loyalty.js";
import type { getCustomersQuery } from "./model.js";

/**
 * Kolom yang boleh di-sort dari client (`sortBy` di luar ini diabaikan).
 */
const CUSTOMER_SORT_COLUMNS = {
	createdAt: customers.createdAt,
	fullName: customers.fullName,
	loyaltyPoints: customers.loyaltyPoints,
} as const;

export const getCustomers = async (params: typeof getCustomersQuery.static) => {
	const { page, pageSize, sortDir } = resolveTableParams(params);
	const conditions = [];

	if (params.segment) {
		conditions.push(eq(customers.segment, params.segment));
	}
	if (params.tier) {
		conditions.push(eq(customers.loyaltyTier, params.tier));
	}

	const q = params.q?.trim();
	if (q) {
		const pattern = containsPattern(q);
		conditions.push(
			or(
				ilike(customers.fullName, pattern),
				ilike(customers.email, pattern),
				ilike(customers.phone, pattern),
			),
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const sortCol =
		params.sortBy && params.sortBy in CUSTOMER_SORT_COLUMNS
			? CUSTOMER_SORT_COLUMNS[
					params.sortBy as keyof typeof CUSTOMER_SORT_COLUMNS
				]
			: customers.createdAt;
	const orderBy = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

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
				.limit(pageSize)
				.offset(page * pageSize),
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

	return ok({
		...pageResult(
			rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			total,
			page,
			pageSize,
		),
		summary: {
			total,
			totalOrders: orderTotal,
			totalPoints: Number(pointsTotal ?? 0),
		},
	});
};

export const getCustomerDetail = async (id: string) => {
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
	if (!row) return fail(404, "Customer not found");
	return ok({ ...row, createdAt: row.createdAt.toISOString() });
};

export const createCustomer = async (
	user: CurrentUser,
	data: {
		fullName: string;
		email?: string | null;
		phone?: string | null;
		segment?: string;
	},
) => {
	const limited = checkRate(`customers:create:${user.id}`, 20, 60_000);
	if (limited) return limited;
	const [customer] = await db
		.insert(customers)
		.values({
			fullName: data.fullName,
			email: data.email || null,
			phone: data.phone || null,
			segment: data.segment ?? "regular",
		} as never)
		.returning();
	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "customers",
		targetId: customer.id,
		metadata: { fullName: customer.fullName },
	});
	return ok(customer);
};

/**
 * Mencari customer berdasarkan nomor HP (read-only, tanpa create).
 * Untuk verifikasi "atas nama siapa" sebelum charge di POS.
 */
export const lookupCustomerByPhone = async (
	user: CurrentUser,
	phone: string,
) => {
	const limited = checkRate(`customers:lookup:${user.id}`, 30, 60_000);
	if (limited) return limited;

	const digits = normalizePhone(phone);
	if (digits === "") return ok(null);

	const [customer] = await db
		.select({
			id: customers.id,
			fullName: customers.fullName,
			loyaltyTier: customers.loyaltyTier,
			loyaltyPoints: customers.loyaltyPoints,
		})
		.from(customers)
		.where(eq(customers.phone, digits))
		.limit(1);
	return ok(customer ?? null);
};

export const findOrCreateCustomer = async (	user: CurrentUser,
	fullName: string,
	phone?: string,
) => {
	const limited = checkRate(`customers:find-or-create:${user.id}`, 20, 60_000);
	if (limited) return limited;

	const digits = phone ? normalizePhone(phone) : "";
	if (digits !== "") {
		const [byPhone] = await db
			.select()
			.from(customers)
			.where(eq(customers.phone, digits))
			.limit(1);
		if (byPhone) return ok(byPhone);
	}
	const [existing] = await db
		.select()
		.from(customers)
		.where(eq(customers.fullName, fullName))
		.limit(1);
	if (existing) return ok(existing);
	try {
		const [customer] = await db
			.insert(customers)
			.values({ fullName, phone: digits !== "" ? digits : null } as never)
			.returning();
		void logAudit({
			actorId: user.id,
			action: "create",
			targetTable: "customers",
			targetId: customer.id,
			metadata: { fullName },
		});
		return ok(customer);
	} catch {
		const [fallback] = await db
			.select()
			.from(customers)
			.where(eq(customers.fullName, fullName))
			.limit(1);
		if (!fallback) return fail(500, "Failed to create customer");
		return ok(fallback);
	}
};

export const updateCustomer = async (
	user: CurrentUser,
	id: string,
	data: Record<string, unknown>,
) => {
	const limited = checkRate(`customers:update:${user.id}`, 30, 60_000);
	if (limited) return limited;
	const updates: Record<string, unknown> = { ...data };
	if (updates.email === "") updates.email = null;
	if (updates.phone === "") updates.phone = null;
	const [customer] = await db
		.update(customers)
		.set(updates as never)
		.where(eq(customers.id, id))
		.returning();
	if (!customer) return fail(404, "Customer not found");
	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "customers",
		targetId: id,
		metadata: data,
	});
	return ok(customer);
};

export const deleteCustomer = async (user: CurrentUser, id: string) => {
	const limited = checkRate(`customers:delete:${user.id}`, 10, 60_000);
	if (limited) return limited;
	await db.delete(customers).where(eq(customers.id, id));
	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "customers",
		targetId: id,
	});
	return ok(null);
};

export const updateLoyaltyPoints = async (
	user: CurrentUser,
	customerId: string,
	points: number,
) => {
	const limited = checkRate(`customers:loyalty:${user.id}`, 30, 60_000);
	if (limited) return limited;
	const [customer] = await db
		.update(customers)
		.set({ loyaltyPoints: points, loyaltyTier: tierForPoints(points) } as never)
		.where(eq(customers.id, customerId))
		.returning();
	if (!customer) return fail(404, "Customer not found");
	return ok(customer);
};
