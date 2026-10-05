import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { createMyReviewBody, myOrdersQuery } from "./model.js";
import { createMyReview, getMyLoyalty, getMyOrders } from "./service.js";

/** Own-scope portal /my — tanpa requireRole global, filter by session.user.id (visitor allowed). */
export const myPortal = new Elysia({ prefix: "/my" })
	.use(authPlugin)
	.get("/orders", async ({ query, user }) => getMyOrders(user, query as never), {
		query: myOrdersQuery,
		auth: true,
		detail: { tags: ["my"] },
	})
	.get("/loyalty", async ({ user }) => getMyLoyalty(user), {
		auth: true,
		detail: { tags: ["my"] },
	})
	.post("/reviews", async ({ body, user }) => createMyReview(user, body as never), {
		body: createMyReviewBody,
		auth: true,
		detail: { tags: ["my"] },
	});
