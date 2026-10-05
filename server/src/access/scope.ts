import { eq, inArray, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { branches, franchiseBranches } from "../db/schema/branches.js";
import { customers } from "../db/schema/customers.js";
import { employeeDetails } from "../db/schema/employee.js";
import { orders } from "../db/schema/orders.js";
import { fail } from "../lib/http.js";

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
	switch (role) {
		case "super_admin":
			return null;

		case "branch_manager": {
			const rows = await db
				.select({ id: branches.id })
				.from(branches)
				.where(eq(branches.managerId, userId));
			return rows.map((r) => r.id);
		}

		case "franchise_owner": {
			const rows = await db
				.select({ branchId: franchiseBranches.branchId })
				.from(franchiseBranches)
				.where(eq(franchiseBranches.userId, userId));
			return rows.map((r) => r.branchId);
		}

		case "cashier":
		case "barista": {
			const rows = await db
				.select({ branchId: employeeDetails.branchId })
				.from(employeeDetails)
				.where(eq(employeeDetails.userId, userId));
			return rows.map((r) => r.branchId);
		}

		default:
			return [];
	}
}

export const emptyScope = (ids: string[] | null) =>
	ids !== null && ids.length === 0;

export const assertBranchAccess = (ids: string[] | null, branchId: string) => {
	if (ids !== null && !ids.includes(branchId)) {
		return fail(403, "Forbidden branch access");
	}
	return null;
};

const getOwnedCustomerIds = async (uid: string) => {
	const rows = await db
		.select({ id: customers.id })
		.from(customers)
		.where(eq(customers.userId, uid));
	return rows.map((r) => r.id);
};

export const resolveMyScope = async (uid: string) => {
	const ownedIds = await getOwnedCustomerIds(uid);
	const scope =
		ownedIds.length > 0
			? or(eq(orders.createdBy, uid), inArray(orders.customerId, ownedIds))
			: eq(orders.createdBy, uid);
	return { ownedIds, scope };
};
