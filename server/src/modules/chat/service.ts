import { and, desc, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { getAccessibleBranchIds } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import {
	chatChannelMembers,
	chatChannels,
	chatMessages,
} from "../../db/schema/collaboration.js";
import { fail, ok } from "../../lib/http.js";
import { checkRate, publishAbly } from "../../utils/effects.js";

export const getUserChannels = async (user: CurrentUser) => {
	const limited = checkRate(`chat:channels:${user.id}`, 10, 60_000);
	if (limited) return limited;
	const branchIds = await getAccessibleBranchIds(user.id, user.role);
	const baseQuery = db
		.select({
			id: chatChannels.id,
			type: chatChannels.type,
			branchId: chatChannels.branchId,
			name: chatChannels.name,
			createdAt: chatChannels.createdAt,
			branchName: branches.name,
			lastMessage: sql<{
				content: string;
				senderName: string;
				createdAt: Date;
			} | null>`(
        SELECT jsonb_build_object(
          'content', cm.content,
          'senderName', u.name,
          'createdAt', cm.created_at
        )
        FROM chat_messages cm
        LEFT JOIN "user" u ON u.id = cm.sender_id
        WHERE cm.channel_id = ${chatChannels.id}
        ORDER BY cm.created_at DESC
        LIMIT 1
      )`,
			memberCount: sql<number>`(SELECT COUNT(*)::int FROM chat_channel_members WHERE channel_id = ${chatChannels.id})`,
		})
		.from(chatChannels)
		.leftJoin(branches, eq(chatChannels.branchId, branches.id));

	const orderBy = desc(
		sql`COALESCE((SELECT created_at FROM chat_messages WHERE channel_id = ${chatChannels.id} ORDER BY created_at DESC LIMIT 1), ${chatChannels.createdAt})`,
	);

	const rows = await baseQuery
		.where(
			or(
				and(
					ne(chatChannels.type, "direct"),
					branchIds === null
						? sql`1=1`
						: branchIds.length > 0
							? or(
									eq(chatChannels.type, "global"),
									inArray(chatChannels.branchId, branchIds),
								)
							: eq(chatChannels.type, "global"),
				),
				and(
					eq(chatChannels.type, "direct"),
					sql`EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = ${chatChannels.id} AND user_id = ${user.id})`,
				),
			),
		)
		.orderBy(orderBy);

	return ok(rows);
};

export const getChannelMessages = async (
	user: CurrentUser,
	channelId: string,
	before?: string,
	limit = 50,
) => {
	const limited = checkRate(`chat:messages:${user.id}`, 30, 60_000);
	if (limited) return limited;
	const conditions = [eq(chatMessages.channelId, channelId)];
	if (before) conditions.push(lt(chatMessages.createdAt, new Date(before)));
	const rows = await db
		.select({
			id: chatMessages.id,
			channelId: chatMessages.channelId,
			senderId: chatMessages.senderId,
			content: chatMessages.content,
			createdAt: chatMessages.createdAt,
			senderName: userTable.name,
			senderImage: userTable.image,
		})
		.from(chatMessages)
		.leftJoin(userTable, eq(chatMessages.senderId, userTable.id))
		.where(and(...conditions))
		.orderBy(desc(chatMessages.createdAt))
		.limit(limit + 1);
	const hasMore = rows.length > limit;
	const messages = (hasMore ? rows.slice(0, limit) : rows)
		.reverse()
		.map((m) => ({ ...m, isOwn: false }));
	return ok({ messages, hasMore });
};

export const getAvailableUsers = async (user: CurrentUser) => {
	const limited = checkRate(`chat:users:${user.id}`, 20, 60_000);
	if (limited) return limited;
	const rows = await db
		.select({
			id: userTable.id,
			name: userTable.name,
			email: userTable.email,
			image: userTable.image,
		})
		.from(userTable)
		.where(ne(userTable.id, user.id))
		.orderBy(userTable.name);
	return ok(rows);
};

export const sendMessage = async (
	user: CurrentUser,
	channelId: string,
	content: string,
) => {
	const limited = checkRate(`chat:send:${user.id}`, 20, 60_000);
	if (limited) return limited;
	const [message] = await db
		.insert(chatMessages)
		.values({ channelId, senderId: user.id, content })
		.returning();
	const messageData = {
		id: message.id,
		channelId: message.channelId,
		senderId: message.senderId,
		content: message.content,
		createdAt: message.createdAt.toISOString(),
		senderName: user.name ?? "",
		senderImage: user.image ?? null,
	};
	void publishAbly(`chat:channel:${channelId}`, "message", messageData);
	return ok(messageData);
};

export const createDirectChannel = async (
	user: CurrentUser,
	targetUserId: string,
) => {
	const limited = checkRate(`chat:create-dm:${user.id}`, 10, 60_000);
	if (limited) return limited;
	if (targetUserId === user.id)
		return fail(400, "Cannot create DM with yourself");
	const [existing] = await db
		.select({ id: chatChannels.id })
		.from(chatChannels)
		.where(
			and(
				eq(chatChannels.type, "direct"),
				sql`EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = ${chatChannels.id} AND user_id = ${user.id})`,
				sql`EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = ${chatChannels.id} AND user_id = ${targetUserId})`,
			),
		)
		.limit(1);
	if (existing) return ok(existing.id);
	const [targetUser] = await db
		.select({ name: userTable.name })
		.from(userTable)
		.where(eq(userTable.id, targetUserId))
		.limit(1);
	const [channel] = await db
		.insert(chatChannels)
		.values({ type: "direct", name: targetUser?.name ?? "Unknown" })
		.returning();
	await db.insert(chatChannelMembers).values([
		{ channelId: channel.id, userId: user.id },
		{ channelId: channel.id, userId: targetUserId },
	]);
	return ok(channel.id);
};
