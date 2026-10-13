import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sum } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import {
	emptyScope,
	getAccessibleBranchIds,
} from "../../access/index.js";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { transactions } from "../../db/schema/finance.js";
import { orders } from "../../db/schema/orders.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { containsPattern } from "../../lib/table.js";
import type { getTransactionsQuery } from "./model.js";

/**
 * Kolom yang boleh di-sort dari client (`sortBy` di luar ini diabaikan).
 */
const TRANSACTION_SORT_COLUMNS = {
	createdAt: transactions.createdAt,
	amount: transactions.amount,
	status: transactions.status,
	paymentMethod: transactions.paymentMethod,
} as const;

export const getTransactions = async (
	user: CurrentUser,
	params: typeof getTransactionsQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);
	const emptyPage = {
		...pageResult([], 0, page, pageSize),
		summary: {
			total: 0,
			totalAmount: "0",
			completedAmount: "0",
			refundedCount: 0,
		},
	};

	if (emptyScope(ids)) {
		return ok(emptyPage);
	}

	const conditions = [];

	if (params.branchId) {
		if (ids !== null && !ids.includes(params.branchId)) {
			return ok(emptyPage);
		}
		conditions.push(eq(transactions.branchId, params.branchId));
	} else if (ids !== null && ids.length > 0) {
		conditions.push(inArray(transactions.branchId, ids));
	}

	if (params.paymentMethod) {
		conditions.push(eq(transactions.paymentMethod, params.paymentMethod));
	}
	if (params.status) {
		conditions.push(eq(transactions.status, params.status));
	}
	if (params.dateFrom) {
		conditions.push(gte(transactions.createdAt, new Date(params.dateFrom)));
	}
	if (params.dateTo) {
		conditions.push(lte(transactions.createdAt, new Date(params.dateTo)));
	}

	const q = params.q?.trim();
	if (q) {
		const pattern = containsPattern(q);
		conditions.push(
			or(
				ilike(orders.orderNumber, pattern),
				ilike(branches.name, pattern),
				ilike(transactions.paymentMethod, pattern),
			),
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const sortCol =
		params.sortBy && params.sortBy in TRANSACTION_SORT_COLUMNS
			? TRANSACTION_SORT_COLUMNS[
					params.sortBy as keyof typeof TRANSACTION_SORT_COLUMNS
				]
			: transactions.createdAt;
	const orderBy = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

	const columns = {
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

	const [rows, [{ value: total }], statusGroups] = await Promise.all([
		db
			.select(columns)
			.from(transactions)
			.leftJoin(orders, eq(transactions.orderId, orders.id))
			.leftJoin(branches, eq(transactions.branchId, branches.id))
			.where(where)
			.orderBy(orderBy)
			.limit(pageSize)
			.offset(page * pageSize),
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

	let totalAmount = 0;
	let completedAmount = 0;
	let refundedCount = 0;
	for (const group of statusGroups) {
		totalAmount += Number(group.amount ?? 0);
		if (group.status === "completed")
			completedAmount = Number(group.amount ?? 0);
		else if (group.status === "refunded") refundedCount = group.value;
	}

	return ok({
		...pageResult(
			rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			total,
			page,
			pageSize,
		),
		summary: {
			total,
			totalAmount: String(totalAmount),
			completedAmount: String(completedAmount),
			refundedCount,
		},
	});
};

export const getTransactionDetail = async (user: CurrentUser, id: string) => {
	const [row] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.id, id))
		.limit(1);
	if (!row) return fail(404, "Transaction not found");
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(row.branchId))
		return fail(403, "Forbidden");
	const [detail] = await db
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
	return ok(detail ?? row);
};

export const recordTransaction = async (
	user: CurrentUser,
	data: {
		orderId: string;
		branchId: string;
		paymentMethod: string;
		amount: number;
	},
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(data.branchId))
		return fail(403, "Forbidden");
	const [row] = await db
		.insert(transactions)
		.values({
			orderId: data.orderId,
			branchId: data.branchId,
			paymentMethod: data.paymentMethod,
			amount: String(data.amount),
			status: "completed",
		} as never)
		.returning();
	return ok(row);
};

export const refundTransaction = async (
	user: CurrentUser,
	transactionId: string,
) => {
	const [existing] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.id, transactionId))
		.limit(1);
	if (!existing) return fail(404, "Transaction not found");
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(existing.branchId))
		return fail(403, "Forbidden");
	const [row] = await db
		.update(transactions)
		.set({ status: "refunded" } as never)
		.where(eq(transactions.id, transactionId))
		.returning();
	return ok(row);
};
