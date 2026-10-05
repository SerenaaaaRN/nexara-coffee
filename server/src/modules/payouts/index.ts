import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { payoutIdParams, payoutsQuery, requestPayoutBody } from "./model.js";
import { approvePayout, getPayouts, requestPayout } from "./service.js";

export const payouts = new Elysia({ prefix: "/payouts" })
	.use(authPlugin)
	.get("/", async ({ query, user }) => getPayouts(user, query as never), {
		query: payoutsQuery,
		requireRole: ["payouts", "read"],
		detail: { tags: ["payouts"] },
	})
	.post("/request", async ({ body, user }) => requestPayout(user, body as never), {
		body: requestPayoutBody,
		requireRole: ["payouts", "create"],
		detail: { tags: ["payouts"] },
	})
	.post("/:id/approve", async ({ params, user }) => approvePayout(user, params.id), {
		params: payoutIdParams,
		requireRole: ["payouts", "approve"],
		detail: { tags: ["payouts"] },
	});
