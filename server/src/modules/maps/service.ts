import { and, eq, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { can, type Role } from "../../lib/rbac.js";

export const getMapBranches = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "maps"))
		return status(403, { success: false as const, error: "Forbidden" });
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
	return { success: true as const, data: rows };
};
