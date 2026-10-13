import type { CurrentUser } from "../../access/index.js";
import { assertBranchAccess, emptyScope, getAccessibleBranchIds } from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { checkRate, logAudit } from "../../utils/effects.js";
import type {
	createEmployeeBody,
	getEmployeesQuery,
	updateEmployeeBody,
} from "./model.js";
import { employeeRepo, type NewEmployee } from "./repository.js";

const emptySummary = { total: 0, branchCount: 0, totalSalary: "0" };

export const getEmployees = async (
	user: CurrentUser,
	params: typeof getEmployeesQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);
	const emptyPage = {
		...pageResult([], 0, page, pageSize),
		summary: emptySummary,
	};

	if (emptyScope(ids)) {
		return ok(emptyPage);
	}

	const result = await employeeRepo.list({
		ids,
		branchId: params.branchId,
		role: params.role,
		q: params.q,
		sortBy: params.sortBy,
		sortDir,
		page,
		pageSize,
	});

	return ok({
		...pageResult(
			result.rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			result.total,
			page,
			pageSize,
		),
		summary: {
			total: result.total,
			branchCount: result.branchTotal,
			totalSalary: String(result.salaryTotal ?? 0),
		},
	});
};

export const getAvailableUsers = async () => {
	return ok(await employeeRepo.availableUsers());
};

export const getBranchesForEmployee = async () => {
	return ok(await employeeRepo.branches());
};

export const createEmployee = async (
	user: CurrentUser,
	data: typeof createEmployeeBody.static,
) => {
	const limited = checkRate(`employee:create:${user.id}`, 20, 60_000);
	if (limited) return limited;

	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, data.branchId);
	if (denied) return denied;

	const existing = await employeeRepo.findByUserId(data.userId);
	if (existing) return fail(409, "User already assigned to a branch");

	const payload: NewEmployee = {
		userId: data.userId,
		branchId: data.branchId,
		baseSalary: String(data.baseSalary),
		hireDate: data.hireDate,
	};

	const row = await employeeRepo.create(payload);
	if (!row) return fail(500, "Failed to create employee");

	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "employee_details",
		targetId: row.id,
		branchId: row.branchId,
	});

	return ok(row);
};

export const updateEmployee = async (
	user: CurrentUser,
	id: string,
	data: typeof updateEmployeeBody.static,
) => {
	const limited = checkRate(`employee:update:${user.id}`, 30, 60_000);
	if (limited) return limited;

	const existing = await employeeRepo.findById(id);
	if (!existing) return fail(404, "Employee not found");

	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;

	const patch: Partial<NewEmployee> = {};
	if (data.branchId !== undefined) {
		const branchDenied = assertBranchAccess(ids, data.branchId);
		if (branchDenied) return branchDenied;
		patch.branchId = data.branchId;
	}
	if (data.baseSalary !== undefined)
		patch.baseSalary = String(data.baseSalary);
	if (data.hireDate !== undefined) patch.hireDate = data.hireDate;

	const row = await employeeRepo.update(id, patch);
	if (!row) return fail(404, "Employee not found");

	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "employee_details",
		targetId: id,
		branchId: row.branchId,
		metadata: patch,
	});

	return ok(row);
};

export const deleteEmployee = async (user: CurrentUser, id: string) => {
	const limited = checkRate(`employee:delete:${user.id}`, 10, 60_000);
	if (limited) return limited;

	const existing = await employeeRepo.findById(id);
	if (!existing) return fail(404, "Employee not found");

	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;

	await employeeRepo.remove(id);

	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "employee_details",
		targetId: id,
		branchId: existing.branchId,
	});

	return ok(null);
};
