import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { createMyReviewBody, myOrdersQuery, updateMyPhoneBody } from "./model.js";
import {
	createMyReview,
	getMyLoyalty,
	getMyOrders,
	updateMyPhone,
} from "./service.js";

/** Own-scope portal /my — tanpa requireRole global, filter by session.user.id (visitor allowed). */
export const myPortal = new Elysia({ prefix: "/my" })
	.use(authPlugin)
	.model({
		"my.ordersQuery": myOrdersQuery,
		"my.review": createMyReviewBody,
		"my.phone": updateMyPhoneBody,
	})
	.get("/orders", async ({ query, user }) => getMyOrders(user, query), {
		query: "my.ordersQuery",
		auth: true,
		detail: { tags: ["my"] },
	})
	.get("/loyalty", async ({ user }) => getMyLoyalty(user), {
		auth: true,
		detail: { tags: ["my"] },
	})
	.post("/reviews", async ({ body, user }) => createMyReview(user, body), {
		body: "my.review",
		auth: true,
		detail: { tags: ["my"] },
	})
	.patch("/phone", async ({ body, user }) => updateMyPhone(user, body), {
		body: "my.phone",
		auth: true,
		detail: { tags: ["my"] },
	});
