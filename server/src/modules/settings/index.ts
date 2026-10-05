import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
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
	.use(authPlugin)
	.get("/users", async ({ user }) => getUsers(user), {
		requireRole: ["users", "read"],
		detail: { tags: ["settings"] },
	})
	.post("/profile", async ({ body, user }) => updateProfile(user, body as never), {
		body: profileBody,
		requireRole: ["users", "update"],
		detail: { tags: ["settings"] },
	})
	.post(
		"/users/:id/role",
		async ({ params, body, user }) =>
			changeUserRole(user, {
				userId: params.id,
				role: (body as { role: string }).role,
			}),
		{
			body: changeRoleBody,
			requireRole: ["users", "manage"],
			detail: { tags: ["settings"] },
		},
	)
	.post(
		"/avatar",
		async ({ body, user }) => uploadAvatar(user, (body as { base64: string }).base64),
		{
			body: avatarBody,
			requireRole: ["users", "update"],
			detail: { tags: ["settings"] },
		},
	)
	.delete("/avatar", async ({ user }) => removeAvatar(user), {
		requireRole: ["users", "update"],
		detail: { tags: ["settings"] },
	});

export const dashboardMeta = new Elysia()
	.use(authPlugin)
	.get("/dashboard/meta", async ({ user }) => getDashboardMeta(user), {
		auth: true,
		response: { 200: dashboardMetaResponse },
		detail: { tags: ["dashboard"] },
	});
