import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { branches } from "./branches";

export const chatChannels = pgTable(
	"chat_channels",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		type: text("type").notNull(),
		branchId: text("branch_id").references(() => branches.id, {
			onDelete: "cascade",
		}),
		name: text("name"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("chat_channels_branch_id_idx").on(table.branchId)],
);

export const chatChannelMembers = pgTable(
	"chat_channel_members",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		channelId: text("channel_id")
			.notNull()
			.references(() => chatChannels.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("chat_channel_members_channel_id_idx").on(table.channelId),
		index("chat_channel_members_user_id_idx").on(table.userId),
	],
);

export const chatMessages = pgTable(
	"chat_messages",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		channelId: text("channel_id")
			.notNull()
			.references(() => chatChannels.id, { onDelete: "cascade" }),
		senderId: text("sender_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("chat_messages_channel_id_idx").on(table.channelId),
		index("chat_messages_sender_id_idx").on(table.senderId),
	],
);

export const chatChannelsRelations = relations(
	chatChannels,
	({ one, many }) => ({
		branch: one(branches, {
			fields: [chatChannels.branchId],
			references: [branches.id],
		}),
		members: many(chatChannelMembers),
		messages: many(chatMessages),
	}),
);

export const chatChannelMembersRelations = relations(
	chatChannelMembers,
	({ one }) => ({
		channel: one(chatChannels, {
			fields: [chatChannelMembers.channelId],
			references: [chatChannels.id],
		}),
		user: one(user, {
			fields: [chatChannelMembers.userId],
			references: [user.id],
		}),
	}),
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	channel: one(chatChannels, {
		fields: [chatMessages.channelId],
		references: [chatChannels.id],
	}),
	sender: one(user, {
		fields: [chatMessages.senderId],
		references: [user.id],
	}),
}));
