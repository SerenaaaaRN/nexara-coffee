import type { CurrentUser } from "../access/index.js";
import { ROLES, type Role } from "../access/index.js";

export type SessionUser = {
	id: string;
	role?: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

export const toCurrentUser = (u: SessionUser): CurrentUser => ({
	id: u.id,
	role:
		typeof u.role === "string" && u.role in ROLES
			? (u.role as Role)
			: "visitor",
	name: u.name ?? undefined,
	email: u.email ?? null,
	image: u.image ?? null,
});

export const unauthorized = {
	success: false as const,
	error: "Unauthorized",
};

export const forbidden = {
	success: false as const,
	error: "Forbidden",
};
