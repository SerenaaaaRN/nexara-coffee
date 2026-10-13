import { Elysia } from "elysia";
import { idParams } from "../../lib/schema.js";
import { authPlugin } from "../../plugins/auth.js";
import { notificationsQuery } from "./model.js";
import {
	getNotifications,
	markAllRead,
	markNotificationRead,
} from "./service.js";

export const notifications = new Elysia({ prefix: "/notifications" })
	.use(authPlugin)
	.model({
		"notifications.query": notificationsQuery,
		"notifications.params": idParams,
	})
	.get("/", async ({ query, user }) => getNotifications(user, query), {
		query: "notifications.query",
		requireRole: ["notifications", "read"],
		detail: { tags: ["notifications"] },
	})
	.post(
		"/:id/read",
		async ({ params, user }) => markNotificationRead(user, params.id),
		{
			params: "notifications.params",
			requireRole: ["notifications", "read"],
			detail: { tags: ["notifications"] },
		},
	)
	.post("/read-all", async ({ user }) => markAllRead(user), {
		requireRole: ["notifications", "read"],
		detail: { tags: ["notifications"] },
	});
