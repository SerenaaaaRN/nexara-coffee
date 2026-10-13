import type { CurrentUser } from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import type { notificationsQuery } from "./model.js";
import { notificationRepo } from "./repository.js";

export const getNotifications = async (
	user: CurrentUser,
	params?: typeof notificationsQuery.static,
) => {
	const { page, pageSize } = resolveTableParams(params);

	const result = await notificationRepo.list({
		userId: user.id,
		filter: params?.filter,
		page,
		pageSize,
	});

	return ok({
		...pageResult(
			result.rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			result.total,
			page,
			pageSize,
		),
		summary: { total: result.total, unread: result.unread },
	});
};

export const markNotificationRead = async (user: CurrentUser, id: string) => {
	const row = await notificationRepo.markRead(user.id, id);
	if (!row) return fail(404, "Notification not found");

	return ok(row);
};

export const markAllRead = async (user: CurrentUser) => {
	await notificationRepo.markAllRead(user.id);

	return ok(null);
};
