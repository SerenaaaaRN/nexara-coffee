import { t } from "elysia";
import { serverTableQuery } from "../../lib/schema.js";

export const auditQuery = t.Composite([
	t.Object({
		branch: t.Optional(t.String()),
		action: t.Optional(t.String()),
		targetTable: t.Optional(t.String()),
	}),
	serverTableQuery,
]);
