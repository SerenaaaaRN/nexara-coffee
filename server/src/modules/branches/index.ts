import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
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
	.use(betterAuth)
	.get(
		"/",
		async ({ user }) => getBranches(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["branches"] },
		},
	)
	.post(
		"/",
		async ({ body, user }) =>
			createBranch(user as { id: string; role: string }, body as never),
		{
			body: createBranchSchema,
			auth: true,
			detail: { tags: ["branches"] },
		},
	)
	.put(
		"/:id",
		async ({ params, body, user }) =>
			updateBranch(
				user as { id: string; role: string },
				params.id,
				body as never,
			),
		{
			params: branchIdParams,
			body: updateBranchSchema,
			auth: true,
			detail: { tags: ["branches"] },
		},
	)
	.delete(
		"/:id",
		async ({ params, user }) =>
			deleteBranch(user as { id: string; role: string }, params.id),
		{
			params: branchIdParams,
			auth: true,
			detail: { tags: ["branches"] },
		},
	)
	.post(
		"/franchise",
		async ({ body, user }) =>
			assignFranchise(user as { id: string; role: string }, body as never),
		{
			body: assignFranchiseSchema,
			auth: true,
			detail: { tags: ["branches"] },
		},
	);
