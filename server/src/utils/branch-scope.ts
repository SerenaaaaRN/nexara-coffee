import { eq, inArray, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { branches, franchiseBranches } from "../db/schema/branches.js";
import { employeeDetails } from "../db/schema/employee.js";

export function branchFilter(
	col: { branchId: PgColumn },
	branchId: string | null,
	ids: string[] | null,
) {
	if (branchId) return eq(col.branchId, branchId);
	if (ids !== null)
		return ids.length > 0 ? inArray(col.branchId, ids) : sql`1=0`;
	return sql`1=1`;
}

export async function getAccessibleBranchIds(
	userId: string,
	role: string,
): Promise<string[] | null> {
	return resolveBranchScope(userId, role);
}

async function resolveBranchScope(
	userId: string,
	role: string,
): Promise<string[] | null> {
	// Parity nexara-coffee: hanya super_admin yang null (semua cabang).
	// visitor/unknown role jatuh ke [] (tidak ada akses cabang).
	if (role === "super_admin") {
		return null;
	}

	if (role === "branch_manager") {
		const rows = await db
			.select({ id: branches.id })
			.from(branches)
			.where(eq(branches.managerId, userId));
		return rows.map((r) => r.id);
	}

	if (role === "franchise_owner") {
		const rows = await db
			.select({ branchId: franchiseBranches.branchId })
			.from(franchiseBranches)
			.where(eq(franchiseBranches.userId, userId));
		return rows.map((r) => r.branchId);
	}

	if (role === "cashier" || role === "barista") {
		const rows = await db
			.select({ branchId: employeeDetails.branchId })
			.from(employeeDetails)
			.where(eq(employeeDetails.userId, userId));
		return rows.map((r) => r.branchId);
	}

	return [];
}
