import { eq, inArray, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { logAudit } from "../../utils/effects.js";
import type { CurrentUser } from "../../access/index.js";
import { uploadImageBase64 } from "../../infra/images.js";
import {
	ACTIONS,
	type Action,
	can,
	NAV_GUARDS,
	RESOURCES,
	type Resource,
	ROLES,
	type Role,
} from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { getAccessibleBranchIds } from "../../access/index.js";
import { checkRate } from "../../utils/effects.js";

export const getUsers = async (user: CurrentUser) => {
	const myLevel = (ROLES as Record<string, number>)[user.role] ?? 999;
	const rows = await db
		.select({
			id: userTable.id,
			name: userTable.name,
			email: userTable.email,
			role: userTable.role,
			image: userTable.image,
			createdAt: userTable.createdAt,
		})
		.from(userTable)
		.where(ne(userTable.id, user.id))
		.orderBy(userTable.name);
	return ok(
		rows.filter(
			(r) => ((ROLES as Record<string, number>)[r.role] ?? 999) > myLevel,
		),
	);
};

export const updateProfile = async (
	user: CurrentUser,
	data: { name: string },
) => {
	const limited = checkRate(`settings-profile:${user.id}`, 20, 60_000);
	if (limited) return limited;
	const [updated] = await db
		.update(userTable)
		.set({ name: data.name } as never)
		.where(eq(userTable.id, user.id))
		.returning();
	return ok(updated);
};

export const changeUserRole = async (
	user: CurrentUser,
	data: { userId: string; role: string },
) => {
	if (
		user.role === "branch_manager" &&
		!["cashier", "barista"].includes(data.role)
	) {
		return fail(
			403,
			"Branch managers can only assign cashier or barista roles",
		);
	}
	const limited = checkRate(`settings-role:${user.id}`, 10, 60_000);
	if (limited) return limited;
	const [targetUser] = await db
		.select({ id: userTable.id, role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, data.userId))
		.limit(1);
	if (!targetUser) return fail(404, "User not found");
	const myLevel = (ROLES as Record<string, number>)[user.role] ?? 999;
	const targetLevel = (ROLES as Record<string, number>)[targetUser.role] ?? 999;
	if (targetLevel <= myLevel)
		return fail(
			403,
			"You cannot change the role of users with the same or higher level",
		);
	const [updated] = await db
		.update(userTable)
		.set({ role: data.role } as never)
		.where(eq(userTable.id, data.userId))
		.returning();
	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "users",
		targetId: data.userId,
		metadata: { fromRole: targetUser.role, toRole: data.role },
	});
	return ok(updated);
};

export const uploadAvatar = async (user: CurrentUser, base64: string) => {
	const limited = checkRate(`settings-avatar:${user.id}`, 5, 60_000);
	if (limited) return limited;
	const result = await uploadImageBase64(base64, "nexara/avatars");
	if (!result) return fail(500, "Gagal upload gambar");
	await db
		.update(userTable)
		.set({ image: result.url } as never)
		.where(eq(userTable.id, user.id));
	return ok({ url: result.url });
};

export const removeAvatar = async (user: CurrentUser) => {
	const limited = checkRate(`settings-avatar:${user.id}`, 5, 60_000);
	if (limited) return limited;
	await db
		.update(userTable)
		.set({ image: null } as never)
		.where(eq(userTable.id, user.id));
	return ok(null);
};

export const getDashboardMeta = async (user: CurrentUser) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const isSuperAdmin = user.role === "super_admin";
	const branchList =
		ids === null
			? await db
					.select({ id: branches.id, name: branches.name })
					.from(branches)
					.orderBy(branches.name)
			: ids.length > 0
				? await db
						.select({ id: branches.id, name: branches.name })
						.from(branches)
						.where(inArray(branches.id, ids))
						.orderBy(branches.name)
				: [];
	const defaultBranchId = ids === null ? null : (branchList[0]?.id ?? null);
	const role = user.role as Role;
	const abilities = Object.fromEntries(
		RESOURCES.map((r) => [r, ACTIONS.filter((a) => can(role, a, r))] as const),
	) as Record<Resource, Action[]>;
	const defaultRoute = (can(role, "read", "reports") ? "/overview" : "/my") as
		| "/overview"
		| "/my";
	const myLevel = (ROLES as Record<string, number>)[user.role] ?? 999;
	const roles = (Object.keys(ROLES) as Role[]).map((value) => ({
		value,
		label: value
			.split("_")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" "),
		level: ROLES[value],
	}));
	const assignableRoles =
		role === "branch_manager"
			? (["cashier", "barista"] as Role[])
			: (Object.keys(ROLES) as Role[]).filter(
					(r) => ((ROLES as Record<string, number>)[r] ?? 999) > myLevel,
				);
	return ok({
		isSuperAdmin,
		branchList,
		defaultBranchId,
		abilities,
		defaultRoute,
		navGuards: NAV_GUARDS,
		roles,
		assignableRoles,
	});
};
