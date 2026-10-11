import { Elysia } from "elysia";
import { auth } from "../lib/auth.js";

export const session = new Elysia().get(
	"/api/auth/session",
	async ({ request }) => {
		const s = await auth.api.getSession({ headers: request.headers });
		if (!s) return { success: false as const, error: "Unauthorized" };
		return { success: true as const, data: s };
	},
);
