import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { createDirectChannelBody, sendMessageBody } from "./model.js";
import {
	createDirectChannel,
	getAvailableUsers,
	getChannelMessages,
	getUserChannels,
	sendMessage,
} from "./service.js";

export const chat = new Elysia({ prefix: "/chat" })
	.use(authPlugin)
	.get("/channels", async ({ user }) => getUserChannels(user), {
		requireRole: ["chat", "read"],
		detail: { tags: ["chat"] },
	})
	.get(
		"/channels/:id/messages",
		async ({ params, query, user }) =>
			getChannelMessages(
				user,
				params.id,
				(query as { before?: string })?.before,
				(query as { limit?: number })?.limit,
			),
		{
			requireRole: ["chat", "read"],
			detail: { tags: ["chat"] },
		},
	)
	.get("/available-users", async ({ user }) => getAvailableUsers(user), {
		requireRole: ["chat", "read"],
		detail: { tags: ["chat"] },
	})
	.post(
		"/messages",
		async ({ body, user }) =>
			sendMessage(
				user,
				(body as { channelId: string }).channelId,
				(body as { content: string }).content,
			),
		{
			body: sendMessageBody,
			requireRole: ["chat", "create"],
			detail: { tags: ["chat"] },
		},
	)
	.post(
		"/channels/direct",
		async ({ body, user }) =>
			createDirectChannel(user, (body as { targetUserId: string }).targetUserId),
		{
			body: createDirectChannelBody,
			requireRole: ["chat", "create"],
			detail: { tags: ["chat"] },
		},
	);
