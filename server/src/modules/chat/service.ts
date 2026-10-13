import type { CurrentUser } from "../../access/index.js";
import { getAccessibleBranchIds } from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { checkRate, publishAbly } from "../../utils/effects.js";
import { chatRepo } from "./repository.js";

export const getUserChannels = async (user: CurrentUser) => {
	const limited = checkRate(`chat:channels:${user.id}`, 10, 60_000);
	if (limited) return limited;

	const branchIds = await getAccessibleBranchIds(user.id, user.role);
	const rows = await chatRepo.userChannels(user.id, branchIds);

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

	const rows = await chatRepo.channelMessages(channelId, before, limit);
	const hasMore = rows.length > limit;
	const messages = (hasMore ? rows.slice(0, limit) : rows)
		.reverse()
		.map((m) => ({ ...m, isOwn: false }));

	return ok({ messages, hasMore });
};

export const getAvailableUsers = async (user: CurrentUser) => {
	const limited = checkRate(`chat:users:${user.id}`, 20, 60_000);
	if (limited) return limited;

	return ok(await chatRepo.availableUsers(user.id));
};

export const sendMessage = async (
	user: CurrentUser,
	channelId: string,
	content: string,
) => {
	const limited = checkRate(`chat:send:${user.id}`, 20, 60_000);
	if (limited) return limited;

	const message = await chatRepo.insertMessage({
		channelId,
		senderId: user.id,
		content,
	});
	if (!message) return fail(500, "Failed to send message");

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

	const existing = await chatRepo.findDirectChannel(user.id, targetUserId);
	if (existing) return ok(existing.id);

	const targetName = await chatRepo.findUserName(targetUserId);
	const channel = await chatRepo.createDirectChannel(
		targetName ?? "Unknown",
		user.id,
		targetUserId,
	);
	if (!channel) return fail(500, "Failed to create channel");

	return ok(channel.id);
};
