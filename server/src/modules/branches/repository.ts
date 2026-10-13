import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches, franchiseBranches } from "../../db/schema/branches.js";
import { chatChannels } from "../../db/schema/collaboration.js";
import { employeeDetails } from "../../db/schema/employee.js";
import { containsPattern } from "../../lib/table.js";

export type NewBranch = typeof branches.$inferInsert;
export type BranchPatch = Partial<typeof branches.$inferInsert>;
export type NewFranchiseBranch = typeof franchiseBranches.$inferInsert;

const manager = alias(userTable, "manager");

const listColumns = {
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
	managerId: branches.managerId,
	createdAt: branches.createdAt,
	updatedAt: branches.updatedAt,
	managerIdJoined: manager.id,
	managerName: manager.name,
	managerEmail: manager.email,
};

export const branchRepo = {
	list: async (ids: string[] | null, q?: string) => {
		const term = q?.trim();
		const search = term
			? or(
					ilike(branches.name, containsPattern(term)),
					ilike(branches.address, containsPattern(term)),
				)
			: undefined;
		const scope =
			ids !== null ? inArray(branches.id, ids) : undefined;

		const rows = await db
			.select(listColumns)
			.from(branches)
			.leftJoin(manager, eq(branches.managerId, manager.id))
			.where(and(search, scope))
			.orderBy(asc(branches.name));

		const branchIds = rows.map((r) => r.id);
		const empCounts = new Map<string, number>();
		if (branchIds.length > 0) {
			const empRows = await db
				.select({ branchId: employeeDetails.branchId })
				.from(employeeDetails)
				.where(inArray(employeeDetails.branchId, branchIds));
			for (const e of empRows) {
				if (e.branchId)
					empCounts.set(e.branchId, (empCounts.get(e.branchId) ?? 0) + 1);
			}
		}

		return { rows, empCounts };
	},

	create: async (payload: NewBranch) => {
		const [row] = await db.insert(branches).values(payload).returning();
		return row ?? null;
	},

	createChannel: async (branchId: string, name: string) => {
		await db
			.insert(chatChannels)
			.values({ type: "branch", branchId, name });
	},

	update: async (id: string, patch: BranchPatch) => {
		const [row] = await db
			.update(branches)
			.set(patch)
			.where(eq(branches.id, id))
			.returning();
		return row ?? null;
	},

	remove: async (id: string) => {
		await db.delete(branches).where(eq(branches.id, id));
	},

	assignFranchise: async (payload: NewFranchiseBranch) => {
		const [row] = await db
			.insert(franchiseBranches)
			.values(payload)
			.returning();
		return row ?? null;
	},
};
