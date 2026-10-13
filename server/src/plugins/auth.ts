import { Elysia } from "elysia";
import { type Action, can, type Resource } from "../access/index.js";
import { auth } from "../lib/auth.js";
import {
	forbidden,
	type SessionUser,
	toCurrentUser,
	unauthorized,
} from "./session-user.js";

export const betterAuth = new Elysia({ name: "auth" })
	.mount(auth.handler)
	.macro({
		auth: {
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session) return status(401, unauthorized);
				return {
					user: toCurrentUser(session.user as SessionUser),
					session: session.session,
				};
			},
		},
		requireRole: ([resource, action]: [Resource, Action]) => ({
			seed: `${resource}:${action}`,
			async resolve({ status, request: { headers } }) {
				const session = await auth.api.getSession({ headers });
				if (!session) return status(401, unauthorized);
				const user = toCurrentUser(session.user as SessionUser);
				if (!can(user.role, action, resource)) return status(403, forbidden);
				return { user, session: session.session };
			},
		}),
	});

export const authPlugin = betterAuth;
export type AuthPlugin = typeof betterAuth;
