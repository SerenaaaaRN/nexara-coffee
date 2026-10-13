import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { mapBranchesQuery } from "./model.js";
import { getMapBranches } from "./service.js";

export const maps = new Elysia({ prefix: "/maps" })
	.use(authPlugin)
	.model({ "maps.query": mapBranchesQuery })
	.get("/branches", async ({ query }) => getMapBranches(query), {
		query: "maps.query",
		requireRole: ["maps", "read"],
		detail: { tags: ["maps"] },
	});
