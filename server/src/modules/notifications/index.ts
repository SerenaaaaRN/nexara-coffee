import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { notificationIdParams } from "./model.js";
import {
	getNotifications,
	markAllRead,
	markNotificationRead,
} from "./service.js";

export const notifications = new Elysia({ prefix: "/notifications" })
	.use(authPlugin)
	.get("/", async ({ user }) => getNotifications(user), {
		requireRole: ["notifications", "read"],
		detail: { tags: ["notifications"] },
	})
	.post("/:id/read", async ({ params, user }) => markNotificationRead(user, params.id), {
		params: notificationIdParams,
		requireRole: ["notifications", "read"],
		detail: { tags: ["notifications"] },
	})
	.post("/read-all", async ({ user }) => markAllRead(user), {
		requireRole: ["notifications", "read"],
		detail: { tags: ["notifications"] },
	});
