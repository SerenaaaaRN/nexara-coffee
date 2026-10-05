import type { Role } from "./rbac.js";

export type CurrentUser = {
	id: string;
	role: Role;
	name?: string;
	email?: string | null;
};
