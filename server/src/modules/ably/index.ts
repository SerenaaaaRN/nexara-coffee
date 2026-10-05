import { Elysia } from "elysia";
import { getAblyRest } from "../../lib/ably.server.js";
import { ok } from "../../lib/response.js";
import { authPlugin } from "../../plugins/auth.js";

export const ably = new Elysia({ prefix: "/ably" }).use(authPlugin).post(
	"/token",
	async ({ user }) => {
		const ablyRest = getAblyRest();
		const tokenRequest = await ablyRest.auth.createTokenRequest({
			clientId: user.id,
		});
		return ok(tokenRequest);
	},
	{
		auth: true,
		detail: { tags: ["ably"] },
	},
);
