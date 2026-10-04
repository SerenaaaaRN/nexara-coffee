import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { getMapBranches } from "./service.js";

export const maps = new Elysia({ prefix: "/maps" })
	.use(betterAuth)
	.get(
		"/branches",
		async ({ user }) => getMapBranches(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["maps"] },
		},
	);
