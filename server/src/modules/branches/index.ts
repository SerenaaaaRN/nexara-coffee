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
	.model({
		"branches.params": branchIdParams,
		"branches.create": createBranchSchema,
		"branches.update": updateBranchSchema,
		"branches.franchise": assignFranchiseSchema,
	})
	.get("/", async ({ user }) => getBranches(user), {
		requireRole: ["branches", "read"],
		detail: { tags: ["branches"] },
	})
	.post("/", async ({ body, user }) => createBranch(user, body), {
		body: "branches.create",
		requireRole: ["branches", "create"],
		detail: { tags: ["branches"] },
	})
	.put(
		"/:id",
		async ({ params, body, user }) => updateBranch(user, params.id, body),
		{
			params: "branches.params",
			body: "branches.update",
			requireRole: ["branches", "update"],
			detail: { tags: ["branches"] },
		},
	)
	.delete("/:id", async ({ params, user }) => deleteBranch(user, params.id), {
		params: "branches.params",
		requireRole: ["branches", "delete"],
		detail: { tags: ["branches"] },
	})
	.post("/franchise", async ({ body, user }) => assignFranchise(user, body), {
		body: "branches.franchise",
		requireRole: ["branches", "update"],
		detail: { tags: ["branches"] },
	});
