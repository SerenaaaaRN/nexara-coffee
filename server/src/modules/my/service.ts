import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { resolveMyScope } from "../../access/index.js";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";
import { orders } from "../../db/schema/orders.js";
import { fail, ok } from "../../lib/http.js";
import { checkRate, logAudit } from "../../utils/effects.js";
import { normalizePhone } from "../../utils/loyalty.js";

/** Own-scope portal /my — tanpa can() global, filter by session.user.id (visitor allowed). */

export const getMyOrders = async (
	user: CurrentUser,
	params: { page?: number; pageSize?: number },
) => {
	const uid = user.id;
	const page = params.page ?? 0;
	const pageSize = params.pageSize ?? 20;
	const { scope } = await resolveMyScope(uid);

	const completedScope = and(scope, eq(orders.status, "completed"));

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
			.where(scope)
			.orderBy(desc(orders.createdAt))
			.limit(pageSize)
			.offset(page * pageSize),
		db.select({ cnt: count() }).from(orders).where(scope),
		db.select({ cnt: count() }).from(orders).where(completedScope),
	]);

	const reviewed = new Set<string>();
	if (rows.length > 0) {
		const reviewRows = await db
			.select({ orderId: reviews.orderId })
			.from(reviews)
			.where(
				inArray(
					reviews.orderId,
					rows.map((r) => r.id),
				),
			);
		for (const rr of reviewRows) if (rr.orderId) reviewed.add(rr.orderId);
	}

	return ok({
		rows: rows.map((r) => ({ ...r, hasReview: reviewed.has(r.id) })),
		nextPage: rows.length === pageSize ? page + 1 : null,
		total: totalRows[0]?.cnt ?? 0,
		completedTotal: completedRows[0]?.cnt ?? 0,
	});
};

export const getMyLoyalty = async (user: CurrentUser) => {
	const uid = user.id;
	const [existing] = await db
		.select()
		.from(customers)
		.where(eq(customers.userId, uid))
		.limit(1);

	let customer = existing;
	if (!customer) {
		const [created] = await db
			.insert(customers)
			.values({
				fullName: user.name ?? "Customer",
				email: user.email ?? null,
				segment: "regular",
				loyaltyPoints: 0,
				loyaltyTier: "bronze",
				userId: uid,
			} as never)
			.returning();
		if (!created) return fail(500, "Gagal membuat profil member");
		customer = created;
	}

	const { scope } = await resolveMyScope(uid);
	const [countRow] = await db
		.select({ cnt: count() })
		.from(orders)
		.where(scope);

	return ok({
		id: customer.id,
		fullName: customer.fullName,
		phone: customer.phone,
		segment: customer.segment,
		loyaltyPoints: customer.loyaltyPoints,
		loyaltyTier: customer.loyaltyTier,
		orderCount: countRow?.cnt ?? 0,
	});
};

export const updateMyPhone = async (
	user: CurrentUser,
	input: { phone: string },
) => {
	const uid = user.id;
	const limited = checkRate(`my:phone:${uid}`, 5, 60_000);
	if (limited) return limited;

	const digits = normalizePhone(input.phone);
	if (digits.length < 9 || digits.length > 15) {
		return fail(400, "Nomor HP harus terdiri dari 9-15 digit");
	}

	const [taken] = await db
		.select({ id: customers.id })
		.from(customers)
		.where(and(eq(customers.phone, digits), ne(customers.userId, uid)))
		.limit(1);
	if (taken) return fail(400, "Nomor HP sudah digunakan");

	const [existing] = await db
		.select({ id: customers.id })
		.from(customers)
		.where(eq(customers.userId, uid))
		.limit(1);

	if (!existing) {
		const [created] = await db
			.insert(customers)
			.values({
				fullName: user.name ?? "Customer",
				email: user.email ?? null,
				phone: digits,
				segment: "regular",
				loyaltyPoints: 0,
				loyaltyTier: "bronze",
				userId: uid,
			} as never)
			.returning({ id: customers.id });
		if (!created) return fail(500, "Gagal menyimpan nomor HP");
		void logAudit({
			actorId: uid,
			action: "update",
			targetTable: "customers",
			targetId: created.id,
			metadata: { field: "phone" },
		});
		return ok({ phone: digits });
	}

	await db
		.update(customers)
		.set({ phone: digits })
		.where(eq(customers.id, existing.id));
	void logAudit({
		actorId: uid,
		action: "update",
		targetTable: "customers",
		targetId: existing.id,
		metadata: { field: "phone" },
	});
	return ok({ phone: digits });
};

export const createMyReview = async (
	user: CurrentUser,
	input: { orderId: string; rating: number; comment?: string },
) => {
	const uid = user.id;
	const rating = Math.floor(Number(input.rating));
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		return fail(400, "Rating harus 1-5");
	}

	const { ownedIds, scope } = await resolveMyScope(uid);

	const [order] = await db
		.select({
			id: orders.id,
			branchId: orders.branchId,
			customerId: orders.customerId,
			status: orders.status,
		})
		.from(orders)
		.where(and(eq(orders.id, input.orderId), scope))
		.limit(1);

	if (!order) return fail(404, "Order tidak ditemukan");
	if (order.status !== "completed") {
		return fail(400, "Hanya order yang sudah selesai yang bisa diulas");
	}

	const [dup] = await db
		.select({ id: reviews.id })
		.from(reviews)
		.where(eq(reviews.orderId, order.id))
		.limit(1);
	if (dup) return fail(400, "Order ini sudah pernah diulas");

	const [inserted] = await db
		.insert(reviews)
		.values({
			branchId: order.branchId,
			customerId: order.customerId ?? ownedIds[0] ?? null,
			orderId: order.id,
			rating,
			comment: input.comment?.trim() ? input.comment.trim() : null,
			status: "pending",
		} as never)
		.returning({ id: reviews.id });

	if (!inserted) return fail(500, "Gagal menyimpan ulasan");
	return ok({ id: inserted.id });
};
