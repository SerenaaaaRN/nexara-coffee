import type { CurrentUser } from "../../access/index.js";
import {
	ACTIONS,
	type Action,
	can,
	getAccessibleBranchIds,
	NAV_GUARDS,
	RESOURCES,
	type Resource,
	ROLES,
	type Role,
} from "../../access/index.js";
import { uploadImageBase64 } from "../../infra/images.js";
import { fail, ok } from "../../lib/http.js";
import { checkRate, logAudit } from "../../utils/effects.js";
import { settingsRepo } from "./repository.js";

const roleLevel = (role: string) =>
	(ROLES as Record<string, number>)[role] ?? 999;

export const getUsers = async (user: CurrentUser) => {
	const myLevel = roleLevel(user.role);
	const rows = await settingsRepo.otherUsers(user.id);

	return ok(rows.filter((r) => roleLevel(r.role) > myLevel));
};

export const updateProfile = async (
	user: CurrentUser,
	data: { name: string },
) => {
	const limited = checkRate(`settings-profile:${user.id}`, 20, 60_000);
	if (limited) return limited;

	const updated = await settingsRepo.setProfile(user.id, data.name);

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

	const targetUser = await settingsRepo.findRole(data.userId);
	if (!targetUser) return fail(404, "User not found");

	const myLevel = roleLevel(user.role);
	if (roleLevel(targetUser.role) <= myLevel)
		return fail(
			403,
			"You cannot change the role of users with the same or higher level",
		);

	const updated = await settingsRepo.setRole(data.userId, data.role);
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
	await settingsRepo.setAvatar(user.id, result.url);

	return ok({ url: result.url });
};

export const removeAvatar = async (user: CurrentUser) => {
	const limited = checkRate(`settings-avatar:${user.id}`, 5, 60_000);
	if (limited) return limited;

	await settingsRepo.setAvatar(user.id, null);

	return ok(null);
};

export const getDashboardMeta = async (user: CurrentUser) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const isSuperAdmin = user.role === "super_admin";
	const branchList =
		ids === null
			? await settingsRepo.allBranches()
			: ids.length > 0
				? await settingsRepo.scopedBranches(ids)
				: [];
	const defaultBranchId = ids === null ? null : (branchList[0]?.id ?? null);
	const role = user.role as Role;
	const abilities = Object.fromEntries(
		RESOURCES.map((r) => [r, ACTIONS.filter((a) => can(role, a, r))] as const),
	) as Record<Resource, Action[]>;
	const defaultRoute = (can(role, "read", "reports") ? "/overview" : "/my") as
		| "/overview"
		| "/my";
	const myLevel = roleLevel(user.role);
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
					(r) => roleLevel(r) > myLevel,
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
