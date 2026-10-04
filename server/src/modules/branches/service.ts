import { asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches, franchiseBranches } from "../../db/schema/branches.js";
import { chatChannels } from "../../db/schema/collaboration.js";
import { employeeDetails } from "../../db/schema/employee.js";
import { logAudit } from "../../lib/audit-log.js";
import { can, type Role } from "../../lib/rbac.js";
import { getAccessibleBranchIds } from "../../utils/branch-scope.js";

export const getBranches = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "branches")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

	// Parity coffee getBranchesFn: filter branch-scope + join manager + employeeCount.
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && ids.length === 0) {
		return { success: true as const, data: [] };
	}

	const manager = alias(userTable, "manager");
	const rows = await db
		.select({
			id: branches.id,
			name: branches.name,
			address: branches.address,
			lat: branches.lat,
			lng: branches.lng,
			phone: branches.phone,
			openingTime: branches.openingTime,
			closingTime: branches.closingTime,
			status: branches.status,
			ownershipType: branches.ownershipType,
			managerId: branches.managerId,
			createdAt: branches.createdAt,
			updatedAt: branches.updatedAt,
			managerIdJoined: manager.id,
			managerName: manager.name,
			managerEmail: manager.email,
		})
		.from(branches)
		.leftJoin(manager, eq(branches.managerId, manager.id))
		.where(ids !== null ? inArray(branches.id, ids) : undefined)
		.orderBy(asc(branches.name));

	const branchIds = rows.map((r) => r.id);
	const empCounts = new Map<string, number>();
	if (branchIds.length > 0) {
		const empRows = await db
			.select({ branchId: employeeDetails.branchId })
			.from(employeeDetails)
			.where(inArray(employeeDetails.branchId, branchIds));
		for (const e of empRows) {
			if (e.branchId)
				empCounts.set(e.branchId, (empCounts.get(e.branchId) ?? 0) + 1);
		}
	}

	return {
		success: true as const,
		data: rows.map((r) => ({
			id: r.id,
			name: r.name,
			address: r.address,
			lat: r.lat,
			lng: r.lng,
			phone: r.phone,
			openingTime: r.openingTime,
			closingTime: r.closingTime,
			status: r.status,
			ownershipType: r.ownershipType,
			managerId: r.managerId,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
			manager: r.managerIdJoined
				? { id: r.managerIdJoined, name: r.managerName, email: r.managerEmail }
				: null,
			employeeCount: empCounts.get(r.id) ?? 0,
		})),
	};
};

export const createBranch = async (
	user: { id: string; role: string },
	data: Record<string, unknown>,
) => {
	if (!can(user.role as Role, "create", "branches")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const [branch] = await db
		.insert(branches)
		.values(data as never)
		.returning();
	await db
		.insert(chatChannels)
		.values({ type: "branch", branchId: branch.id, name: branch.name });
	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "branches",
		targetId: branch.id,
		metadata: { name: (branch as { name: string }).name },
	});
	return { success: true as const, data: branch };
};

export const updateBranch = async (
	user: { id: string; role: string },
	id: string,
	data: Record<string, unknown>,
) => {
	if (!can(user.role as Role, "update", "branches")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const [branch] = await db
		.update(branches)
		.set(data as never)
		.where(eq(branches.id, id))
		.returning();
	if (!branch)
		return status(404, { success: false as const, error: "Branch not found" });
	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "branches",
		targetId: id,
		branchId: id,
		metadata: data as Record<string, unknown>,
	});
	return { success: true as const, data: branch };
};

export const deleteBranch = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "delete", "branches")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	await db.delete(branches).where(eq(branches.id, id));
	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "branches",
		targetId: id,
	});
	return { success: true as const, data: null };
};

export const assignFranchise = async (
	user: { id: string; role: string },
	data: { userId: string; branchId: string; commissionRate?: number },
) => {
	if (!can(user.role as Role, "update", "branches")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const [fb] = await db
		.insert(franchiseBranches)
		.values({
			userId: data.userId,
			branchId: data.branchId,
			commissionRate:
				data.commissionRate != null ? String(data.commissionRate) : "0",
		})
		.returning();
	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "franchise_branches",
		targetId: fb.id,
		branchId: data.branchId,
		metadata: { userId: data.userId, commissionRate: data.commissionRate },
	});
	return { success: true as const, data: fb };
};
