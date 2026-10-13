import { and, eq, ilike, isNotNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { ok } from "../../lib/http.js";
import { containsPattern } from "../../lib/table.js";
import type { mapBranchesQuery } from "./model.js";

export const getMapBranches = async (
	params?: typeof mapBranchesQuery.static,
) => {
	const manager = alias(userTable, "manager");
	const conditions = [and(isNotNull(branches.lat), isNotNull(branches.lng))];
	const term = params?.q?.trim();
	if (term) {
		const pattern = containsPattern(term);
		conditions.push(
			or(
				ilike(branches.name, pattern),
				ilike(branches.address, pattern),
				ilike(manager.name, pattern),
			),
		);
	}
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
			managerName: manager.name,
		})
		.from(branches)
		.leftJoin(manager, eq(branches.managerId, manager.id))
		.where(and(...conditions))
		.orderBy(branches.name);
	return ok(rows);
};
