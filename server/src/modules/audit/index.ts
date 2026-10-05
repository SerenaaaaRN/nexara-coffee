import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { auditQuery } from "./model.js";
import { getAuditLogs } from "./service.js";

export const audit = new Elysia({ prefix: "/audit" })
	.use(authPlugin)
	.model({ "audit.query": auditQuery })
	.get("/logs", async ({ query, user }) => getAuditLogs(user, query), {
		query: "audit.query",
		requireRole: ["system", "read"],
		detail: { tags: ["audit"] },
	});
