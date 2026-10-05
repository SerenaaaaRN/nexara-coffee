import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import {
	channelIdParams,
	createDirectChannelBody,
	sendMessageBody,
} from "./model.js";
import {
	createDirectChannel,
	getAvailableUsers,
	getChannelMessages,
	getUserChannels,
	sendMessage,
} from "./service.js";

export const chat = new Elysia({ prefix: "/chat" })
	.use(authPlugin)
	.model({
		"chat.channelParams": channelIdParams,
		"chat.send": sendMessageBody,
		"chat.direct": createDirectChannelBody,
		"chat.messagesQuery": t.Object({
			before: t.Optional(t.String()),
			limit: t.Optional(t.Numeric()),
		}),
	})
	.get("/channels", async ({ user }) => getUserChannels(user), {
		requireRole: ["chat", "read"],
		detail: { tags: ["chat"] },
	})
	.get(
		"/channels/:id/messages",
		async ({ params, query, user }) =>
			getChannelMessages(user, params.id, query.before, query.limit),
		{
			params: "chat.channelParams",
			query: "chat.messagesQuery",
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
		async ({ body, user }) => sendMessage(user, body.channelId, body.content),
		{
			body: "chat.send",
			requireRole: ["chat", "create"],
			detail: { tags: ["chat"] },
		},
	)
	.post(
		"/channels/direct",
		async ({ body, user }) => createDirectChannel(user, body.targetUserId),
		{
			body: "chat.direct",
			requireRole: ["chat", "create"],
			detail: { tags: ["chat"] },
		},
	);
