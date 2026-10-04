import { t } from "elysia";

export const channelIdParams = t.Object({ id: t.String({ minLength: 1 }) });

export const messagesQuery = t.Object({
	channelId: t.String({ minLength: 1 }),
	before: t.Optional(t.String()),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});

export const sendMessageBody = t.Object({
	channelId: t.String({ minLength: 1 }),
	content: t.String({ minLength: 1, maxLength: 2000 }),
});

export const createDirectChannelBody = t.Object({
	targetUserId: t.String({ minLength: 1 }),
});
