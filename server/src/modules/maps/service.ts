import { and, eq, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { ok } from "../../lib/http.js";

export const getMapBranches = async () => {
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
			managerName: manager.name,
		})
		.from(branches)
		.leftJoin(manager, eq(branches.managerId, manager.id))
		.where(and(isNotNull(branches.lat), isNotNull(branches.lng)))
		.orderBy(branches.name);
	return ok(rows);
};
