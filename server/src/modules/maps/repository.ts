import { and, eq, ilike, isNotNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { containsPattern } from "../../lib/table.js";

const manager = alias(userTable, "manager");

export const mapRepo = {
	branches: async (q?: string) => {
		const located = and(isNotNull(branches.lat), isNotNull(branches.lng));

		const term = q?.trim();
		const search = term
			? or(
					ilike(branches.name, containsPattern(term)),
					ilike(branches.address, containsPattern(term)),
					ilike(manager.name, containsPattern(term)),
				)
			: undefined;

		return db
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
			.where(and(located, search))
			.orderBy(branches.name);
	},
};
