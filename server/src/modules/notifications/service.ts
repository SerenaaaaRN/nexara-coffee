import { and, count, desc, eq } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { db } from "../../db/index.js";
import { notifications } from "../../db/schema/system.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import type { notificationsQuery } from "./model.js";

export const getNotifications = async (
	user: CurrentUser,
	params?: typeof notificationsQuery.static,
) => {
	const { page, pageSize } = resolveTableParams(params);
	const conditions = [eq(notifications.userId, user.id)];
	if (params?.filter === "read") {
		conditions.push(eq(notifications.isRead, true));
	} else if (params?.filter === "unread") {
		conditions.push(eq(notifications.isRead, false));
	}
	const where = and(...conditions);

	const columns = {
		id: notifications.id,
		userId: notifications.userId,
		type: notifications.type,
		title: notifications.title,
		body: notifications.body,
		isRead: notifications.isRead,
		createdAt: notifications.createdAt,
	};

	const [rows, [{ value: total }], [{ value: unread }]] = await Promise.all([
		db
			.select(columns)
			.from(notifications)
			.where(where)
			.orderBy(desc(notifications.createdAt))
			.limit(pageSize)
			.offset(page * pageSize),
		db.select({ value: count() }).from(notifications).where(where),
		db
			.select({ value: count() })
			.from(notifications)
			.where(
				and(eq(notifications.userId, user.id), eq(notifications.isRead, false)),
			),
	]);
	const data = rows.map((r) => ({
		...r,
		createdAt: r.createdAt.toISOString(),
	}));
	return ok({
		...pageResult(data, total, page, pageSize),
		summary: { total, unread },
	});
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
