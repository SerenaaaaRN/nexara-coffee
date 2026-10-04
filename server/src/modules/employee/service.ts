import { eq, inArray, notInArray, sql } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { employeeDetails } from "../../db/schema/employee.js";
import { can, type Role } from "../../lib/rbac.js";
import { getAccessibleBranchIds } from "../../utils/branch-scope.js";

export const getEmployees = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "employee"))
		return status(403, { success: false as const, error: "Forbidden" });
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
	return { success: true as const, data: rows };
};

export const getAvailableUsers = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "employee"))
		return status(403, { success: false as const, error: "Forbidden" });
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
	return { success: true as const, data: rows };
};

export const getBranchesForEmployee = async (user: {
	id: string;
	role: string;
}) => {
	if (!can(user.role as Role, "read", "employee"))
		return status(403, { success: false as const, error: "Forbidden" });
	const rows = await db
		.select({ id: branches.id, name: branches.name })
		.from(branches)
		.orderBy(branches.name);
	return { success: true as const, data: rows };
};

export const createEmployee = async (
	user: { id: string; role: string },
	data: {
		userId: string;
		branchId: string;
		baseSalary: number;
		hireDate: string;
	},
) => {
	if (!can(user.role as Role, "create", "employee"))
		return status(403, { success: false as const, error: "Forbidden" });
	const [row] = await db
		.insert(employeeDetails)
		.values({
			userId: data.userId,
			branchId: data.branchId,
			baseSalary: String(data.baseSalary),
			hireDate: data.hireDate,
		} as never)
		.returning();
	return { success: true as const, data: row };
};

export const updateEmployee = async (
	user: { id: string; role: string },
	id: string,
	data: { branchId?: string; baseSalary?: number; hireDate?: string },
) => {
	if (!can(user.role as Role, "update", "employee"))
		return status(403, { success: false as const, error: "Forbidden" });
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
	if (!row)
		return status(404, {
			success: false as const,
			error: "Employee not found",
		});
	return { success: true as const, data: row };
};

export const deleteEmployee = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "delete", "employee"))
		return status(403, { success: false as const, error: "Forbidden" });
	await db.delete(employeeDetails).where(eq(employeeDetails.id, id));
	return { success: true as const, data: null };
};
