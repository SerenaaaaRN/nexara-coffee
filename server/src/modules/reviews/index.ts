import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import {
	moderateReviewBody,
	replyReviewBody,
	reviewIdParams,
	reviewsQuery,
} from "./model.js";
import { getReviews, moderateReview, replyReview } from "./service.js";

export const reviews = new Elysia({ prefix: "/reviews" })
	.use(betterAuth)
	.get(
		"/",
		async ({ query, user }) =>
			getReviews(user as { id: string; role: string }, query as never),
		{
			query: reviewsQuery,
			auth: true,
			detail: { tags: ["reviews"] },
		},
	)
	.post(
		"/:id/reply",
		async ({ params, body, user }) =>
			replyReview(
				user as { id: string; role: string },
				params.id,
				(body as { reply: string }).reply,
			),
		{
			params: reviewIdParams,
			body: replyReviewBody,
			auth: true,
			detail: { tags: ["reviews"] },
		},
	)
	.post(
		"/:id/moderate",
		async ({ params, body, user }) =>
			moderateReview(
				user as { id: string; role: string },
				params.id,
				(body as { status: "approved" | "rejected" }).status,
			),
		{
			params: reviewIdParams,
			body: moderateReviewBody,
			auth: true,
			detail: { tags: ["reviews"] },
		},
	);
