import { and, asc, avg, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { containsPattern } from "../../lib/table.js";
import type { reviewsQuery } from "./model.js";

/**
 * Kolom yang boleh di-sort dari client (`sortBy` di luar ini diabaikan).
 */
const REVIEW_SORT_COLUMNS = {
	createdAt: reviews.createdAt,
	rating: reviews.rating,
	status: reviews.status,
} as const;

export const getReviews = async (params?: typeof reviewsQuery.static) => {
	const { page, pageSize, sortDir } = resolveTableParams(params);
	const conditions = [];
	if (params?.branchId) conditions.push(eq(reviews.branchId, params.branchId));
	if (params?.status) conditions.push(eq(reviews.status, params.status));
	if (params?.rating != null)
		conditions.push(eq(reviews.rating, Math.floor(Number(params.rating))));

	const q = params?.q?.trim();
	if (q) {
		const pattern = containsPattern(q);
		conditions.push(
			or(
				ilike(customers.fullName, pattern),
				ilike(branches.name, pattern),
				ilike(reviews.comment, pattern),
			),
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const sortCol =
		params?.sortBy && params.sortBy in REVIEW_SORT_COLUMNS
			? REVIEW_SORT_COLUMNS[params.sortBy as keyof typeof REVIEW_SORT_COLUMNS]
			: reviews.createdAt;
	const orderBy = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

	const columns = {
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
	};

	const [rows, [{ value: total }], statusGroups, [{ value: average }]] =
		await Promise.all([
			db
				.select(columns)
				.from(reviews)
				.leftJoin(branches, eq(reviews.branchId, branches.id))
				.leftJoin(customers, eq(reviews.customerId, customers.id))
				.where(where)
				.orderBy(orderBy)
				.limit(pageSize)
				.offset(page * pageSize),
			db
				.select({ value: count() })
				.from(reviews)
				.leftJoin(branches, eq(reviews.branchId, branches.id))
				.leftJoin(customers, eq(reviews.customerId, customers.id))
				.where(where),
			db
				.select({ status: reviews.status, value: count() })
				.from(reviews)
				.leftJoin(branches, eq(reviews.branchId, branches.id))
				.leftJoin(customers, eq(reviews.customerId, customers.id))
				.where(where)
				.groupBy(reviews.status),
			db.select({ value: avg(reviews.rating) }).from(reviews).where(where),
		]);

	let pending = 0;
	let approved = 0;
	for (const group of statusGroups) {
		if (group.status === "pending") pending = group.value;
		else if (group.status === "approved") approved = group.value;
	}

	return ok({
		...pageResult(
			rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			total,
			page,
			pageSize,
		),
		summary: {
			total,
			averageRating: Number(average ?? 0).toFixed(1),
			pending,
			approved,
		},
	});
};

export const replyReview = async (id: string, reply: string) => {
	// Parity coffee replyReviewFn: hanya set reply, status tidak diubah.
	const [row] = await db
		.update(reviews)
		.set({ reply: reply || null } as never)
		.where(eq(reviews.id, id))
		.returning();
	if (!row) return fail(404, "Review not found");
	return ok(row);
};

export const moderateReview = async (
	id: string,
	reviewStatus: "approved" | "rejected",
) => {
	const [row] = await db
		.update(reviews)
		.set({ status: reviewStatus } as never)
		.where(eq(reviews.id, id))
		.returning();
	if (!row) return fail(404, "Review not found");
	return ok(row);
};
