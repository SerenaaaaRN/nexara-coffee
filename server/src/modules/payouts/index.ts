import { Elysia } from "elysia";
import { idParams } from "../../lib/schema.js";
import { authPlugin } from "../../plugins/auth.js";
import { payoutsQuery, requestPayoutBody } from "./model.js";
import { approvePayout, getPayouts, requestPayout } from "./service.js";

export const payouts = new Elysia({ prefix: "/payouts" })
	.use(authPlugin)
	.model({
		"payouts.query": payoutsQuery,
		"payouts.request": requestPayoutBody,
		"payouts.params": idParams,
	})
	.get("/", async ({ query, user }) => getPayouts(user, query), {
		query: "payouts.query",
		requireRole: ["payouts", "read"],
		detail: { tags: ["payouts"] },
	})
	.post("/request", async ({ body, user }) => requestPayout(user, body), {
		body: "payouts.request",
		requireRole: ["payouts", "create"],
		detail: { tags: ["payouts"] },
	})
	.post(
		"/:id/approve",
		async ({ params, user }) => approvePayout(user, params.id),
		{
			params: "payouts.params",
			requireRole: ["payouts", "approve"],
			detail: { tags: ["payouts"] },
		},
	);
