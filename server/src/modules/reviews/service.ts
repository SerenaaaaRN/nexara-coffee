import { and, desc, eq } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";
import { can, type Role } from "../../lib/rbac.js";

export const getReviews = async (
	user: { id: string; role: string },
	params?: { branchId?: string; status?: string; rating?: number },
) => {
	if (!can(user.role as Role, "read", "reviews"))
		return status(403, { success: false as const, error: "Forbidden" });
	const conditions = [];
	if (params?.branchId) conditions.push(eq(reviews.branchId, params.branchId));
	if (params?.status) conditions.push(eq(reviews.status, params.status));
	if (params?.rating != null)
		conditions.push(eq(reviews.rating, Math.floor(Number(params.rating))));
	const rows = await db
		.select({
			id: reviews.id,
			branchId: reviews.branchId,
			customerId: reviews.customerId,
			orderId: reviews.orderId,
			rating: reviews.rating,
			comment: reviews.comment,
			status: reviews.status,
			reply: reviews.reply,
			createdAt: reviews.createdAt,
			branchName: branches.name,
			customerName: customers.fullName,
		})
		.from(reviews)
		.leftJoin(branches, eq(reviews.branchId, branches.id))
		.leftJoin(customers, eq(reviews.customerId, customers.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(reviews.createdAt));
	return { success: true as const, data: rows };
};

export const replyReview = async (
	user: { id: string; role: string },
	id: string,
	reply: string,
) => {
	if (!can(user.role as Role, "update", "reviews"))
		return status(403, { success: false as const, error: "Forbidden" });
	// Parity coffee replyReviewFn: hanya set reply, status tidak diubah.
	const [row] = await db
		.update(reviews)
		.set({ reply: reply || null } as never)
		.where(eq(reviews.id, id))
		.returning();
	if (!row)
		return status(404, { success: false as const, error: "Review not found" });
	return { success: true as const, data: row };
};

export const moderateReview = async (
	user: { id: string; role: string },
	id: string,
	reviewStatus: "approved" | "rejected",
) => {
	if (!can(user.role as Role, "update", "reviews"))
		return status(403, { success: false as const, error: "Forbidden" });
	const [row] = await db
		.update(reviews)
		.set({ status: reviewStatus } as never)
		.where(eq(reviews.id, id))
		.returning();
	if (!row)
		return status(404, { success: false as const, error: "Review not found" });
	return { success: true as const, data: row };
};
