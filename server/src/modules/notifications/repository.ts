import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { notifications } from "../../db/schema/system.js";

export type NotificationFilter = "read" | "unread" | undefined;

export type NotificationListArgs = {
	userId: string;
	filter?: string;
	page: number;
	pageSize: number;
};

const listColumns = {
	id: notifications.id,
	userId: notifications.userId,
	type: notifications.type,
	title: notifications.title,
	body: notifications.body,
	isRead: notifications.isRead,
	createdAt: notifications.createdAt,
};

export const notificationRepo = {
	list: async (args: NotificationListArgs) => {
		const owner = eq(notifications.userId, args.userId);
		const state =
			args.filter === "read"
				? eq(notifications.isRead, true)
				: args.filter === "unread"
					? eq(notifications.isRead, false)
					: undefined;
		const where = and(owner, state);

		const [rows, [{ value: total }], [{ value: unread }]] = await Promise.all([
			db
				.select(listColumns)
				.from(notifications)
				.where(where)
				.orderBy(desc(notifications.createdAt))
				.limit(args.pageSize)
				.offset(args.page * args.pageSize),
			db.select({ value: count() }).from(notifications).where(where),
			db
				.select({ value: count() })
				.from(notifications)
				.where(
					and(eq(notifications.userId, args.userId), eq(notifications.isRead, false)),
				),
		]);

		return { rows, total, unread };
	},

	markRead: async (userId: string, id: string) => {
		const [row] = await db
			.update(notifications)
			.set({ isRead: true })
			.where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
			.returning();
		return row ?? null;
	},

	markAllRead: async (userId: string) => {
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(eq(notifications.userId, userId));
	},
};
