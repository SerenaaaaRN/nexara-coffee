import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { overviewQuery } from "./model.js";
import { getOverviewDashboard } from "./service.js";

export const overview = new Elysia({ prefix: "/overview" })
	.use(authPlugin)
	.model({ "overview.query": overviewQuery })
	.get(
		"/dashboard",
		async ({ query, user }) => getOverviewDashboard(user, query.branch ?? null),
		{
			query: "overview.query",
			requireRole: ["reports", "read"],
			detail: { tags: ["overview"], summary: "Get overview dashboard data" },
		},
	);
