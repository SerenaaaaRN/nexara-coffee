import { and, desc, eq } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { db } from "../../db/index.js";
import { notifications } from "../../db/schema/system.js";
import { fail, ok } from "../../lib/http.js";

export const getNotifications = async (user: CurrentUser) => {
	const rows = await db
		.select({
			id: notifications.id,
			userId: notifications.userId,
			type: notifications.type,
			title: notifications.title,
			body: notifications.body,
			isRead: notifications.isRead,
			createdAt: notifications.createdAt,
		})
		.from(notifications)
		.where(eq(notifications.userId, user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(100);
	const data = rows.map((r) => ({
		...r,
		createdAt: r.createdAt.toISOString(),
	}));
	return ok(data);
};

export const markNotificationRead = async (user: CurrentUser, id: string) => {
	const [row] = await db
		.update(notifications)
		.set({ isRead: true } as never)
		.where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
		.returning();
	if (!row) return fail(404, "Notification not found");
	return ok(row);
};

export const markAllRead = async (user: CurrentUser) => {
	await db
		.update(notifications)
		.set({ isRead: true } as never)
		.where(eq(notifications.userId, user.id));
	return ok(null);
};
