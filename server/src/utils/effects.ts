import { getAblyRest } from "../lib/ably.server.js";
import { rateLimit } from "../lib/rate-limit.js";
import { fail } from "../lib/response.js";

export const publishAbly = async (
	channel: string,
	event: string,
	data: unknown,
) => {
	try {
		const ably = getAblyRest();
		await ably.channels.get(channel).publish(event, data);
	} catch (e) {
		console.error(`[ably] ${channel}:${event} failed:`, e);
	}
};

export const checkRate = (key: string, max: number, windowMs: number) => {
	if (!rateLimit(key, max, windowMs)) {
		return fail(429, "Too many requests");
	}
	return null;
};
