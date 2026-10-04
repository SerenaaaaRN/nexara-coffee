import { count, eq } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { customers } from "../../db/schema/customers.js";
import { orders } from "../../db/schema/orders.js";
import { logAudit } from "../../lib/audit-log.js";
import { rateLimit } from "../../lib/rate-limit.js";
import { can, type Role } from "../../lib/rbac.js";
import { normalizePhone, tierForPoints } from "../../utils/loyalty.js";

export const getCustomers = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "customers"))
		return status(403, { success: false as const, error: "Forbidden" });
	const [rows, counts] = await Promise.all([
		db.select().from(customers).orderBy(customers.fullName),
		db
			.select({ customerId: orders.customerId, orderCount: count() })
			.from(orders)
			.groupBy(orders.customerId),
	]);
	const countById = new Map(counts.map((c) => [c.customerId, c.orderCount]));
	return {
		success: true as const,
		data: rows.map((r) => ({ ...r, orderCount: countById.get(r.id) ?? 0 })),
	};
};

export const createCustomer = async (
	user: { id: string; role: string },
	data: {
		fullName: string;
		email?: string | null;
		phone?: string | null;
		segment?: string;
	},
) => {
	if (!can(user.role as Role, "create", "customers"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`customers:create:${user.id}`, 20, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
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
	return { success: true as const, data: customer };
};

export const findOrCreateCustomer = async (
	user: { id: string; role: string },
	fullName: string,
	phone?: string,
) => {
	if (!can(user.role as Role, "create", "customers"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`customers:find-or-create:${user.id}`, 20, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });

	const digits = phone ? normalizePhone(phone) : "";
	if (digits !== "") {
		const [byPhone] = await db
			.select()
			.from(customers)
			.where(eq(customers.phone, digits))
			.limit(1);
		if (byPhone) return { success: true as const, data: byPhone };
	}
	const [existing] = await db
		.select()
		.from(customers)
		.where(eq(customers.fullName, fullName))
		.limit(1);
	if (existing) return { success: true as const, data: existing };
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
		return { success: true as const, data: customer };
	} catch {
		const [fallback] = await db
			.select()
			.from(customers)
			.where(eq(customers.fullName, fullName))
			.limit(1);
		if (!fallback)
			return status(500, {
				success: false as const,
				error: "Failed to create customer",
			});
		return { success: true as const, data: fallback };
	}
};

export const updateCustomer = async (
	user: { id: string; role: string },
	id: string,
	data: Record<string, unknown>,
) => {
	if (!can(user.role as Role, "update", "customers"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`customers:update:${user.id}`, 30, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
	const updates: Record<string, unknown> = { ...data };
	if (updates.email === "") updates.email = null;
	if (updates.phone === "") updates.phone = null;
	const [customer] = await db
		.update(customers)
		.set(updates as never)
		.where(eq(customers.id, id))
		.returning();
	if (!customer)
		return status(404, {
			success: false as const,
			error: "Customer not found",
		});
	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "customers",
		targetId: id,
		metadata: data,
	});
	return { success: true as const, data: customer };
};

export const deleteCustomer = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "delete", "customers"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`customers:delete:${user.id}`, 10, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
	await db.delete(customers).where(eq(customers.id, id));
	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "customers",
		targetId: id,
	});
	return { success: true as const, data: null };
};

export const updateLoyaltyPoints = async (
	user: { id: string; role: string },
	customerId: string,
	points: number,
) => {
	if (!can(user.role as Role, "update", "customers"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`customers:loyalty:${user.id}`, 30, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
	const [customer] = await db
		.update(customers)
		.set({ loyaltyPoints: points, loyaltyTier: tierForPoints(points) } as never)
		.where(eq(customers.id, customerId))
		.returning();
	if (!customer)
		return status(404, {
			success: false as const,
			error: "Customer not found",
		});
	return { success: true as const, data: customer };
};
