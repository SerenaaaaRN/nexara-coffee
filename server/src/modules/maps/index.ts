import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { getMapBranches } from "./service.js";

export const maps = new Elysia({ prefix: "/maps" })
	.use(authPlugin)
	.get("/branches", async ({ user }) => getMapBranches(user), {
		requireRole: ["maps", "read"],
		detail: { tags: ["maps"] },
	});
