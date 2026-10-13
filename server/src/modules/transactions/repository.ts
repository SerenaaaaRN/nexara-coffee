import { and, asc, count, desc, eq, gte, ilike, lte, or, sum } from "drizzle-orm";
import { branchFilter } from "../../access/index.js";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { transactions } from "../../db/schema/finance.js";
import { orders } from "../../db/schema/orders.js";
import type { TableSortDir } from "../../lib/schema.js";
import { toSort } from "../../lib/sort.js";
import { containsPattern } from "../../lib/table.js";

const TRANSACTION_SORT_COLUMNS = {
	createdAt: transactions.createdAt,
	amount: transactions.amount,
	status: transactions.status,
	paymentMethod: transactions.paymentMethod,
} as const;

export type TransactionListArgs = {
	ids: string[] | null;
	branchId?: string;
	paymentMethod?: string;
	status?: string;
	dateFrom?: string;
	dateTo?: string;
	q?: string;
	sortBy?: string;
	sortDir: TableSortDir;
	page: number;
	pageSize: number;
};

export type NewTransaction = typeof transactions.$inferInsert;

const listColumns = {
	id: transactions.id,
	orderId: transactions.orderId,
	branchId: transactions.branchId,
	paymentMethod: transactions.paymentMethod,
	amount: transactions.amount,
	status: transactions.status,
	createdAt: transactions.createdAt,
	orderNumber: orders.orderNumber,
	branchName: branches.name,
};

export const transactionRepo = {
	list: async (args: TransactionListArgs) => {
		const branch = branchFilter(transactions, args.branchId ?? null, args.ids);
		const method = args.paymentMethod
			? eq(transactions.paymentMethod, args.paymentMethod)
			: undefined;
		const status = args.status ? eq(transactions.status, args.status) : undefined;
		const from = args.dateFrom
			? gte(transactions.createdAt, new Date(args.dateFrom))
			: undefined;
		const to = args.dateTo
			? lte(transactions.createdAt, new Date(args.dateTo))
			: undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(orders.orderNumber, containsPattern(term)),
					ilike(branches.name, containsPattern(term)),
					ilike(transactions.paymentMethod, containsPattern(term)),
				)
			: undefined;

		const where = and(branch, method, status, from, to, search);
		const orderBy = toSort(
			TRANSACTION_SORT_COLUMNS,
			args.sortBy,
			args.sortDir,
			args.sortDir === "asc"
				? asc(transactions.createdAt)
				: desc(transactions.createdAt),
		);

		const [rows, [{ value: total }], statusGroups] = await Promise.all([
			db
				.select(listColumns)
				.from(transactions)
				.leftJoin(orders, eq(transactions.orderId, orders.id))
				.leftJoin(branches, eq(transactions.branchId, branches.id))
				.where(where)
				.orderBy(orderBy)
				.limit(args.pageSize)
				.offset(args.page * args.pageSize),
			db
				.select({ value: count() })
				.from(transactions)
				.leftJoin(orders, eq(transactions.orderId, orders.id))
				.leftJoin(branches, eq(transactions.branchId, branches.id))
				.where(where),
			db
				.select({
					status: transactions.status,
					value: count(),
					amount: sum(transactions.amount),
				})
				.from(transactions)
				.leftJoin(orders, eq(transactions.orderId, orders.id))
				.leftJoin(branches, eq(transactions.branchId, branches.id))
				.where(where)
				.groupBy(transactions.status),
		]);

		return { rows, total, statusGroups };
	},

	findById: async (id: string) => {
		const [row] = await db
			.select()
			.from(transactions)
			.where(eq(transactions.id, id))
			.limit(1);
		return row ?? null;
	},

	findDetail: async (id: string) => {
		const [row] = await db
			.select({
				id: transactions.id,
				orderId: transactions.orderId,
				branchId: transactions.branchId,
				paymentMethod: transactions.paymentMethod,
				amount: transactions.amount,
				status: transactions.status,
				createdAt: transactions.createdAt,
				orderNumber: orders.orderNumber,
				branchName: branches.name,
			})
			.from(transactions)
			.leftJoin(orders, eq(transactions.orderId, orders.id))
			.leftJoin(branches, eq(transactions.branchId, branches.id))
			.where(eq(transactions.id, id))
			.limit(1);
		return row ?? null;
	},

	create: async (payload: NewTransaction) => {
		const [row] = await db.insert(transactions).values(payload).returning();
		return row ?? null;
	},

	setStatus: async (id: string, status: string) => {
		const [row] = await db
			.update(transactions)
			.set({ status })
			.where(eq(transactions.id, id))
			.returning();
		return row ?? null;
	},
};
