import { count, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { customers } from "../../db/schema/customers.js";
import { orders } from "../../db/schema/orders.js";
import { logAudit } from "../../lib/audit-log.js";
import type { CurrentUser } from "../../lib/auth-user.js";
import { fail, ok } from "../../lib/response.js";
import { checkRate } from "../../utils/effects.js";
import { normalizePhone, tierForPoints } from "../../utils/loyalty.js";

export const getCustomers = async () => {
	const [rows, counts] = await Promise.all([
		db.select().from(customers).orderBy(customers.fullName),
		db
			.select({ customerId: orders.customerId, orderCount: count() })
			.from(orders)
			.groupBy(orders.customerId),
	]);
	const countById = new Map(counts.map((c) => [c.customerId, c.orderCount]));
	return ok(rows.map((r) => ({ ...r, orderCount: countById.get(r.id) ?? 0 })));
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

export const findOrCreateCustomer = async (
	user: CurrentUser,
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
