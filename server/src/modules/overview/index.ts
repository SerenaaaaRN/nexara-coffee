import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { overviewQuery } from "./model.js";
import { getOverviewDashboard } from "./service.js";

export const overview = new Elysia({ prefix: "/overview" })
	.use(betterAuth)
	.get(
		"/dashboard",
		async ({ query, user }) =>
			getOverviewDashboard(
				user as { id: string; role: string },
				query.branch ?? null,
			),
		{
			query: overviewQuery,
			auth: true,
			detail: { tags: ["overview"], summary: "Get overview dashboard data" },
		},
	);
