import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { createDirectChannelBody, sendMessageBody } from "./model.js";
import {
	createDirectChannel,
	getAvailableUsers,
	getChannelMessages,
	getUserChannels,
	sendMessage,
} from "./service.js";

export const chat = new Elysia({ prefix: "/chat" })
	.use(betterAuth)
	.get(
		"/channels",
		async ({ user }) => getUserChannels(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["chat"] },
		},
	)
	.get(
		"/channels/:id/messages",
		async ({ params, query, user }) =>
			getChannelMessages(
				user as { id: string; role: string },
				params.id,
				(query as { before?: string })?.before,
				(query as { limit?: number })?.limit,
			),
		{
			auth: true,
			detail: { tags: ["chat"] },
		},
	)
	.get(
		"/available-users",
		async ({ user }) => getAvailableUsers(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["chat"] },
		},
	)
	.post(
		"/messages",
		async ({ body, user }) =>
			sendMessage(
				user as never,
				(body as { channelId: string }).channelId,
				(body as { content: string }).content,
			),
		{
			body: sendMessageBody,
			auth: true,
			detail: { tags: ["chat"] },
		},
	)
	.post(
		"/channels/direct",
		async ({ body, user }) =>
			createDirectChannel(
				user as { id: string; role: string },
				(body as { targetUserId: string }).targetUserId,
			),
		{
			body: createDirectChannelBody,
			auth: true,
			detail: { tags: ["chat"] },
		},
	);
