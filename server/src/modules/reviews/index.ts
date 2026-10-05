import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import {
	moderateReviewBody,
	replyReviewBody,
	reviewIdParams,
	reviewsQuery,
} from "./model.js";
import { getReviews, moderateReview, replyReview } from "./service.js";

export const reviews = new Elysia({ prefix: "/reviews" })
	.use(authPlugin)
	.get("/", async ({ query, user }) => getReviews(user, query as never), {
		query: reviewsQuery,
		requireRole: ["reviews", "read"],
		detail: { tags: ["reviews"] },
	})
	.post(
		"/:id/reply",
		async ({ params, body, user }) =>
			replyReview(user, params.id, (body as { reply: string }).reply),
		{
			params: reviewIdParams,
			body: replyReviewBody,
			requireRole: ["reviews", "update"],
			detail: { tags: ["reviews"] },
		},
	)
	.post(
		"/:id/moderate",
		async ({ params, body, user }) =>
			moderateReview(user, params.id, (body as { status: "approved" | "rejected" }).status),
		{
			params: reviewIdParams,
			body: moderateReviewBody,
			requireRole: ["reviews", "update"],
			detail: { tags: ["reviews"] },
		},
	);
