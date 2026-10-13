import { and, eq } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { resolveMyScope } from "../../access/index.js";
import { orders } from "../../db/schema/orders.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { checkRate, logAudit } from "../../utils/effects.js";
import { normalizePhone } from "../../utils/loyalty.js";
import { myRepo } from "./repository.js";

export const getMyOrders = async (
	user: CurrentUser,
	params: { page?: number; pageSize?: number },
) => {
	const uid = user.id;
	const { page, pageSize } = resolveTableParams(params);
	const { scope } = await resolveMyScope(uid);
	const completedScope = and(scope, eq(orders.status, "completed"));

	const { rows, totalRows, completedRows } = await myRepo.ordersPage({
		scope,
		completedScope,
		page,
		pageSize,
	});
	const reviewed = await myRepo.reviewedOrderIds(rows.map((r) => r.id));

	return ok({
		...pageResult(
			rows.map((r) => ({
				...r,
				createdAt: r.createdAt.toISOString(),
				hasReview: reviewed.has(r.id),
			})),
			totalRows[0]?.cnt ?? 0,
			page,
			pageSize,
		),
		completedTotal: completedRows[0]?.cnt ?? 0,
	});
};

export const getMyLoyalty = async (user: CurrentUser) => {
	const uid = user.id;
	const existing = await myRepo.findProfile(uid);

	let customer = existing;
	if (!customer) {
		const created = await myRepo.createProfile({
			fullName: user.name ?? "Customer",
			email: user.email ?? null,
			segment: "regular",
			loyaltyPoints: 0,
			loyaltyTier: "bronze",
			userId: uid,
		});
		if (!created) return fail(500, "Gagal membuat profil member");
		customer = created;
	}

	const { scope } = await resolveMyScope(uid);
	const orderCount = await myRepo.countOrders(scope);

	return ok({
		id: customer.id,
		fullName: customer.fullName,
		phone: customer.phone,
		segment: customer.segment,
		loyaltyPoints: customer.loyaltyPoints,
		loyaltyTier: customer.loyaltyTier,
		orderCount,
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

	const taken = await myRepo.findPhoneOwner(digits, uid);
	if (taken) return fail(400, "Nomor HP sudah digunakan");

	const existing = await myRepo.findProfile(uid);
	if (!existing) {
		const created = await myRepo.createProfile({
			fullName: user.name ?? "Customer",
			email: user.email ?? null,
			phone: digits,
			segment: "regular",
			loyaltyPoints: 0,
			loyaltyTier: "bronze",
			userId: uid,
		});
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

	await myRepo.setPhone(existing.id, digits);
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
	const order = await myRepo.findOrderInScope(input.orderId, scope);
	if (!order) return fail(404, "Order tidak ditemukan");
	if (order.status !== "completed") {
		return fail(400, "Hanya order yang sudah selesai yang bisa diulas");
	}

	const dup = await myRepo.findReviewByOrder(order.id);
	if (dup) return fail(400, "Order ini sudah pernah diulas");

	const inserted = await myRepo.createReview({
		branchId: order.branchId,
		customerId: order.customerId ?? ownedIds[0] ?? null,
		orderId: order.id,
		rating,
		comment: input.comment?.trim() ? input.comment.trim() : null,
		status: "pending",
	});
	if (!inserted) return fail(500, "Gagal menyimpan ulasan");

	return ok({ id: inserted.id });
};
