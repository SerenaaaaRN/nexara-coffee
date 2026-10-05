import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { fail, ok } from "../../lib/response.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";

export const getReviews = async (params?: { branchId?: string; status?: string; rating?: number },
) => {
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
	return ok(rows);
};

export const replyReview = async (id: string,
	reply: string,
) => {
	// Parity coffee replyReviewFn: hanya set reply, status tidak diubah.
	const [row] = await db
		.update(reviews)
		.set({ reply: reply || null } as never)
		.where(eq(reviews.id, id))
		.returning();
	if (!row)
		return fail(404, "Review not found");
	return ok(row);
};

export const moderateReview = async (id: string,
	reviewStatus: "approved" | "rejected",
) => {
	const [row] = await db
		.update(reviews)
		.set({ status: reviewStatus } as never)
		.where(eq(reviews.id, id))
		.returning();
	if (!row)
		return fail(404, "Review not found");
	return ok(row);
};
