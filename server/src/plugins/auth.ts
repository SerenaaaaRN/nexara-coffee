import { Elysia } from "elysia";
import type { CurrentUser } from "../access/index.js";
import { type Action, can, type Resource, type Role } from "../access/index.js";
import { auth } from "../lib/auth.js";

export const betterAuth = new Elysia({ name: "auth" })
	.mount(auth.handler)
	.macro({
		auth: {
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session)
					return status(401, {
						success: false as const,
						error: "Unauthorized",
					});
				return {
					user: session.user as unknown as CurrentUser,
					session: session.session,
				};
			},
		},
		requireRole: ([resource, action]: [Resource, Action]) => ({
			seed: `${resource}:${action}`,
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session)
					return status(401, {
						success: false as const,
						error: "Unauthorized",
					});
				if (!can(session.user.role as Role, action, resource))
					return status(403, {
						success: false as const,
						error: "Forbidden",
					});
				return {
					user: session.user as unknown as CurrentUser,
					session: session.session,
				};
			},
		}),
	});

export const authPlugin = betterAuth;
export type AuthPlugin = typeof betterAuth;
