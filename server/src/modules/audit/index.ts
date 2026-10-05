import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { auditQuery } from "./model.js";
import { getAuditLogs } from "./service.js";

export const audit = new Elysia({ prefix: "/audit" })
	.use(authPlugin)
	.get("/logs", async ({ query, user }) => getAuditLogs(user, query as never), {
		query: auditQuery,
		requireRole: ["system", "read"],
		detail: { tags: ["audit"] },
	});
