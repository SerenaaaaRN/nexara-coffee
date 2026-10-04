import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { auditQuery } from "./model.js";
import { getAuditLogs } from "./service.js";

export const audit = new Elysia({ prefix: "/audit" })
	.use(betterAuth)
	.get(
		"/logs",
		async ({ query, user }) =>
			getAuditLogs(user as { id: string; role: string }, query as never),
		{
			query: auditQuery,
			auth: true,
			detail: { tags: ["audit"] },
		},
	);
