import { and, asc, count, desc, eq, gte, ilike, lt, or, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { branchFilter } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { transactions } from "../../db/schema/finance.js";
import { dailySetorans } from "../../db/schema/orders.js";
import type { TableSortDir } from "../../lib/schema.js";
import { toSort } from "../../lib/sort.js";
import { containsPattern } from "../../lib/table.js";

const SETORAN_SORT_COLUMNS = {
	createdAt: dailySetorans.createdAt,
	date: dailySetorans.date,
	amount: dailySetorans.amount,
	status: dailySetorans.status,
} as const;

export type SetoranListArgs = {
	ids: string[] | null;
	branch?: string;
	status?: string;
	q?: string;
	sortBy?: string;
	sortDir: TableSortDir;
	page: number;
	pageSize: number;
};

export type NewSetoran = typeof dailySetorans.$inferInsert;

const cashierUser = alias(userTable, "cashier");
const verifierUser = alias(userTable, "verifier");

const listColumns = {
	id: dailySetorans.id,
	branchId: dailySetorans.branchId,
	cashierId: dailySetorans.cashierId,
	amount: dailySetorans.amount,
	date: dailySetorans.date,
	status: dailySetorans.status,
	createdAt: dailySetorans.createdAt,
	branchName: branches.name,
	cashierName: cashierUser.name,
	verifiedByName: verifierUser.name,
};

export const kasirRepo = {
	dailyTotals: async (branchId: string, startDate: Date, endDate: Date) => {
		return db
			.select({
				paymentMethod: transactions.paymentMethod,
				total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.branchId, branchId),
					gte(transactions.createdAt, startDate),
					lt(transactions.createdAt, endDate),
				),
			)
			.groupBy(transactions.paymentMethod);
	},

	list: async (args: SetoranListArgs) => {
		const branch = branchFilter(dailySetorans, args.branch ?? null, args.ids);
		const status = args.status ? eq(dailySetorans.status, args.status) : undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(branches.name, containsPattern(term)),
					ilike(cashierUser.name, containsPattern(term)),
				)
			: undefined;

		const where = and(branch, status, search);
		const orderBy = toSort(
			SETORAN_SORT_COLUMNS,
			args.sortBy,
			args.sortDir,
			args.sortDir === "asc"
				? asc(dailySetorans.createdAt)
				: desc(dailySetorans.createdAt),
		);

		const [rows, [{ value: total }], statusGroups] = await Promise.all([
			db
				.select(listColumns)
				.from(dailySetorans)
				.leftJoin(branches, eq(dailySetorans.branchId, branches.id))
				.leftJoin(cashierUser, eq(dailySetorans.cashierId, cashierUser.id))
				.leftJoin(verifierUser, eq(dailySetorans.verifiedBy, verifierUser.id))
				.where(where)
				.orderBy(orderBy)
				.limit(args.pageSize)
				.offset(args.page * args.pageSize),
			db
				.select({ value: count() })
				.from(dailySetorans)
				.leftJoin(branches, eq(dailySetorans.branchId, branches.id))
				.leftJoin(cashierUser, eq(dailySetorans.cashierId, cashierUser.id))
				.where(where),
			db
				.select({
					status: dailySetorans.status,
					value: count(),
					amount: sum(dailySetorans.amount),
				})
				.from(dailySetorans)
				.leftJoin(branches, eq(dailySetorans.branchId, branches.id))
				.leftJoin(cashierUser, eq(dailySetorans.cashierId, cashierUser.id))
				.where(where)
				.groupBy(dailySetorans.status),
		]);

		return { rows, total, statusGroups };
	},

	findByBranchDate: async (branchId: string, date: string) => {
		return db
			.select()
			.from(dailySetorans)
			.where(
				and(eq(dailySetorans.branchId, branchId), eq(dailySetorans.date, date)),
			)
			.limit(1);
	},

	findById: async (id: string) => {
		const [row] = await db
			.select()
			.from(dailySetorans)
			.where(eq(dailySetorans.id, id));
		return row ?? null;
	},

	findStatus: async (id: string) => {
		const [row] = await db
			.select({ branchId: dailySetorans.branchId, status: dailySetorans.status })
			.from(dailySetorans)
			.where(eq(dailySetorans.id, id));
		return row ?? null;
	},

	create: async (payload: NewSetoran) => {
		const [row] = await db.insert(dailySetorans).values(payload).returning();
		return row ?? null;
	},

	updateAmount: async (
		id: string,
		patch: { amount: string; cashierId: string; notes: string | null },
	) => {
		const [row] = await db
			.update(dailySetorans)
			.set(patch)
			.where(eq(dailySetorans.id, id))
			.returning();
		return row ?? null;
	},

	setDecision: async (
		id: string,
		patch: { status: "approved" | "rejected"; verifiedBy: string; notes?: string },
	) => {
		const [row] = await db
			.update(dailySetorans)
			.set(patch)
			.where(and(eq(dailySetorans.id, id), eq(dailySetorans.status, "pending")))
			.returning();
		return row ?? null;
	},

	remove: async (id: string) => {
		await db.delete(dailySetorans).where(eq(dailySetorans.id, id));
	},
};
