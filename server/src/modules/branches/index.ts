import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import {
	assignFranchiseSchema,
	branchIdParams,
	createBranchSchema,
	updateBranchSchema,
} from "./model.js";
import {
	assignFranchise,
	createBranch,
	deleteBranch,
	getBranches,
	updateBranch,
} from "./service.js";

export const branches = new Elysia({ prefix: "/branches" })
	.use(authPlugin)
	.get("/", async ({ user }) => getBranches(user), {
		requireRole: ["branches", "read"],
		detail: { tags: ["branches"] },
	})
	.post("/", async ({ body, user }) => createBranch(user, body as never), {
		body: createBranchSchema,
		requireRole: ["branches", "create"],
		detail: { tags: ["branches"] },
	})
	.put(
		"/:id",
		async ({ params, body, user }) => updateBranch(user, params.id, body as never),
		{
			params: branchIdParams,
			body: updateBranchSchema,
			requireRole: ["branches", "update"],
			detail: { tags: ["branches"] },
		},
	)
	.delete("/:id", async ({ params, user }) => deleteBranch(user, params.id), {
		params: branchIdParams,
		requireRole: ["branches", "delete"],
		detail: { tags: ["branches"] },
	})
	.post("/franchise", async ({ body, user }) => assignFranchise(user, body as never), {
		body: assignFranchiseSchema,
		requireRole: ["branches", "update"],
		detail: { tags: ["branches"] },
	});
