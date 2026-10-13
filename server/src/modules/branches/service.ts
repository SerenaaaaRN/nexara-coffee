import type { CurrentUser } from "../../access/index.js";
import { emptyScope, getAccessibleBranchIds } from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { logAudit } from "../../utils/effects.js";
import type {
	assignFranchiseSchema,
	createBranchSchema,
	getBranchesQuery,
	updateBranchSchema,
} from "./model.js";
import { branchRepo, type NewBranch } from "./repository.js";

export const getBranches = async (
	user: CurrentUser,
	params?: typeof getBranchesQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (emptyScope(ids)) {
		return ok([]);
	}

	const { rows, empCounts } = await branchRepo.list(ids, params?.q);

	return ok(
		rows.map((r) => ({
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
	);
};

export const createBranch = async (
	user: CurrentUser,
	data: typeof createBranchSchema.static,
) => {
	const payload: NewBranch = { ...data };
	const branch = await branchRepo.create(payload);
	if (!branch) return fail(500, "Failed to create branch");
	await branchRepo.createChannel(branch.id, branch.name);

	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "branches",
		targetId: branch.id,
		metadata: { name: branch.name },
	});

	return ok(branch);
};

export const updateBranch = async (
	user: CurrentUser,
	id: string,
	data: typeof updateBranchSchema.static,
) => {
	const branch = await branchRepo.update(id, { ...data });
	if (!branch) return fail(404, "Branch not found");

	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "branches",
		targetId: id,
		branchId: id,
		metadata: { ...data },
	});

	return ok(branch);
};

export const deleteBranch = async (user: CurrentUser, id: string) => {
	await branchRepo.remove(id);

	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "branches",
		targetId: id,
	});

	return ok(null);
};

export const assignFranchise = async (
	user: CurrentUser,
	data: typeof assignFranchiseSchema.static,
) => {
	const fb = await branchRepo.assignFranchise({
		userId: data.userId,
		branchId: data.branchId,
		commissionRate:
			data.commissionRate != null ? String(data.commissionRate) : "0",
	});
	if (!fb) return fail(500, "Failed to assign franchise");

	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "franchise_branches",
		targetId: fb.id,
		branchId: data.branchId,
		metadata: { userId: data.userId, commissionRate: data.commissionRate },
	});

	return ok(fb);
};
