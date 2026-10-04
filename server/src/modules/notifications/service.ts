import { and, desc, eq } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { notifications } from "../../db/schema/system.js";
import { can, type Role } from "../../lib/rbac.js";

export const getNotifications = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "notifications"))
		return status(403, { success: false as const, error: "Forbidden" });
	const rows = await db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(100);
	return { success: true as const, data: rows };
};

export const markNotificationRead = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "read", "notifications"))
		return status(403, { success: false as const, error: "Forbidden" });
	const [row] = await db
		.update(notifications)
		.set({ isRead: true } as never)
		.where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
		.returning();
	if (!row)
		return status(404, {
			success: false as const,
			error: "Notification not found",
		});
	return { success: true as const, data: row };
};

export const markAllRead = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "notifications"))
		return status(403, { success: false as const, error: "Forbidden" });
	await db
		.update(notifications)
		.set({ isRead: true } as never)
		.where(eq(notifications.userId, user.id));
	return { success: true as const, data: null };
};
