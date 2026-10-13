import { t } from "elysia";
import { serverTableQuery } from "../../lib/schema.js";

export const notificationsQuery = t.Composite([
	t.Object({
		filter: t.Optional(t.UnionEnum(["read", "unread"])),
	}),
	serverTableQuery,
]);
