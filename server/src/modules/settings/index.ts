import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import {
	avatarBody,
	changeRoleBody,
	dashboardMetaResponse,
	profileBody,
} from "./model.js";
import {
	changeUserRole,
	getDashboardMeta,
	getUsers,
	removeAvatar,
	updateProfile,
	uploadAvatar,
} from "./service.js";

export const settings = new Elysia({ prefix: "/settings" })
	.use(betterAuth)
	.get(
		"/users",
		async ({ user }) => getUsers(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["settings"] },
		},
	)
	.post(
		"/profile",
		async ({ body, user }) =>
			updateProfile(user as { id: string; role: string }, body as never),
		{
			body: profileBody,
			auth: true,
			detail: { tags: ["settings"] },
		},
	)
	.post(
		"/users/:id/role",
		async ({ params, body, user }) =>
			changeUserRole(user as { id: string; role: string }, {
				userId: params.id,
				role: (body as { role: string }).role,
			}),
		{
			body: changeRoleBody,
			auth: true,
			detail: { tags: ["settings"] },
		},
	)
	.post(
		"/avatar",
		async ({ body, user }) =>
			uploadAvatar(
				user as { id: string; role: string },
				(body as { base64: string }).base64,
			),
		{
			body: avatarBody,
			auth: true,
			detail: { tags: ["settings"] },
		},
	)
	.delete(
		"/avatar",
		async ({ user }) => removeAvatar(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["settings"] },
		},
	);

export const dashboardMeta = new Elysia()
	.use(betterAuth)
	.get(
		"/dashboard/meta",
		async ({ user }) => getDashboardMeta(user as { id: string; role: string }),
		{
			auth: true,
			response: { 200: dashboardMetaResponse },
			detail: { tags: ["dashboard"] },
		},
	);
