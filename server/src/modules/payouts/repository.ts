import { and, asc, count, desc, eq, ilike, or, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { branchFilter } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { payouts } from "../../db/schema/finance.js";
import type { TableSortDir } from "../../lib/schema.js";
import { toSort } from "../../lib/sort.js";
import { containsPattern } from "../../lib/table.js";

const PAYOUT_SORT_COLUMNS = {
	createdAt: payouts.createdAt,
	amount: payouts.amount,
	status: payouts.status,
} as const;

export type PayoutListArgs = {
	ids: string[] | null;
	branchId?: string;
	status?: string;
	q?: string;
	sortBy?: string;
	sortDir: TableSortDir;
	page: number;
	pageSize: number;
};

export type NewPayout = typeof payouts.$inferInsert;

const franchiseOwner = alias(userTable, "franchise_owner");
const approvedByUser = alias(userTable, "approved_by");

const listColumns = {
	id: payouts.id,
	franchiseOwnerId: payouts.franchiseOwnerId,
	branchId: payouts.branchId,
	amount: payouts.amount,
	periodStart: payouts.periodStart,
	periodEnd: payouts.periodEnd,
	status: payouts.status,
	approvedBy: payouts.approvedBy,
	createdAt: payouts.createdAt,
	franchiseOwnerName: franchiseOwner.name,
	branchName: branches.name,
	approvedByName: approvedByUser.name,
};

export const payoutRepo = {
	list: async (args: PayoutListArgs) => {
		const branch = branchFilter(payouts, args.branchId ?? null, args.ids);
		const status = args.status ? eq(payouts.status, args.status) : undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(branches.name, containsPattern(term)),
					ilike(franchiseOwner.name, containsPattern(term)),
				)
			: undefined;

		const where = and(branch, status, search);
		const orderBy = toSort(
			PAYOUT_SORT_COLUMNS,
			args.sortBy,
			args.sortDir,
			args.sortDir === "asc" ? asc(payouts.createdAt) : desc(payouts.createdAt),
		);

		const [rows, [{ value: total }], statusGroups] = await Promise.all([
			db
				.select(listColumns)
				.from(payouts)
				.leftJoin(
					franchiseOwner,
					eq(payouts.franchiseOwnerId, franchiseOwner.id),
				)
				.leftJoin(branches, eq(payouts.branchId, branches.id))
				.leftJoin(approvedByUser, eq(payouts.approvedBy, approvedByUser.id))
				.where(where)
				.orderBy(orderBy)
				.limit(args.pageSize)
				.offset(args.page * args.pageSize),
			db
				.select({ value: count() })
				.from(payouts)
				.leftJoin(
					franchiseOwner,
					eq(payouts.franchiseOwnerId, franchiseOwner.id),
				)
				.leftJoin(branches, eq(payouts.branchId, branches.id))
				.where(where),
			db
				.select({
					status: payouts.status,
					value: count(),
					amount: sum(payouts.amount),
				})
				.from(payouts)
				.leftJoin(
					franchiseOwner,
					eq(payouts.franchiseOwnerId, franchiseOwner.id),
				)
				.leftJoin(branches, eq(payouts.branchId, branches.id))
				.where(where)
				.groupBy(payouts.status),
		]);

		return { rows, total, statusGroups };
	},

	create: async (payload: NewPayout) => {
		const [row] = await db.insert(payouts).values(payload).returning();
		return row ?? null;
	},

	approve: async (payoutId: string, approvedBy: string) => {
		const [row] = await db
			.update(payouts)
			.set({ status: "approved", approvedBy })
			.where(eq(payouts.id, payoutId))
			.returning();
		return row ?? null;
	},
};
