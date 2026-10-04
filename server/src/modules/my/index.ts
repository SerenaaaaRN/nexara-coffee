import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { createMyReviewBody, myOrdersQuery } from "./model.js";
import { createMyReview, getMyLoyalty, getMyOrders } from "./service.js";

export const myPortal = new Elysia({ prefix: "/my" })
	.use(betterAuth)
	.get(
		"/orders",
		async ({ query, user }) => getMyOrders(user as never, query as never),
		{
			query: myOrdersQuery,
			auth: true,
			detail: { tags: ["my"] },
		},
	)
	.get("/loyalty", async ({ user }) => getMyLoyalty(user as never), {
		auth: true,
		detail: { tags: ["my"] },
	})
	.post(
		"/reviews",
		async ({ body, user }) =>
			createMyReview(user as { id: string }, body as never),
		{
			body: createMyReviewBody,
			auth: true,
			detail: { tags: ["my"] },
		},
	);
