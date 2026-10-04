import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { payoutIdParams, payoutsQuery, requestPayoutBody } from "./model.js";
import { approvePayout, getPayouts, requestPayout } from "./service.js";

export const payouts = new Elysia({ prefix: "/payouts" })
	.use(betterAuth)
	.get(
		"/",
		async ({ query, user }) =>
			getPayouts(user as { id: string; role: string }, query as never),
		{
			query: payoutsQuery,
			auth: true,
			detail: { tags: ["payouts"] },
		},
	)
	.post(
		"/request",
		async ({ body, user }) =>
			requestPayout(user as { id: string; role: string }, body as never),
		{
			body: requestPayoutBody,
			auth: true,
			detail: { tags: ["payouts"] },
		},
	)
	.post(
		"/:id/approve",
		async ({ params, user }) =>
			approvePayout(user as { id: string; role: string }, params.id),
		{
			params: payoutIdParams,
			auth: true,
			detail: { tags: ["payouts"] },
		},
	);
