import { eq, inArray, ne } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { logAudit } from "../../lib/audit-log.js";
import { uploadImageBase64 } from "../../lib/cloudinary.js";
import { rateLimit } from "../../lib/rate-limit.js";
import {
	ACTIONS,
	type Action,
	can,
	NAV_GUARDS,
	RESOURCES,
	type Resource,
	ROLES,
	type Role,
} from "../../lib/rbac.js";
import { getAccessibleBranchIds } from "../../utils/branch-scope.js";

export const getUsers = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "users"))
		return status(403, { success: false as const, error: "Forbidden" });
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
	return {
		success: true as const,
		data: rows.filter(
			(r) => ((ROLES as Record<string, number>)[r.role] ?? 999) > myLevel,
		),
	};
};

export const updateProfile = async (
	user: { id: string; role: string },
	data: { name: string },
) => {
	if (!can(user.role as Role, "update", "users"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`settings-profile:${user.id}`, 20, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
	const [updated] = await db
		.update(userTable)
		.set({ name: data.name } as never)
		.where(eq(userTable.id, user.id))
		.returning();
	return { success: true as const, data: updated };
};

export const changeUserRole = async (
	user: { id: string; role: string },
	data: { userId: string; role: string },
) => {
	if (!can(user.role as Role, "manage", "users"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (
		user.role === "branch_manager" &&
		!["cashier", "barista"].includes(data.role)
	) {
		return status(403, {
			success: false as const,
			error: "Branch managers can only assign cashier or barista roles",
		});
	}
	if (!rateLimit(`settings-role:${user.id}`, 10, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
	const [targetUser] = await db
		.select({ id: userTable.id, role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, data.userId))
		.limit(1);
	if (!targetUser)
		return status(404, { success: false as const, error: "User not found" });
	const myLevel = (ROLES as Record<string, number>)[user.role] ?? 999;
	const targetLevel = (ROLES as Record<string, number>)[targetUser.role] ?? 999;
	if (targetLevel <= myLevel)
		return status(403, {
			success: false as const,
			error:
				"You cannot change the role of users with the same or higher level",
		});
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
	return { success: true as const, data: updated };
};

export const uploadAvatar = async (
	user: { id: string; role: string },
	base64: string,
) => {
	if (!can(user.role as Role, "update", "users"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`settings-avatar:${user.id}`, 5, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
	const result = await uploadImageBase64(base64, "nexara/avatars");
	if (!result)
		return status(500, {
			success: false as const,
			error: "Gagal upload gambar",
		});
	await db
		.update(userTable)
		.set({ image: result.url } as never)
		.where(eq(userTable.id, user.id));
	return { success: true as const, data: { url: result.url } };
};

export const removeAvatar = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "update", "users"))
		return status(403, { success: false as const, error: "Forbidden" });
	if (!rateLimit(`settings-avatar:${user.id}`, 5, 60_000))
		return status(429, { success: false as const, error: "Too many requests" });
	await db
		.update(userTable)
		.set({ image: null } as never)
		.where(eq(userTable.id, user.id));
	return { success: true as const, data: null };
};

export const getDashboardMeta = async (user: { id: string; role: string }) => {
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
	return {
		success: true as const,
		data: {
			isSuperAdmin,
			branchList,
			defaultBranchId,
			abilities,
			defaultRoute,
			navGuards: NAV_GUARDS,
			roles,
			assignableRoles,
		},
	};
};
