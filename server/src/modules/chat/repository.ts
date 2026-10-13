import { and, desc, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import {
	chatChannelMembers,
	chatChannels,
	chatMessages,
} from "../../db/schema/collaboration.js";

export type NewChatMessage = typeof chatMessages.$inferInsert;
export type NewChatChannel = typeof chatChannels.$inferInsert;

export const chatRepo = {
	userChannels: async (userId: string, branchIds: string[] | null) => {
		return db
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
			.leftJoin(branches, eq(chatChannels.branchId, branches.id))
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
						sql`EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = ${chatChannels.id} AND user_id = ${userId})`,
					),
				),
			)
			.orderBy(
				desc(
					sql`COALESCE((SELECT created_at FROM chat_messages WHERE channel_id = ${chatChannels.id} ORDER BY created_at DESC LIMIT 1), ${chatChannels.createdAt})`,
				),
			);
	},

	channelMessages: async (channelId: string, before?: string, limit = 50) => {
		const conditions = [eq(chatMessages.channelId, channelId)];
		if (before) conditions.push(lt(chatMessages.createdAt, new Date(before)));
		return db
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
	},

	availableUsers: async (userId: string) => {
		return db
			.select({
				id: userTable.id,
				name: userTable.name,
				email: userTable.email,
				image: userTable.image,
			})
			.from(userTable)
			.where(ne(userTable.id, userId))
			.orderBy(userTable.name);
	},

	insertMessage: async (payload: NewChatMessage) => {
		const [row] = await db.insert(chatMessages).values(payload).returning();
		return row ?? null;
	},

	findDirectChannel: async (userId: string, targetUserId: string) => {
		const [row] = await db
			.select({ id: chatChannels.id })
			.from(chatChannels)
			.where(
				and(
					eq(chatChannels.type, "direct"),
					sql`EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = ${chatChannels.id} AND user_id = ${userId})`,
					sql`EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = ${chatChannels.id} AND user_id = ${targetUserId})`,
				),
			)
			.limit(1);
		return row ?? null;
	},

	findUserName: async (userId: string) => {
		const [row] = await db
			.select({ name: userTable.name })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);
		return row?.name ?? null;
	},

	createDirectChannel: async (name: string, userId: string, targetUserId: string) => {
		const [channel] = await db
			.insert(chatChannels)
			.values({ type: "direct", name })
			.returning();
		if (!channel) return null;
		await db.insert(chatChannelMembers).values([
			{ channelId: channel.id, userId },
			{ channelId: channel.id, userId: targetUserId },
		]);
		return channel;
	},
};
