import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { idParams } from "../../lib/schema.js";
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
	.model({
		"settings.profile": profileBody,
		"settings.role": changeRoleBody,
		"settings.avatar": avatarBody,
		"settings.userParams": idParams,
	})
	.get("/users", async ({ user }) => getUsers(user), {
		requireRole: ["users", "read"],
		detail: { tags: ["settings"] },
	})
	.post("/profile", async ({ body, user }) => updateProfile(user, body), {
		body: "settings.profile",
		requireRole: ["users", "update"],
		detail: { tags: ["settings"] },
	})
	.post(
		"/users/:id/role",
		async ({ params, body, user }) =>
			changeUserRole(user, { userId: params.id, role: body.role }),
		{
			params: "settings.userParams",
			body: "settings.role",
			requireRole: ["users", "manage"],
			detail: { tags: ["settings"] },
		},
	)
	.post("/avatar", async ({ body, user }) => uploadAvatar(user, body.base64), {
		body: "settings.avatar",
		requireRole: ["users", "update"],
		detail: { tags: ["settings"] },
	})
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
