import { Elysia } from "elysia";
import { idParams } from "../../lib/schema.js";
import { authPlugin } from "../../plugins/auth.js";
import { moderateReviewBody, replyReviewBody, reviewsQuery } from "./model.js";
import { getReviews, moderateReview, replyReview } from "./service.js";

export const reviews = new Elysia({ prefix: "/reviews" })
	.use(authPlugin)
	.model({
		"reviews.query": reviewsQuery,
		"reviews.params": idParams,
		"reviews.reply": replyReviewBody,
		"reviews.moderate": moderateReviewBody,
	})
	.get("/", async ({ query }) => getReviews(query), {
		query: "reviews.query",
		requireRole: ["reviews", "read"],
		detail: { tags: ["reviews"] },
	})
	.post(
		"/:id/reply",
		async ({ params, body }) => replyReview(params.id, body.reply),
		{
			params: "reviews.params",
			body: "reviews.reply",
			requireRole: ["reviews", "update"],
			detail: { tags: ["reviews"] },
		},
	)
	.post(
		"/:id/moderate",
		async ({ params, body }) => moderateReview(params.id, body.status),
		{
			params: "reviews.params",
			body: "reviews.moderate",
			requireRole: ["reviews", "update"],
			detail: { tags: ["reviews"] },
		},
	);
