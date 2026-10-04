import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { notificationIdParams } from "./model.js";
import {
	getNotifications,
	markAllRead,
	markNotificationRead,
} from "./service.js";

export const notifications = new Elysia({ prefix: "/notifications" })
	.use(betterAuth)
	.get(
		"/",
		async ({ user }) => getNotifications(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["notifications"] },
		},
	)
	.post(
		"/:id/read",
		async ({ params, user }) =>
			markNotificationRead(user as { id: string; role: string }, params.id),
		{
			params: notificationIdParams,
			auth: true,
			detail: { tags: ["notifications"] },
		},
	)
	.post(
		"/read-all",
		async ({ user }) => markAllRead(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["notifications"] },
		},
	);
