import { Elysia } from "elysia";
import { getAblyRest } from "../../lib/ably.server.js";
import { betterAuth } from "../../plugins/auth.js";

export const ably = new Elysia({ prefix: "/ably" }).use(betterAuth).post(
	"/token",
	async ({ user }) => {
		const u = user as { id: string; role: string };
		const ablyRest = getAblyRest();
		const tokenRequest = await ablyRest.auth.createTokenRequest({
			clientId: u.id,
		});
		return { success: true as const, data: tokenRequest };
	},
	{
		auth: true,
		detail: { tags: ["ably"] },
	},
);
