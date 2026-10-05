import { eq, inArray, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers } from "../db/schema/customers.js";
import { orders } from "../db/schema/orders.js";
import { fail } from "../lib/response.js";
import { getAccessibleBranchIds } from "./branch-scope.js";

export const emptyScope = (ids: string[] | null) =>
	ids !== null && ids.length === 0;

export const assertBranchAccess = (
	ids: string[] | null,
	branchId: string,
) => {
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

export { getAccessibleBranchIds };
