import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import type { CurrentUser } from "../../access/index.js";
import { ok, fail } from "../../lib/http.js";
import { notifications } from "../../db/schema/system.js";

export const getNotifications = async (user: CurrentUser) => {
	const rows = await db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(100);
	return ok(rows);
};

export const markNotificationRead = async (
	user: CurrentUser,
	id: string,
) => {
	const [row] = await db
		.update(notifications)
		.set({ isRead: true } as never)
		.where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
		.returning();
	if (!row)
		return fail(404, "Notification not found",);
	return ok(row);
};

export const markAllRead = async (user: CurrentUser) => {
	await db
		.update(notifications)
		.set({ isRead: true } as never)
		.where(eq(notifications.userId, user.id));
	return ok(null);
};
