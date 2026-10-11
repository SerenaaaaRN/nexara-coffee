import { eq, inArray, notInArray, sql } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { getAccessibleBranchIds } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { employeeDetails } from "../../db/schema/employee.js";
import { fail, ok } from "../../lib/http.js";
import { checkRate, logAudit } from "../../utils/effects.js";

export const getEmployees = async (user: CurrentUser) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const condition = ids
		? ids.length > 0
			? inArray(employeeDetails.branchId, ids)
			: sql`1=0`
		: undefined;
	const rows = await db
		.select({
			id: employeeDetails.id,
			userId: employeeDetails.userId,
			branchId: employeeDetails.branchId,
			baseSalary: employeeDetails.baseSalary,
			hireDate: employeeDetails.hireDate,
			createdAt: employeeDetails.createdAt,
			userName: userTable.name,
			userEmail: userTable.email,
			userRole: userTable.role,
			branchName: branches.name,
		})
		.from(employeeDetails)
		.leftJoin(userTable, eq(employeeDetails.userId, userTable.id))
		.leftJoin(branches, eq(employeeDetails.branchId, branches.id))
		.where(condition);
	return ok(rows);
};

export const getAvailableUsers = async () => {
	const existing = await db
		.select({ userId: employeeDetails.userId })
		.from(employeeDetails);
	const ids = existing.map((e) => e.userId);
	const rows = await db
		.select({
			id: userTable.id,
			name: userTable.name,
			email: userTable.email,
			role: userTable.role,
		})
		.from(userTable)
		.where(ids.length > 0 ? notInArray(userTable.id, ids) : undefined);
	return ok(rows);
};

export const getBranchesForEmployee = async () => {
	const rows = await db
		.select({ id: branches.id, name: branches.name })
		.from(branches)
		.orderBy(branches.name);
	return ok(rows);
};

export const createEmployee = async (
	user: CurrentUser,
	data: {
		userId: string;
		branchId: string;
		baseSalary: number;
		hireDate: string;
	},
) => {
	const limited = checkRate(`employee:create:${user.id}`, 20, 60_000);
	if (limited) return limited;
	const [existing] = await db
		.select({ id: employeeDetails.id })
		.from(employeeDetails)
		.where(eq(employeeDetails.userId, data.userId))
		.limit(1);
	if (existing) return fail(409, "User already assigned to a branch");
	const [row] = await db
		.insert(employeeDetails)
		.values({
			userId: data.userId,
			branchId: data.branchId,
			baseSalary: String(data.baseSalary),
			hireDate: data.hireDate,
		} as never)
		.returning();
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
	data: { branchId?: string; baseSalary?: number; hireDate?: string },
) => {
	const limited = checkRate(`employee:update:${user.id}`, 30, 60_000);
	if (limited) return limited;
	const updates: Record<string, unknown> = {};
	if (data.branchId !== undefined) updates.branchId = data.branchId;
	if (data.baseSalary !== undefined)
		updates.baseSalary = String(data.baseSalary);
	if (data.hireDate !== undefined) updates.hireDate = data.hireDate;
	const [row] = await db
		.update(employeeDetails)
		.set(updates as never)
		.where(eq(employeeDetails.id, id))
		.returning();
	if (!row) return fail(404, "Employee not found");
	void logAudit({
		actorId: user.id,
		action: "update",
		targetTable: "employee_details",
		targetId: id,
		branchId: row.branchId,
		metadata: updates,
	});
	return ok(row);
};

export const deleteEmployee = async (user: CurrentUser, id: string) => {
	const limited = checkRate(`employee:delete:${user.id}`, 10, 60_000);
	if (limited) return limited;
	const [existing] = await db
		.select({ branchId: employeeDetails.branchId })
		.from(employeeDetails)
		.where(eq(employeeDetails.id, id))
		.limit(1);
	await db.delete(employeeDetails).where(eq(employeeDetails.id, id));
	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "employee_details",
		targetId: id,
		branchId: existing?.branchId,
	});
	return ok(null);
};
