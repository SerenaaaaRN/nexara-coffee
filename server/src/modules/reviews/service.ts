import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import type { reviewsQuery } from "./model.js";
import { reviewRepo } from "./repository.js";

export const getReviews = async (params?: typeof reviewsQuery.static) => {
	const { page, pageSize, sortDir } = resolveTableParams(params);

	const result = await reviewRepo.list({
		branchId: params?.branchId,
		status: params?.status,
		rating: params?.rating != null ? Math.floor(Number(params.rating)) : undefined,
		q: params?.q,
		sortBy: params?.sortBy,
		sortDir,
		page,
		pageSize,
	});

	let pending = 0;
	let approved = 0;
	for (const group of result.statusGroups) {
		if (group.status === "pending") pending = group.value;
		else if (group.status === "approved") approved = group.value;
	}

	return ok({
		...pageResult(
			result.rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			result.total,
			page,
			pageSize,
		),
		summary: {
			total: result.total,
			averageRating: Number(result.average ?? 0).toFixed(1),
			pending,
			approved,
		},
	});
};

export const replyReview = async (id: string, reply: string) => {
	const row = await reviewRepo.setReply(id, reply || null);
	if (!row) return fail(404, "Review not found");

	return ok(row);
};

export const moderateReview = async (
	id: string,
	reviewStatus: "approved" | "rejected",
) => {
	const row = await reviewRepo.setStatus(id, reviewStatus);
	if (!row) return fail(404, "Review not found");

	return ok(row);
};
